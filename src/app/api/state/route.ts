import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { SLOT_ORDER, type SlotId } from "@/lib/slots";

export async function GET() {
  const sql = await getDb();

  const components = (await sql`SELECT slot_id, active_version FROM components`) as {
    slot_id: SlotId;
    active_version: number;
  }[];
  const activeBySlot = new Map(components.map((c) => [c.slot_id, c.active_version]));

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

  const slots: Record<string, { version: number; code: string } | null> = {};
  for (const slotId of SLOT_ORDER) {
    const activeVersion = activeBySlot.get(slotId) ?? 0;
    const evolution = deployed.find((e) => e.slot_id === slotId && e.version === activeVersion);
    slots[slotId] = evolution ? { version: evolution.version, code: evolution.code } : null;
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
