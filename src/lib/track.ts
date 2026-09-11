import { getVisitorId } from "./visitor";
import type { SlotId } from "./slots";

export async function trackEvent(
  type: string,
  payload: Record<string, unknown> = {}
): Promise<SlotId | null> {
  try {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: getVisitorId(), type, payload }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { evolutionTriggered: SlotId | null };
    return data.evolutionTriggered;
  } catch {
    return null;
  }
}
