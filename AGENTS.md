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
