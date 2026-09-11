import { generateObject, generateText } from "ai";
import { z } from "zod";
import type { SlotSpec } from "./slots";

export const PLANNER_MODEL = "anthropic/claude-haiku-4.5";
export const BUILDER_MODEL = "anthropic/claude-sonnet-5";

const planSchema = z.object({
  shouldBuild: z.boolean(),
  reasoning: z
    .string()
    .describe("One or two plain sentences a shopper-facing changelog could show, explaining what was observed."),
  title: z.string().describe("Short name for this capability, e.g. 'Price filter'."),
});

export async function planEvolution(slot: SlotSpec, evidence: string[]) {
  const { object } = await generateObject({
    model: PLANNER_MODEL,
    schema: planSchema,
    prompt: `You are the planning stage of a self-evolving storefront named Nova.

A slot called "${slot.label}" exists at ${slot.target} but has no component yet. Its trigger condition is:
"${slot.triggerDescription}"

Recent evidence gathered from real visitor events:
${evidence.map((e) => `- ${e}`).join("\n")}

Decide if this is genuinely enough evidence to build the capability now. If yes, write a short, honest, plain-language reasoning a shopper-facing "what changed" log could show (no hype, no exclamation marks), and a short title.`,
  });
  return object;
}

export async function buildComponent(slot: SlotSpec, reasoning: string): Promise<string> {
  const { text } = await generateText({
    model: BUILDER_MODEL,
    prompt: `Write a single React component for a storefront slot.

Context: ${reasoning}

${slot.buildInstructions}

Props contract (do not redeclare it, just rely on it):
${slot.propsContract}

Hard rules:
- Output ONLY the component code, no markdown fences, no explanation.
- Define exactly one function: \`function Component(props) { ... }\`.
- No import, export, require, or dynamic import statements of any kind.
- No className, no inline style objects, no raw Tailwind — only compose these already-styled primitives, which are already in scope: SlotPanel, SlotLabel, SlotRow, SlotButton, SlotBadge, SlotRangeSlider, SlotTable.
- No fetch, no document/window access, no dangerouslySetInnerHTML.
- Use React hooks (useState, useMemo, etc. are in scope via the global React object as React.useState) only if truly needed.
- Keep it short and legible.`,
  });
  return stripCodeFences(text).trim();
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```[a-z]*\n([\s\S]*?)\n```$/i);
  return fenced ? fenced[1] : trimmed;
}
