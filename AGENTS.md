<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:framework-rules -->
# Framework: Next.js App Router (PWA / Offline-First ERP & Showroom)

This is Next.js 16+ with the App Router. APIs differ significantly from
Pages Router. Read `node_modules/next/dist/docs/` before writing any code.
<!-- END:framework-rules -->

<!-- BEGIN:state-handoff-rules -->
# State Handoff & Continuity Protocol — MANDATORY

Every agent working in this codebase MUST follow the State Handoff Protocol to maintain project continuity, prevent regression, and track phase execution:

## Rules

1. **Mandatory Pre-Execution Reading**: Before writing any code, creating files, or modifying configuration, every agent MUST read `STATE_HANDOFF.md`, `AGENTS.md`, and `amen-mart-erp-website-plan.md` in full to understand:
   - The active project phase and execution status
   - Architectural decisions and constraints
   - Current schema and multi-tenant environment setup
   - Priority backlog items and recent session logs
2. **Mandatory Post-Execution Update**: At the conclusion of EVERY task or session, before running quality checks, committing, and pushing, the agent MUST update `STATE_HANDOFF.md` with:
   - Updated system execution state across all phases (Phases 1–5 and auxiliary modules)
   - Detailed changelog of the current session (files changed, rationale, problems solved)
   - Architectural decisions, conventions, or configuration updates
   - Immediate next actions and prioritized roadmap items for the next agent
3. **Execution Gate Sequence**:
   1. Read `STATE_HANDOFF.md`, `AGENTS.md`, and `amen-mart-erp-website-plan.md`
   2. Implement required changes and verify functionality
   3. Update `STATE_HANDOFF.md` with current session summary and phase execution status
   4. Run mandatory quality gates: `npm run check` (TypeScript typecheck + ESLint strict)
   5. Commit changes with a descriptive conventional commit message (`git commit`)
   6. Live Git Push to remote (`git push origin <branch>`) using company credentials
4. **Zero Debt / No Bypass**: Do not skip updating `STATE_HANDOFF.md`. A task is NOT complete until `STATE_HANDOFF.md` accurately reflects the exact state of the project, quality gates pass, and commits are pushed live to GitHub.
<!-- END:state-handoff-rules -->

<!-- BEGIN:code-quality-rules -->
# Code Quality Gates — MANDATORY

Every agent working in this codebase MUST run the following two commands
after making ANY code changes, before considering a task complete:

```powershell
npx tsc --noEmit
npx eslint "src/**/*.{ts,tsx}" --max-warnings 0
```

Or equivalently:

```powershell
npm run check
```

## Rules

1. **Both commands must exit with code 0.** A task is NOT done until both pass.
2. **TSC errors are blocking.** Fix them before finishing.
3. **ESLint errors are blocking.** Fix them before finishing.
4. **Never use `// eslint-disable-next-line` or `/* eslint-disable */`**
   to silence errors — fix the root cause instead.
5. **`react/no-unescaped-entities`** — Always use `&apos;` for `'` and
   `&quot;` for `"` in JSX text nodes. Never use bare apostrophes or quotes.
6. **`@next/next/no-html-link-for-pages`** — Always use `<Link>` from
   `next/link` for internal navigation, never a bare `<a>` tag.
7. **`react/no-children-prop`** — Never pass `children` as a JSX prop
   attribute. Use `<Component>{children}</Component>` instead.
8. **`no-require-imports`** — Always use ES `import` syntax at the top of
   the file. Never use `require()` inside function bodies.
9. **State Handoff Updated** — `STATE_HANDOFF.md` must be updated with the latest session log and phase status before concluding.
10. **Live Git Push** — Once `npm run check` passes, `STATE_HANDOFF.md` is updated, and changes are committed, the agent MUST push commits live to GitHub (`git push origin <branch>`). Work is never complete until pushed live to the remote repository.

## Pre-commit Hook

This repo has a Husky pre-commit hook that runs `lint-staged` on every
`git commit`. It will **block the commit** if any staged `.ts` or `.tsx`
file has ESLint errors. You cannot bypass this without `--no-verify`.

## Available Scripts

| Script | What it does |
|---|---|
| `npm run typecheck` | TypeScript type check only |
| `npm run lint` | ESLint on all `src/**/*.{ts,tsx}` |
| `npm run lint:strict` | ESLint strict — warnings also block |
| `npm run check` | Full gate: typecheck + lint:strict |
| `npm run prepare` | Re-installs Husky git hooks |
<!-- END:code-quality-rules -->

<!-- BEGIN:git-workflow-rules -->
# Git Live Remote Sync — MANDATORY

Every agent working on company projects MUST push changes to GitHub live at the end of every task execution, not only committing locally.

## Rules

1. **Remote Sync Required**: At the end of every task/feature execution, after quality gates pass (`npm run check`) and changes are committed, all commits MUST be pushed directly to GitHub (`git push origin main` or current branch).
2. **Company Credentials**: Always use company GitHub identity:
   - `user.name`: `Martin Cofie`
   - `user.email`: `devsurgeinfotech@gmail.com`
3. **No Unpushed Work**: An agent's task is NOT complete until all commits are live on the remote GitHub repository.
<!-- END:git-workflow-rules -->

<!-- BEGIN:project-conventions -->
# Project Conventions — AmenDesk

- **Project**: AmenDesk — Offline-First ERP & Website Showroom for Amen Mart
- **Currency**: GHS / Ghana Cedis (GH₵)
- **Language**: TypeScript only — no `.js` files in `src/`
- **Styling**: Tailwind CSS v4 — light theme by default with accessible dark mode toggle
- **Architecture**: Offline-first (local data store, background sync engine, robust offline printing & receipting)
- **Business Lines**:
  - Auction (Private, Government, Judicial — Movable & Immovable assets)
  - Car Dealership (direct vehicle sales)
  - Land (direct parcel sales)
  - Property (direct unit sales)
- **Payments**: Multi-mode receipting (Cash, MoMo [MTN/Vodafone/AirtelTigo via Hubtel], Bank Transfer, Card via Paystack)
<!-- END:project-conventions -->
