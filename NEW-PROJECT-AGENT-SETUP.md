# New Project — Pre-Agent Setup Checklist

Save this file at the root of every new project. Complete every section **before** inviting any agent or developer to write code.

---

## Why This Matters

Without this setup, agents accumulate technical debt silently:
- ESLint errors grow unchecked (reached 1,797 in one project)
- Type safety degrades gradually
- Bad commits enter the repo with no gate to stop them
- Each cleanup session costs hours instead of 10 minutes upfront

This guide takes ~20–30 minutes on day one and saves days of remediation.

---

## Checklist Overview

- [ ] 1. TypeScript — strict mode
- [ ] 2. ESLint — strict config
- [ ] 3. Husky + lint-staged — pre-commit hook
- [ ] 4. `package.json` — quality gate scripts
- [ ] 5. `AGENTS.md` — agent instruction file
- [ ] 6. `.gitignore` — sanity check
- [ ] 7. Verify the full stack works

---

## 1. TypeScript — Strict Mode

Open `tsconfig.json` and ensure these compiler options are set:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": false
  }
}
```

> **Why strict from day one?** Once a codebase grows, enabling `strict` later breaks hundreds of files. Starting strict costs almost nothing.

Verify it is clean:
```powershell
npx tsc --noEmit
```
Expected: no output, exit code 0.

---

## 2. ESLint — Strict Config

### Install ESLint (if not already present)
```powershell
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

For Next.js projects specifically:
```powershell
npm install --save-dev eslint-config-next
```

### Create `eslint.config.mjs`

For a **Next.js + TypeScript** project:

```js
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
]

export default eslintConfig
```

For a **plain TypeScript / Node** project:

```js
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tsparser },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
]
```

### Verify ESLint is clean on a fresh project

```powershell
npx eslint "src/**/*.{ts,tsx}" --max-warnings 0
```
Expected: exit code 0 (no errors, no warnings on a fresh project).

---

## 3. Husky + lint-staged — Pre-Commit Hook

This is the **hardest gate** — it blocks `git commit` itself if any staged file has errors.

### Install

```powershell
npm install --save-dev husky lint-staged
```

### Initialize Husky

```powershell
npx husky init
```

This creates `.husky/` and sets `hooksPath` in `.git/config`.

### Write the Pre-Commit Hook

Replace the contents of `.husky/pre-commit` with:

```sh
npx lint-staged
```

### Configure lint-staged in `package.json`

Add this block to `package.json` (at the top level, not inside `scripts`):

```json
"lint-staged": {
  "src/**/*.{ts,tsx}": [
    "eslint --max-warnings 0"
  ]
}
```

> **How lint-staged works:** On each `git commit`, it runs ESLint **only on the files you staged** (fast, ~5–10 seconds). If any staged file has an ESLint error, the commit is rejected. The developer/agent must fix the error before the commit is accepted.

---

## 4. `package.json` — Quality Gate Scripts

Add these scripts to your `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "typecheck": "tsc --noEmit",
  "lint": "eslint \"src/**/*.{ts,tsx}\"",
  "lint:strict": "eslint \"src/**/*.{ts,tsx}\" --max-warnings 0",
  "check": "tsc --noEmit && eslint \"src/**/*.{ts,tsx}\" --max-warnings 0",
  "prepare": "husky"
}
```

| Script | Purpose |
|---|---|
| `npm run typecheck` | TypeScript check only — fast |
| `npm run lint` | ESLint with warnings visible |
| `npm run lint:strict` | ESLint — errors AND warnings block |
| `npm run check` | **Full gate** — run this before finishing any task |
| `npm run prepare` | Automatically re-installs husky after `npm install` |

> The `prepare` script ensures husky is reinstalled whenever a new developer or agent runs `npm install` on a fresh clone.

---

## 5. `AGENTS.md` — Agent Instruction File

Create `AGENTS.md` at the project root. This file is read by AI agents (Antigravity, Codex, Claude Code, etc.) before they start working. It is the most direct way to enforce standards at the agent level.

Copy and adapt this template:

```markdown
<!-- BEGIN:framework-rules -->
# Framework: [Next.js / React / Node / etc.]

[Add any framework-specific gotchas here. For example:]
This is Next.js 15+ with the App Router. APIs differ significantly from
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
<!-- END:code-quality-rules -->

<!-- BEGIN:project-conventions -->
# Project Conventions

[Add your project-specific rules here. Examples:]

- Currency: GHS / Ghana Cedis
- Language: TypeScript only — no `.js` files in `src/`
- Styling: Tailwind CSS — no inline style objects except for dynamic values
- Database: Supabase — always use server client in Server Components
- Auth: [your auth solution]
- Components: [your component library]
<!-- END:project-conventions -->
```

---

## 6. `.gitignore` — Sanity Check

Make sure these are in `.gitignore`:

```
# Dependencies
node_modules/

# Build output
.next/
dist/
build/

# Environment — NEVER commit secrets
.env
.env.local
.env.*.local

# Debug
npm-debug.log*

# OS
.DS_Store
Thumbs.db
```

---

## 7. Verify the Full Stack

Run these commands in order. All must pass before inviting any agent.

```powershell
# 1. TypeScript — must exit 0
npx tsc --noEmit
echo "TSC: $LASTEXITCODE"

# 2. ESLint — must exit 0
npx eslint "src/**/*.{ts,tsx}" --max-warnings 0
echo "ESLint: $LASTEXITCODE"

# 3. Husky — hook file must exist and contain lint-staged
Get-Content ".husky/pre-commit"

# 4. Git hooks path — must point to .husky/_
git config core.hooksPath

# 5. Test the commit gate (stage a file, try to commit)
git add .
git commit -m "chore: setup quality gates" --dry-run
```

If all of these pass, your enforcement stack is ready.

---

## Quick Reference Card

```
New Project Checklist
─────────────────────
□ tsconfig.json       → "strict": true
□ eslint.config.mjs   → rules configured
□ .husky/pre-commit   → npx lint-staged
□ package.json        → lint-staged config block
□ package.json        → check, typecheck, lint, lint:strict scripts
□ AGENTS.md           → mandatory quality gate rules
□ npm run check       → exits 0 ✅
```

---

## Common Mistakes to Avoid

| Mistake | Consequence | Fix |
|---|---|---|
| No `AGENTS.md` | Agents skip linting — errors accumulate | Always create before first agent session |
| No husky | Bad code enters repo unchecked | `npx husky init` on day one |
| `lint-staged` only lints errors, not warnings | Warnings grow into 1,000s silently | Use `--max-warnings 0` in lint-staged config |
| Enabling `strict` late | Hundreds of type errors to fix | Enable in `tsconfig.json` at project creation |
| Not running `npm run check` at task end | Agent ships incomplete/broken work | Make it the last step in AGENTS.md rules |
| `eslint-disable` comments | Hides real problems | Fix the root cause instead |

---

*Created for KehillahOS — reuse this in every new project.*
