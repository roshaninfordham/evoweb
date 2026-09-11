import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { SLOT_ORDER, type SlotId } from "@/lib/slots";
import type { SlotState } from "@/lib/types";

export async function GET() {
  const sql = await getDb();

  const components = (await sql`SELECT slot_id, active_version, props_snapshot FROM components`) as {
    slot_id: SlotId;
    active_version: number;
    props_snapshot: Record<string, unknown> | null;
  }[];
  const bySlot = new Map(components.map((c) => [c.slot_id, c]));

  const deployed = (await sql`
    SELECT slot_id, version, title, reasoning, code, created_at
    FROM evolutions
    WHERE status = 'deployed'
    ORDER BY created_at ASC
  `) as {
    slot_id: SlotId;
    version: number;
    title: string;
    reasoning: string;
    code: string;
    created_at: string;
  }[];

  const slots: Record<string, SlotState> = {};
  for (const slotId of SLOT_ORDER) {
    const component = bySlot.get(slotId);
    const activeVersion = component?.active_version ?? 0;
    const evolution = deployed.find((e) => e.slot_id === slotId && e.version === activeVersion);
    slots[slotId] = evolution
      ? { version: evolution.version, code: evolution.code, propsSnapshot: component?.props_snapshot ?? null }
      : null;
  }

  const history = deployed.map((e) => ({
    slotId: e.slot_id,
    version: e.version,
    title: e.title,
    reasoning: e.reasoning,
    createdAt: e.created_at,
  }));

  return NextResponse.json({ slots, history });
}
