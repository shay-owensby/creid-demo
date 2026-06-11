# Demo Dashboard

A zero-dependency local web dashboard for presenting the AI Real Estate Analyst skill & agent pack. Trigger skills from the browser, watch live agent activity stream in, and open generated reports — without touching the Claude Code CLI.

## Run it

```bash
node dashboard/server.js
```

Then open **http://localhost:4750**.

Requires Node 18+ and the `claude` CLI on your PATH. No `npm install` needed.

## How it works

- **Skills column** — auto-discovered from `.claude/skills/*/SKILL.md`. Enter an address (or other input) at the top, click **Run** on any skill.
- **Live Agent Activity** — each run spawns `claude -p "/<skill> <input>"` headlessly in this repo (with permissions bypassed, scoped to demo use) and streams its tool calls and narration via Server-Sent Events.
- **Reports column** — watches the repo root for `PROPERTY-*.md|html|pdf` files. New reports flash green as they land; click to open in the full-screen viewer (markdown rendered, HTML/PDF embedded).

## Presentation tips

- `realestate-quick` finishes in ~1–2 minutes — good for a live trigger.
- `realestate-analyze` launches 5 parallel agents — kick it off early in the talk and let the activity feed run while you present; the report appears when it's done.
- The existing Springfield sample reports are always available in the Reports column as a fallback.
