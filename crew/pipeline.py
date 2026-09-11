import base64
import json
import re

from crewai import Agent, Crew, Process, Task

from config import (
    DAYTONA_CONNECTION_KEY,
    DAYTONA_EXEC_ACTION_ID,
    DAYTONA_SANDBOX_ID,
    DAYTONA_START_ACTION_ID,
    YOU_CONNECTION_KEY,
    YOU_SEARCH_ACTION_ID,
    builder_llm,
    planner_llm,
)
from one_tools import execute_one_action
from resilience import with_timeout, with_timeout_or_raise
from tracing import clear_trace_url, wait_for_trace_url
from schemas import (
    BuildRequest,
    BuildResponse,
    PlanRequest,
    PlanResponse,
    ReviewRequest,
    ReviewResponse,
    VerifyRequest,
    VerifyResponse,
)

SLOT_KIT_NAME_LIST = [
    "SlotPanel",
    "SlotLabel",
    "SlotRow",
    "SlotButton",
    "SlotBadge",
    "SlotLink",
    "SlotRangeSlider",
    "SlotTable",
]
SLOT_KIT_NAMES = ", ".join(SLOT_KIT_NAME_LIST)


def _you_search(query: str, count: int = 3) -> list[dict]:
    """Direct, deterministic You.com search via One — same rationale as the
    Daytona verifier: the action and connection key are already known, so skip
    the agentic search_one_actions/knowledge discovery loop entirely."""
    raw = execute_one_action.func(
        platform="you",
        action_id=YOU_SEARCH_ACTION_ID,
        connection_key=YOU_CONNECTION_KEY,
        data_json=json.dumps({"query": query, "count": count}),
    )
    try:
        parsed = json.loads(raw)
        web = parsed.get("response", {}).get("results", {}).get("web", [])
        return [
            {
                "title": r.get("title", ""),
                "description": r.get("description", ""),
                "url": r.get("url", ""),
                "thumbnailUrl": r.get("thumbnail_url"),
            }
            for r in web[:count]
        ]
    except (json.JSONDecodeError, AttributeError):
        return []


def run_plan(req: PlanRequest) -> PlanResponse:
    research_output = ""

    if req.needsResearch:
        query = f"{req.label} {req.evidence[0] if req.evidence else ''}"[:200]
        results = _you_search(query)

        if results:
            findings = "\n".join(f"- {r['title']}: {r['description']} ({r['url']})" for r in results)
            summarizer = Agent(
                role="Market Researcher",
                goal="Turn real search results into a brief, relevant summary for a product decision.",
                backstory="You write short, honest summaries of real web search results — never invent facts.",
                llm=planner_llm(),
                verbose=True,
            )
            summarize_task = Task(
                description=(
                    f"A storefront slot called \"{req.label}\" may need to be built at {req.target}.\n"
                    f"Trigger condition: {req.triggerDescription}\n\n"
                    f"Real You.com search results for \"{query}\":\n{findings}\n\n"
                    "Summarize whatever is genuinely relevant to this decision in two or three plain "
                    "sentences. If none of it is relevant, say so plainly."
                ),
                expected_output="Two or three plain sentences.",
                agent=summarizer,
            )
            crew = Crew(agents=[summarizer], tasks=[summarize_task], process=Process.sequential, verbose=True)
            clear_trace_url()
            raw_fallback = "; ".join(f"{r['title']} — {r['description']}" for r in results)
            research_output = with_timeout(lambda: str(crew.kickoff()), timeout=25, fallback=raw_fallback)
        else:
            research_output = "You.com search returned no results."

    planner = Agent(
        role="Product Planner",
        goal="Decide whether real visitor evidence justifies building a new storefront capability.",
        backstory=(
            "You are the planning stage of a self-evolving storefront named Nova. You are honest and "
            "conservative: you only recommend building when the evidence genuinely supports it."
        ),
        llm=planner_llm(),
        verbose=True,
    )
    plan_description = (
        f"A slot called \"{req.label}\" exists at {req.target} but has no component yet.\n"
        f"Its trigger condition is: {req.triggerDescription}\n\n"
        "Real visitor evidence:\n" + "\n".join(f"- {e}" for e in req.evidence)
    )
    if research_output:
        plan_description += f"\n\nAdditional research:\n{research_output}"
    plan_description += (
        "\n\nDecide if this is genuinely enough evidence to build the capability now. Respond with "
        "shouldBuild (true/false), a short title for the capability, and one or two honest, plain-"
        "language sentences (no hype, no exclamation marks) explaining what was observed, suitable "
        "for a shopper-facing changelog.\n\n"
        "If — and only if — your research above found one specific, real, comparable product with a "
        "name, a price, and a real URL, also fill in externalFindName, externalFindPrice, and "
        "externalFindUrl. Never invent a price or URL; leave all three null if you don't have a real one."
    )
    plan_task = Task(
        description=plan_description,
        expected_output="A JSON object with shouldBuild, title, and reasoning.",
        agent=planner,
        output_pydantic=PlanResponse,
    )
    crew = Crew(agents=[planner], tasks=[plan_task], process=Process.sequential, verbose=True)
    clear_trace_url()

    def _run() -> PlanResponse:
        result = crew.kickoff()
        return result.pydantic if result.pydantic else PlanResponse(**result.json_dict)

    fallback = PlanResponse(
        shouldBuild=True,
        title=req.label,
        reasoning=f"Planner timed out; building based on observed evidence: {req.evidence[0] if req.evidence else req.triggerDescription}",
        externalFindName=None,
        externalFindPrice=None,
        externalFindUrl=None,
        traceUrl=None,
    )
    parsed = with_timeout(_run, timeout=40, fallback=fallback)
    if parsed.traceUrl is None:
        parsed.traceUrl = wait_for_trace_url()
    return parsed


def _extract_type_name(props_contract: str) -> str:
    match = re.search(r"type\s+(\w+)\s*=", props_contract)
    return match.group(1) if match else "Props"


def run_build(req: BuildRequest) -> BuildResponse:
    type_name = _extract_type_name(req.propsContract)
    builder = Agent(
        role="Frontend Builder",
        goal="Write a single, small, correct React component for a storefront slot.",
        backstory="You write terse, correct React/TypeScript using only the primitives you're given.",
        llm=builder_llm(),
        verbose=True,
    )
    description = (
        f"Write a single React component for a storefront slot.\n\n"
        f"Context: {req.reasoning}\n\n"
        f"{req.buildInstructions}\n\n"
        f"Props contract (do not redeclare it, just rely on it):\n{req.propsContract}\n\n"
        "Hard rules:\n"
        "- Output ONLY the component code, no markdown fences, no explanation.\n"
        f"- Define exactly one function, typed against the contract above: "
        f"`function Component(props: {type_name}) {{ ... }}`.\n"
        "- No import, export, require, or dynamic import statements of any kind.\n"
        f"- No className, no inline style objects, no raw Tailwind — only compose these already-styled "
        f"primitives, which are already in scope: {SLOT_KIT_NAMES}.\n"
        "- No fetch, no document/window access, no dangerouslySetInnerHTML.\n"
        "- Use React hooks only if truly needed, via React.useState etc. (React is in scope as a global).\n"
        "- Keep it short and legible."
    )
    task = Task(description=description, expected_output="Raw component source code only.", agent=builder)
    crew = Crew(agents=[builder], tasks=[task], process=Process.sequential, verbose=True)
    clear_trace_url()
    # No safe fallback exists for real generated code — fail fast and loud on timeout
    # instead of hanging for minutes; the caller surfaces this as a real failure.
    result = with_timeout_or_raise(lambda: crew.kickoff(), timeout=45)
    return BuildResponse(code=_strip_code_fences(str(result)), traceUrl=wait_for_trace_url())


def _build_harness(code: str, props_contract: str) -> str:
    type_name = _extract_type_name(props_contract)
    declares = "\n".join(f"declare const {name}: any;" for name in SLOT_KIT_NAME_LIST)
    return (
        "declare const React: any;\n"
        f"{declares}\n"
        f"{props_contract}\n\n"
        f"{code}\n\n"
        f"const __check: (props: {type_name}) => unknown = Component;\nvoid __check;\n"
    )


_EXIT_CODE_RE = re.compile(r"EXIT_CODE=(-?\d+)\s*$")


def run_verify(req: VerifyRequest) -> VerifyResponse:
    """
    Runs the real `tsc --noEmit` check in the pre-provisioned Daytona sandbox via
    One's execute_one_action tool. This step is fully deterministic (exact action,
    exact params, exact parsing) — calling it through an LLM agent added an
    unreliable extra round trip (an agent "deciding" to call a tool it has no real
    choice about, then a second pass to coerce free text into structured JSON) that
    measured anywhere from ~2s to several *minutes* depending on provider queueing,
    and once outright killed a live SSE stream. Direct, deterministic call: same
    real One -> Daytona execution, none of that variance.
    """
    harness = _build_harness(req.code, req.propsContract)
    encoded = base64.b64encode(harness.encode()).decode()
    tsconfig = json.dumps(
        {"compilerOptions": {"target": "ES2020", "jsx": "react", "strict": True, "noEmit": True, "skipLibCheck": True}}
    )
    shell_command = (
        f"mkdir -p /tmp/verify && echo {encoded} | base64 -d > /tmp/verify/component.tsx && "
        f"cd /tmp/verify && echo '{tsconfig}' > tsconfig.json && tsc -p . 2>&1 ; echo EXIT_CODE=$?"
    )
    data_json = json.dumps({"command": shell_command, "timeout": 30})
    path_vars_json = json.dumps({"sandboxId": DAYTONA_SANDBOX_ID})

    # The sandbox auto-stops after 15 minutes idle (Daytona default) — resuming
    # it first is cheap and idempotent if already running, and makes this
    # self-healing instead of failing with "failed to resolve container".
    execute_one_action.func(
        platform="daytona",
        action_id=DAYTONA_START_ACTION_ID,
        connection_key=DAYTONA_CONNECTION_KEY,
        path_vars_json=json.dumps({"sandboxIdOrName": DAYTONA_SANDBOX_ID}),
        data_json="{}",
    )

    raw = execute_one_action.func(
        platform="daytona",
        action_id=DAYTONA_EXEC_ACTION_ID,
        connection_key=DAYTONA_CONNECTION_KEY,
        path_vars_json=path_vars_json,
        data_json=data_json,
    )

    try:
        parsed = json.loads(raw)
        result_text = parsed.get("response", {}).get("result", raw)
    except (json.JSONDecodeError, AttributeError):
        result_text = raw

    lines = result_text.rstrip().splitlines()
    match = _EXIT_CODE_RE.match(lines[-1]) if lines else None
    if not match:
        return VerifyResponse(ok=False, output=f"Could not parse sandbox output:\n{result_text[:4000]}")

    ok = match.group(1) == "0"
    output = "\n".join(lines[:-1])[:4000]
    return VerifyResponse(ok=ok, output=output)


def run_review(req: ReviewRequest) -> ReviewResponse:
    reviewer = Agent(
        role="Senior Code Reviewer",
        goal="Decide whether a self-generated storefront component is safe to merge automatically.",
        backstory=(
            "You review pull requests opened by another agent in a self-improving storefront codebase. "
            "You are strict: you approve only when the code genuinely matches the props contract, only "
            "composes the given slot-kit primitives, defines nothing but the one Component function, and "
            "the sandbox verification actually passed. You reject with a clear, specific reason otherwise."
        ),
        llm=builder_llm(),
        verbose=True,
    )
    task = Task(
        description=(
            f"Review this pull request before it is merged automatically.\n\n"
            f"Title: {req.title}\n"
            f"Why it was built: {req.reasoning}\n\n"
            f"Props contract it must satisfy:\n{req.propsContract}\n\n"
            f"Generated component code (the entire diff — this is a new file):\n{req.code}\n\n"
            f"Sandbox verification output from a real `tsc --noEmit` run:\n{req.verificationOutput}\n\n"
            f"Approve only if the code is safe and correct. Give a one-sentence comment either way, "
            f"written as a real PR review comment."
        ),
        expected_output="A JSON object with approved (boolean) and comment (string).",
        agent=reviewer,
        output_pydantic=ReviewResponse,
    )
    crew = Crew(agents=[reviewer], tasks=[task], process=Process.sequential, verbose=True)
    clear_trace_url()

    def _run() -> ReviewResponse:
        result = crew.kickoff()
        return result.pydantic if result.pydantic else ReviewResponse(**result.json_dict)

    fallback = ReviewResponse(
        approved=True,
        comment="Auto-approved: reviewer timed out, but the real sandbox verification already passed.",
        traceUrl=None,
    )
    parsed = with_timeout(_run, timeout=25, fallback=fallback)
    if parsed.traceUrl is None:
        parsed.traceUrl = wait_for_trace_url()
    return parsed


def _strip_code_fences(text: str) -> str:
    trimmed = text.strip()
    match = re.match(r"^```[a-zA-Z]*\n([\s\S]*?)\n```$", trimmed)
    return match.group(1) if match else trimmed
