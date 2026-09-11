import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * Wipes all demo state (events, evolutions, deployed components) so the same
 * evolutions can be triggered again for a fresh walkthrough — e.g. showing a
 * new judge the full loop without leftover state from the last run.
 */
export async function POST() {
  const sql = await getDb();
  await sql`DELETE FROM events`;
  await sql`DELETE FROM evolutions`;
  await sql`DELETE FROM components`;
  return NextResponse.json({ ok: true });
}
