import type { SlotSpec } from "./slots";

const CREW_URL = process.env.CREW_SERVICE_URL ?? "http://localhost:8000";

export type Plan = {
  shouldBuild: boolean;
  title: string;
  reasoning: string;
  externalFindName: string | null;
  externalFindPrice: number | null;
  externalFindUrl: string | null;
};

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${CREW_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`crew service ${path} failed (${res.status}): ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function planEvolution(
  slot: SlotSpec,
  evidence: string[],
  needsResearch: boolean = slot.needsResearch
): Promise<Plan> {
  return postJSON<Plan>("/plan", {
    label: slot.label,
    target: slot.target,
    triggerDescription: slot.triggerDescription,
    evidence,
    needsResearch,
  });
}

export async function buildComponent(slot: SlotSpec, reasoning: string): Promise<string> {
  const { code } = await postJSON<{ code: string }>("/build", {
    label: slot.label,
    propsContract: slot.propsContract,
    buildInstructions: slot.buildInstructions,
    reasoning,
  });
  return code;
}

export async function reviewCode(params: {
  title: string;
  reasoning: string;
  code: string;
  propsContract: string;
  verificationOutput: string;
}): Promise<{ approved: boolean; comment: string }> {
  return postJSON("/review", params);
}
