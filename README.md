# AmenDesk — Offline-First ERP & Website Showroom

AmenDesk is an offline-first enterprise resource planning (ERP) system and public showroom website built for **Amen Mart Auctioning Services** by **Dev Surge Infotech Ltd.**

Amen Mart operates under statutory authorization from the **Ministry of the Interior** and the **Auctioneers Registration Board**, and is affiliated with the **Ghana Auctioneers Association (GAA)**. The platform encompasses three distinct auction categories (**Private**, **Government**, and **Judicial**) alongside direct sales in **Car Dealership**, **Land**, and **Property**.

---

## ⚠️ Mandatory Agent Continuity & State Handoff

Every agent and developer working in this repository MUST follow the continuity rules:

1. **Read Before Proceeding**:
   - [`STATE_HANDOFF.md`](./STATE_HANDOFF.md) — Current implementation state, completed phases, and priority backlog.
   - [`AGENTS.md`](./AGENTS.md) — Mandatory code quality gates, state handoff protocol, and git live push rules.
   - [`amen-mart-erp-website-plan.md`](./amen-mart-erp-website-plan.md) — Master product specification and roadmap.
2. **Update Before Concluding**:
   - Update [`STATE_HANDOFF.md`](./STATE_HANDOFF.md) with session progress and phase updates before committing.
3. **Mandatory Quality Gates**:
   ```bash
   npm run check
   ```
4. **Mandatory Live Push**:
   - Work is never complete until pushed live to the remote GitHub repository:
   ```bash
   git push origin main
   ```

---

## Key Architectural Highlights

- **Next.js 16 App Router & React 19**: Modern layout architecture with server & client component segregation.
- **Offline-First Data Layer**: Dexie.js (IndexedDB) with multi-tenant database separation:
  - `AmenDeskDB_live` for live production operations (`amen-mart-live`).
  - `AmenDeskDB_sandbox` for training and staging simulations (`amen-mart-sandbox`).
- **Tactile Outbox Sync Engine**: Append-only transactional outbox with manual sync trigger, toast feedback, and conflict avoidance.
- **3-Category Auction Intake**: Dedicated flows for Private, Government, and Judicial auctions with Movable (waybills) and Immovable (sale/transfer) asset handling.
- **QuickBooks-Style Financial Ledger**: Chart of accounts, journal entries, banking batch deposits, cash shift reconciliations, and P&L statements.
- **Hardware-Ready Thermal Receipting**: 80mm thermal receipt generator and A5 waybill print layouts operating completely offline.
- **Public Showroom & Auction Notices**: Direct read-through of ERP inventory without duplicate entry.

---

## Getting Started

Run the development server on port 3001:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser:
- Public Website: `http://localhost:3001/`
- Vehicle Showroom: `http://localhost:3001/showroom`
- Auction Notices: `http://localhost:3001/auctions`
- AmenDesk ERP: `http://localhost:3001/desk`
- Platform Console: `http://localhost:3001/platform`
- Login Portal: `http://localhost:3001/login`

---

## Available Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `next dev -p 3001` | Runs Next.js local development server |
| `npm run build` | `next build` | Builds production Next.js application |
| `npm run typecheck` | `tsc --noEmit` | Validates TypeScript types strictly |
| `npm run lint` | `eslint "src/**/*.{ts,tsx}"` | Runs ESLint checks on source files |
| `npm run lint:strict`| `eslint "src/**/*.{ts,tsx}" --max-warnings 0` | Fails on any ESLint warning |
| `npm run check` | `tsc --noEmit && eslint ...` | **Mandatory gate** before commit and push |

---

*Dev Surge Infotech Ltd. — devsurgeinfotech@gmail.com*
