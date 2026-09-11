<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## One CLI — Platform Integrations

The One CLI (`one`) is installed and authenticated globally on this machine
(account: rsusny@gmail.com). It gives an agent access to 750+ third-party
platforms (Gmail, Slack, Shopify, HubSpot, Stripe, GitHub, Notion,
Salesforce, You.com, Daytona, etc.) through one unified interface.

Whenever a task needs a real third-party platform action, use the One CLI
rather than a platform-specific SDK. Always pass `--agent` for structured
JSON output.

Workflow (always in this order — never skip the knowledge step):
1. `one --agent connection list` — see connected platforms and connection keys
2. `one --agent actions search <platform> "<query>"` — find the right action
3. `one --agent actions knowledge <platform> <actionId>` — read exact params (REQUIRED before execute)
4. `one --agent actions execute <platform> <actionId> <connectionKey> -d '{...}'` — run it for real

Connecting a new platform (`one add <platform>`) requires interactive
input (browser OAuth or a prompted API key) and can't be run
non-interactively — ask the human to run it themselves, then verify with
`one --agent connection list`.

Currently connected: hubspot. Always confirm with the user before any
destructive or side-effecting action (sending messages, creating/deleting
records, payments, etc.) — read-only lookups don't need per-call confirmation.

