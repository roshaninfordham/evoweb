import type { SlotId } from "./slots";
import type { SourceKey } from "./sources";

export type SourceRef = SourceKey | { key: SourceKey; href: string };

export type LogEntry = {
  id: string;
  ts: string;
  label: string;
  state: "running" | "done" | "failed";
  agent?: string;
  href?: string;
  sources?: SourceRef[];
  code?: string;
};

export type HistoryEntry = {
  slotId: SlotId;
  version: number;
  title: string;
  reasoning: string;
  createdAt: string;
};

export type SlotState = { version: number; code: string; propsSnapshot: Record<string, unknown> | null } | null;

export type AgentStatus = "idle" | "active" | "done" | "failed";

export const AGENT_ROSTER = [
  "Observer",
  "Market Researcher",
  "Product Planner",
  "Frontend Builder",
  "Sandbox Verifier",
  "Senior Code Reviewer",
  "Evolution Engine",
] as const;

export type AgentName = (typeof AGENT_ROSTER)[number];
