import base64
import json
import re

from crewai import Agent, Crew, Process, Task

from config import (
    DAYTONA_CONNECTION_KEY,
    DAYTONA_EXEC_ACTION_ID,
    DAYTONA_SANDBOX_ID,
    builder_llm,
    planner_llm,
)
from one_tools import ONE_TOOLS
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

ONE_WORKFLOW = (
    "You reach real external services only through One. Workflow: call list_one_connections to find "
    "the connection key for the platform you need, then search_one_actions(platform, query) to find "
    "the right action id, then get_one_action_knowledge(platform, action_id) to see exactly what "
    "parameters it takes and where each one goes (path variable, query parameter, or body field), then "
    "execute_one_action(platform, action_id, connection_key, path_vars_json, query_params_json, "
    "data_json) to actually run it — put each parameter in the JSON argument matching its location as "
    "the knowledge doc says (a URL placeholder like {sandboxId} goes in path_vars_json, not data_json). "
    "Never skip get_one_action_knowledge before executing, and never fabricate a result — if a call "
    "fails, read the error and correct the specific parameter it names."
)


def run_plan(req: PlanRequest) -> PlanResponse:
    research_output = ""

    if req.needsResearch:
        researcher = Agent(
            role="Market Researcher",
            goal="Find brief, real, current context that helps decide whether to build a new storefront capability.",
            backstory=(
                "You have access to One, which connects to 750+ platforms including You.com (platform "
                f"slug: 'you'). {ONE_WORKFLOW}"
            ),
            tools=ONE_TOOLS,
            llm=planner_llm(),
            verbose=True,
        )
        research_task = Task(
            description=(
                f"A storefront slot called \"{req.label}\" may need to be built at {req.target}.\n"
                f"Trigger condition: {req.triggerDescription}\n"
                "Real visitor evidence:\n" + "\n".join(f"- {e}" for e in req.evidence) + "\n\n"
                "Use You.com (platform 'you') through One to search the web for one or two brief, real, "
                "relevant, current facts that would help decide whether and how to build this capability. "
                "Keep it short."
            ),
            expected_output="Two or three plain sentences summarizing what you found, or 'No relevant results found.'",
            agent=researcher,
        )
        crew = Crew(agents=[researcher], tasks=[research_task], process=Process.sequential, verbose=True)
        research_output = str(crew.kickoff())

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
    result = crew.kickoff()
    return result.pydantic if result.pydantic else PlanResponse(**result.json_dict)


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
    result = crew.kickoff()
    return BuildResponse(code=_strip_code_fences(str(result)))


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


def run_verify(req: VerifyRequest) -> VerifyResponse:
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

    verifier = Agent(
        role="Sandbox Verifier",
        goal="Actually run a real typecheck of generated code inside a Daytona sandbox and report the true result.",
        backstory=(
            "You have access to One's execute_one_action tool, which reaches Daytona (platform slug: "
            "'daytona') for running commands in a real, already-running sandbox. Never fabricate a "
            "result — only report what the tool actually returns."
        ),
        tools=ONE_TOOLS,
        llm=builder_llm(),
        verbose=True,
    )
    task = Task(
        description=(
            "Call execute_one_action with EXACTLY these arguments — do not modify them, do not look up "
            "actions, do not call any other tool first:\n"
            f'platform="daytona"\n'
            f'action_id="{DAYTONA_EXEC_ACTION_ID}"\n'
            f'connection_key="{DAYTONA_CONNECTION_KEY}"\n'
            f"path_vars_json='{path_vars_json}'\n"
            f"data_json='{data_json}'\n\n"
            "If that call fails because the connection key is stale, call list_one_connections to get "
            "the current daytona connection key and retry once with that key instead.\n\n"
            "The tool's response contains a `result` string with the raw compiler output, ending with "
            "a line like `EXIT_CODE=0` or `EXIT_CODE=<nonzero>`. Set ok=true only if EXIT_CODE=0. Set "
            "output to the compiler output text (everything before the EXIT_CODE line), truncated to "
            "4000 characters. Never claim a passing check you didn't actually see EXIT_CODE=0 for."
        ),
        expected_output="A JSON object with ok (boolean) and output (string, the compiler output).",
        agent=verifier,
        output_pydantic=VerifyResponse,
    )
    crew = Crew(agents=[verifier], tasks=[task], process=Process.sequential, verbose=True)
    result = crew.kickoff()
    return result.pydantic if result.pydantic else VerifyResponse(**result.json_dict)


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
    result = crew.kickoff()
    return result.pydantic if result.pydantic else ReviewResponse(**result.json_dict)


def _strip_code_fences(text: str) -> str:
    trimmed = text.strip()
    match = re.match(r"^```[a-zA-Z]*\n([\s\S]*?)\n```$", trimmed)
    return match.group(1) if match else trimmed
