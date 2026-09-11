import type { SlotId } from "./slots";
import type { SourceKey } from "./sources";

export type LogEntry = {
  id: string;
  ts: string;
  label: string;
  state: "running" | "done" | "failed";
  agent?: string;
  href?: string;
  sources?: SourceKey[];
};

export type HistoryEntry = {
  slotId: SlotId;
  version: number;
  title: string;
  reasoning: string;
  createdAt: string;
};

export type SlotState = { version: number; code: string; propsSnapshot: Record<string, unknown> | null } | null;
