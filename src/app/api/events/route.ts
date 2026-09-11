import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { findTriggeredSlot } from "@/lib/triggers";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const visitorId = body?.visitorId;
  const type = body?.type;
  const payload = body?.payload ?? {};

  if (!visitorId || !type) {
    return NextResponse.json({ error: "visitorId and type are required" }, { status: 400 });
  }

  const sql = await getDb();
  await sql`
    INSERT INTO events (visitor_id, type, payload)
    VALUES (${visitorId}, ${type}, ${JSON.stringify(payload)})
  `;

  const evolutionTriggered = await findTriggeredSlot();
  return NextResponse.json({ evolutionTriggered });
}
