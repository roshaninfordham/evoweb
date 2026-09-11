# Nova — a store that builds itself

A minimal storefront that observes real visitor behavior and has a crew of
agents genuinely build, verify, and ship new UI capabilities into itself —
live. Built for the **You.com × One Hackathon: NYC Edition 002**.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how the pieces fit together
(diagram + why each sponsor tool is used where it is).

## Running it locally

Two processes, in two terminals:

```bash
# 1. the storefront (Next.js)
npm install
npm run dev

# 2. the crew (Python / FastAPI / CrewAI)
cd crew
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GEMINI_API_KEY, ONE_API_KEY
uvicorn main:app --port 8787
```

Open [http://localhost:3000](http://localhost:3000). Search with a price
budget, leave feedback, or open a couple of product details — each is a
real signal that can trigger an evolution, streamed live in the right-hand
engine panel.

## What's real here

- The generated component code is genuinely written by an LLM against a
  fixed props contract, genuinely type-checked inside an isolated Daytona
  sandbox, genuinely researched via You.com when relevant, and genuinely
  opened/reviewed/merged as a GitHub pull request by a second agent — not
  simulated for the demo.
- The one thing that is **not** left to an LLM: whether a markdown ever
  goes below cost (`src/lib/pricing.ts`) — that's plain deterministic code.
