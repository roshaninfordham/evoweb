import { getDb } from "./db";
import type { SlotId } from "./slots";

type EventRow = {
  type: string;
  payload: Record<string, unknown>;
};

async function isSlotActive(slotId: SlotId): Promise<boolean> {
  const sql = await getDb();
  const rows = await sql`SELECT active_version FROM components WHERE slot_id = ${slotId}`;
  return (rows[0]?.active_version ?? 0) > 0;
}

export async function getEvidenceForSlot(slotId: SlotId): Promise<string[]> {
  const sql = await getDb();

  if (slotId === "price-filter") {
    const rows = (await sql`
      SELECT type, payload FROM events
      WHERE type IN ('search_price_intent', 'feedback_price')
      ORDER BY created_at DESC
      LIMIT 5
    `) as EventRow[];
    return rows.map((r) =>
      r.type === "search_price_intent"
        ? `Visitor searched "${r.payload.query}" looking for something under $${r.payload.maxPrice}.`
        : `Visitor left feedback: "${r.payload.text}"`
    );
  }

  if (slotId === "compare-products") {
    const rows = (await sql`
      SELECT DISTINCT payload->>'productName' AS name FROM events
      WHERE type = 'view_product'
    `) as { name: string }[];
    if (rows.length < 2) return [];
    return [
      `Visitor opened detail views on ${rows.length} different products in this visit: ${rows
        .map((r) => r.name)
        .join(", ")}.`,
    ];
  }

  return [];
}

export async function findTriggeredSlot(): Promise<SlotId | null> {
  const candidates: SlotId[] = ["price-filter", "compare-products"];
  for (const slotId of candidates) {
    if (await isSlotActive(slotId)) continue;
    const evidence = await getEvidenceForSlot(slotId);
    if (evidence.length > 0) return slotId;
  }
  return null;
}
