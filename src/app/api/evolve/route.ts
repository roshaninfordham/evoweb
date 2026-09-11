import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { SLOTS, type SlotId, type SlotSpec } from "@/lib/slots";
import { getBudgetContext, getEvidenceForSlot } from "@/lib/triggers";
import { planEvolution, buildComponent, reviewCode, type Plan } from "@/lib/ai";
import { verifyComponent } from "@/lib/sandbox";
import { createSSEStream } from "@/lib/sse";
import type { BudgetOffer } from "@/lib/pricing";
import { commentOnPR, mergePR, openEvolutionPR } from "@/lib/git";

async function runSoftwareFactoryStage(
  slot: SlotSpec,
  version: number,
  plan: Plan,
  code: string,
  verificationOutput: string,
  send: (event: string, data: unknown) => void
) {
  try {
    send("pr_open_start", { agent: "Evolution Engine" });
    const { prUrl, branch } = await openEvolutionPR({
      slotId: slot.id,
      version,
      title: plan.title,
      reasoning: plan.reasoning,
      code,
    });
    send("pr_open_done", { prUrl, branch });

    send("review_start", { agent: "Senior Code Reviewer" });
    const review = await reviewCode({
      title: plan.title,
      reasoning: plan.reasoning,
      code,
      propsContract: slot.propsContract,
      verificationOutput,
    });
    send("review_done", { approved: review.approved, comment: review.comment, traceUrl: review.traceUrl });

    if (review.approved) {
      await mergePR(prUrl);
      send("pr_merged", { prUrl });
    } else {
      await commentOnPR(prUrl, review.comment);
      send("pr_left_open", { prUrl, comment: review.comment });
    }
  } catch (err) {
    send("pr_failed", { message: err instanceof Error ? err.message : String(err) });
  }
}

function buildPropsSnapshot(
  slotId: SlotId,
  budgetContext: { budget: number; offer: BudgetOffer | null } | null,
  plan: Plan
): Record<string, unknown> | null {
  if (slotId !== "budget-match" || !budgetContext) return null;
  return {
    budget: budgetContext.budget,
    internalOffer: budgetContext.offer,
    externalFind:
      plan.externalFindName && plan.externalFindPrice != null && plan.externalFindUrl
        ? { name: plan.externalFindName, price: plan.externalFindPrice, url: plan.externalFindUrl }
        : null,
  };
}

export const maxDuration = 300;

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

export async function GET(req: NextRequest) {
  const slotId = req.nextUrl.searchParams.get("slotId") as SlotId | null;
  const slot = slotId ? SLOTS[slotId] : undefined;
  const { stream, send, close } = createSSEStream();

  if (!slot) {
    send("error", { message: "unknown slot" });
    close();
    return new Response(stream, { headers: SSE_HEADERS });
  }

  runPipeline(slot, send, close);

  return new Response(stream, { headers: SSE_HEADERS });
}

async function runPipeline(
  slot: SlotSpec,
  send: (event: string, data: unknown) => void,
  close: () => void
) {
  try {
    const sql = await getDb();

    const existing = await sql`SELECT active_version FROM components WHERE slot_id = ${slot.id}`;
    if ((existing[0]?.active_version ?? 0) > 0) {
      send("skip", { message: "already deployed" });
      return;
    }

    const evidence = await getEvidenceForSlot(slot.id);
    if (evidence.length === 0) {
      send("skip", { message: "no evidence yet" });
      return;
    }
    send("observe", { agent: "Observer", evidence });

    const versionRow = await sql`
      SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM evolutions WHERE slot_id = ${slot.id}
    `;
    const version = Number(versionRow[0].next_version);
    await sql`INSERT INTO evolutions (slot_id, version, status) VALUES (${slot.id}, ${version}, 'planning')`;

    const budgetContext = slot.id === "budget-match" ? await getBudgetContext() : null;
    const needsResearch = slot.id === "budget-match" ? budgetContext?.offer == null : slot.needsResearch;

    send("plan_start", { agents: needsResearch ? ["Market Researcher", "Product Planner"] : ["Product Planner"] });
    const plan = await planEvolution(slot, evidence, needsResearch);
    send("plan_done", plan);

    if (!plan.shouldBuild) {
      await sql`UPDATE evolutions SET status = 'skipped', reasoning = ${plan.reasoning} WHERE slot_id = ${slot.id} AND version = ${version}`;
      send("skip", { message: "planner found insufficient evidence" });
      return;
    }

    await sql`
      UPDATE evolutions SET status = 'building', reasoning = ${plan.reasoning}, title = ${plan.title}
      WHERE slot_id = ${slot.id} AND version = ${version}
    `;

    send("build_start", { agent: "Frontend Builder", attempt: 1 });
    let built = await buildComponent(slot, plan.reasoning);
    let code = built.code;
    send("build_done", { attempt: 1, code, traceUrl: built.traceUrl });

    send("verify_start", { agent: "Sandbox Verifier", attempt: 1 });
    let verification = await verifyComponent(code, slot.propsContract);
    send(verification.ok ? "verify_done" : "verify_failed", { attempt: 1, output: verification.output });

    if (!verification.ok) {
      send("build_start", { agent: "Frontend Builder", attempt: 2 });
      built = await buildComponent(
        slot,
        `${plan.reasoning}\n\nA previous attempt failed to typecheck. Fix this error and try again:\n${verification.output}`
      );
      code = built.code;
      send("build_done", { attempt: 2, code, traceUrl: built.traceUrl });

      send("verify_start", { agent: "Sandbox Verifier", attempt: 2 });
      verification = await verifyComponent(code, slot.propsContract);
      send(verification.ok ? "verify_done" : "verify_failed", { attempt: 2, output: verification.output });
    }

    if (!verification.ok) {
      await sql`
        UPDATE evolutions SET status = 'failed', code = ${code}, error = ${verification.output}
        WHERE slot_id = ${slot.id} AND version = ${version}
      `;
      send("failed", { output: verification.output });
      return;
    }

    const propsSnapshot = buildPropsSnapshot(slot.id, budgetContext, plan);

    await sql`UPDATE evolutions SET status = 'deployed', code = ${code} WHERE slot_id = ${slot.id} AND version = ${version}`;
    await sql`
      INSERT INTO components (slot_id, active_version, props_snapshot)
      VALUES (${slot.id}, ${version}, ${propsSnapshot ? JSON.stringify(propsSnapshot) : null})
      ON CONFLICT (slot_id) DO UPDATE SET
        active_version = ${version}, props_snapshot = ${propsSnapshot ? JSON.stringify(propsSnapshot) : null}, updated_at = now()
    `;

    send("deployed", {
      slotId: slot.id,
      version,
      code,
      title: plan.title,
      reasoning: plan.reasoning,
      propsSnapshot,
    });

    await runSoftwareFactoryStage(slot, version, plan, code, verification.output, send);
  } catch (err) {
    send("error", { message: err instanceof Error ? err.message : String(err) });
  } finally {
    close();
  }
}
