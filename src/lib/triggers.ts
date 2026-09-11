import { getDb } from "./db";
import { computeBudgetOffer, cheapestPrice, type BudgetOffer } from "./pricing";
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

async function getLatestBudget(): Promise<number | null> {
  const sql = await getDb();
  const rows = (await sql`
    SELECT payload FROM events
    WHERE type IN ('search_price_intent', 'feedback_price')
    ORDER BY created_at DESC
    LIMIT 1
  `) as { payload: Record<string, unknown> }[];
  const value = rows[0]?.payload?.maxPrice;
  return typeof value === "number" ? value : null;
}

export async function getEvidenceForSlot(slotId: SlotId): Promise<string[]> {
  const sql = await getDb();

  if (slotId === "price-filter") {
    const floor = cheapestPrice();
    const rows = (await sql`
      SELECT type, payload FROM events
      WHERE type IN ('search_price_intent', 'feedback_price')
      ORDER BY created_at DESC
      LIMIT 5
    `) as EventRow[];
    const helpful = rows.filter(
      (r) => r.type !== "search_price_intent" || Number(r.payload.maxPrice) >= floor
    );
    return helpful.map((r) =>
      r.type === "search_price_intent"
        ? `Visitor searched "${r.payload.query}" looking for something under $${r.payload.maxPrice}.`
        : `Visitor left feedback: "${r.payload.text}"`
    );
  }

  if (slotId === "budget-match") {
    const budget = await getLatestBudget();
    if (budget === null || budget >= cheapestPrice()) return [];
    const offer = computeBudgetOffer(budget);
    return [
      offer
        ? `Visitor's budget was $${budget}, below every listed price. A safe markdown is possible: ${offer.name} can be offered at $${offer.offerPrice} (normally $${offer.originalPrice}) without selling below cost.`
        : `Visitor's budget was $${budget}, below every listed price, and no product can be discounted that low without a loss. An external alternative should be researched.`,
    ];
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

export async function getBudgetContext(): Promise<{ budget: number; offer: BudgetOffer | null } | null> {
  const budget = await getLatestBudget();
  if (budget === null) return null;
  return { budget, offer: computeBudgetOffer(budget) };
}

export async function findTriggeredSlot(): Promise<SlotId | null> {
  const candidates: SlotId[] = ["price-filter", "budget-match", "compare-products"];
  for (const slotId of candidates) {
    if (await isSlotActive(slotId)) continue;
    const evidence = await getEvidenceForSlot(slotId);
    if (evidence.length > 0) return slotId;
  }
  return null;
}
