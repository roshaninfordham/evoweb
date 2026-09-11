const CREW_URL = process.env.CREW_SERVICE_URL ?? "http://localhost:8000";

const BANNED_PATTERNS: RegExp[] = [
  /className\s*=/,
  /\bfetch\s*\(/,
  /\bdocument\./,
  /\bwindow\./,
  /\beval\s*\(/,
  /dangerouslySetInnerHTML/,
  /\brequire\s*\(/,
  /\bimport\s*\(/,
  /^\s*import\s/m,
  /^\s*export\s/m,
];

export function staticSafetyCheck(code: string): string | null {
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(code)) {
      return `Generated code matched a disallowed pattern (${pattern}). Only use the given primitives, no imports/exports/DOM/network access.`;
    }
  }
  if (!/function\s+Component\s*\(/.test(code)) {
    return "Generated code must define exactly one function named `Component(props)`.";
  }
  return null;
}

export async function verifyComponent(
  code: string,
  propsContract: string
): Promise<{ ok: boolean; output: string }> {
  const safetyError = staticSafetyCheck(code);
  if (safetyError) return { ok: false, output: safetyError };

  const res = await fetch(`${CREW_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, propsContract }),
  });
  if (!res.ok) {
    return { ok: false, output: `verifier service failed (${res.status}): ${await res.text()}` };
  }
  return res.json() as Promise<{ ok: boolean; output: string }>;
}
