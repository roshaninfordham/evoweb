import { Sandbox } from "@vercel/sandbox";

const SANDBOX_NAME = "evoweb-verify";

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

let sandboxPromise: Promise<Sandbox> | null = null;

async function getSandbox(): Promise<Sandbox> {
  if (!sandboxPromise) {
    sandboxPromise = Sandbox.getOrCreate({
      name: SANDBOX_NAME,
      runtime: "node24",
      timeout: 10 * 60 * 1000,
      persistent: true,
      onCreate: async (sbx) => {
        await sbx.writeFiles([
          {
            path: "package.json",
            content: JSON.stringify({ name: "evoweb-verify", private: true }, null, 2),
          },
          {
            path: "tsconfig.json",
            content: JSON.stringify(
              {
                compilerOptions: {
                  target: "ES2020",
                  lib: ["ES2020", "DOM"],
                  jsx: "react",
                  strict: true,
                  noEmit: true,
                  skipLibCheck: true,
                  moduleResolution: "bundler",
                  esModuleInterop: true,
                },
                include: ["*.tsx"],
              },
              null,
              2
            ),
          },
        ]);
        const install = await sbx.runCommand("npm", [
          "install",
          "--no-audit",
          "--no-fund",
          "typescript@5",
          "react@19",
          "@types/react@19",
        ]);
        if (install.exitCode !== 0) {
          throw new Error(`sandbox setup failed: ${await install.stderr()}`);
        }
      },
    });
  }
  return sandboxPromise;
}

function contractTypeName(contract: string): string {
  const match = contract.match(/type\s+(\w+)\s*=/);
  if (!match) throw new Error("propsContract must declare `type <Name> = ...`");
  return match[1];
}

export async function verifyComponent(
  code: string,
  propsContract: string
): Promise<{ ok: boolean; output: string }> {
  const safetyError = staticSafetyCheck(code);
  if (safetyError) return { ok: false, output: safetyError };

  const typeName = contractTypeName(propsContract);
  const harness = `${propsContract}\n\n${code}\n\nconst __check: (props: ${typeName}) => unknown = Component;\nvoid __check;\n`;

  const sbx = await getSandbox();
  await sbx.writeFiles([{ path: "component.tsx", content: harness }]);
  const result = await sbx.runCommand("npx", ["tsc", "--noEmit"]);
  const output = await result.output("both");
  return { ok: result.exitCode === 0, output: output.slice(0, 4000) };
}
