# AmenDesk — Offline-First ERP & Website Implementation Plan

**Prepared by:** Dev Surge Infotech Ltd.
**Client:** Amen Mart
**Scope:** Premium multi-line ERP, "AmenDesk" (CRM + Accounts + Inventory) and public-facing website (Showroom)

---

## 1. Executive Summary

Amen Mart is a government-affiliated auction company running **three distinct auction categories — Private, Government, and Judicial** — alongside direct-sale lines in car dealership, land, and property. Auctioned assets span both **movable property** (vehicles and other movable assets — equipment, machinery, furniture, and similar) and **immovable property** (land and buildings), and which combination applies depends on the auction category. This is a materially broader scope than "car auctions" and the ERP's data model and UI are built around that from the ground up, not bolted on afterward.

Each line — auction (in its three categories), dealership, land, property — has its own document trail and workflow quirks, but all funnel through the same cash office and the same customer relationships. The brief calls for a **premium ERP** — named **AmenDesk** — combining CRM and Accounts to run the business internally, and a **public website with a showroom** to market inventory and publish auction notices.

Because auction yards, showrooms, and land sites in Ghana routinely operate with unreliable or no connectivity, this plan is built **offline-first**: every terminal — front desk, auction yard tablet, or dealership showroom PC — must be able to register a customer, record a sale or bid, print a receipt, and issue the correct disposal document with zero internet connection, then sync automatically the moment a connection returns. This is the same architectural pattern used across Dev Surge's other Ghana deployments and is treated as non-negotiable rather than a "nice to have."

The website is planned as a **thin public layer over the same data** — the showroom, land/property listings, and auction notices (filterable by category and asset type) are generated from ERP records, not maintained twice.

---

## 2. Business Lines & What Each One Needs

### 2.1 Auction — three categories, two asset types

| Auction Category | Asset Types Covered | Typical Context |
|---|---|---|
| **Private** | Movable **and** Immovable | Assets disposed on behalf of private individuals/companies (liquidations, voluntary sales) |
| **Government** | Mainly **Movable** | Government-affiliated disposal of state assets — vehicles and other movable equipment |
| **Judicial** | Movable **and** Immovable | Court-ordered/sheriff sales on behalf of the judicial service |

Every auction lot in the system carries two independent classifications: **which category** it belongs to (Private / Government / Judicial) and **what type of asset** it is (Movable / Immovable). The combination determines which detail fields, documents, and approval steps apply — see §3.3.

### 2.2 All business lines at a glance

| Line | What's sold | Key identifiers | Margin/Fee model | Special document |
|---|---|---|---|---|
| **Auction — Movable** | Vehicles and other movable assets (equipment, machinery, etc.), across all 3 categories | Vehicles: Chassis No., Reg. No., Fuel type. Other movable assets: description, serial/tag number, quantity, condition | Margin/fee % may vary by category — confirm with Amen Mart per category (7% was the figure given for vehicle auctions) | **Waybill** (asset description/Reg. No./Chassis No. as applicable, quantity) |
| **Auction — Immovable** | Land and buildings, under Private or Judicial categories | Parcel/site reference, title reference | Margin/fee % to confirm per category | Sale/Transfer document + indenture tracking (not a waybill — immovable property doesn't move) |
| **Car Dealership** | Imported cars, direct sale (separate from auctioned vehicles) | Chassis Number, Fuel type | Markup on landed cost | Receipt |
| **Land** | Direct land sales (separate from auctioned land) | Parcel/site reference | Sale price | Receipt + indenture tracking |
| **Property** | Direct property sales (separate from auctioned property) | Property/unit reference | Sale price | Receipt |

All lines share one **Accounts** ledger and one **CRM** customer base, so a person who buys land today and bids in a Judicial auction next month is the same customer record, not several separate ones.

*Note: auctioned land/buildings (under Auction — Immovable) are tracked within the Auction module's own lifecycle and are distinct from the direct-sale Land and Property modules, even though both ultimately post to the same Accounts ledger.*

---

## 3. ERP Modules

### 3.1 CRM
- Unified customer profile across all business lines (one person, one record, regardless of which line or auction category they transact in)
- Lead capture: walk-in, phone, and **website inquiry** (auction interest by category, showroom inquiry, land/property inquiry) all land in one pipeline
- KYC document capture (ID, proof of address) for high-value purchases — required for Ghana AML/KYC norms on vehicle and land transactions, and expected practice for Judicial auction bidders specifically
- Follow-up tasks and reminders for sales agents, including automatic tasks for buyers with an unpaid balance
- SMS/WhatsApp notifications (via Mnotify/Hubtel) for auction alerts (filterable by category), **balance-due reminders during the 14-day window (e.g. at deposit, mid-window, and shortly before the due date), overdue notices**, payment confirmations, and document-ready notices
- Full communication and transaction history per customer, across every line and auction category they've engaged with

### 3.2 Accounts
- Single chart of accounts covering all lines, with reporting broken out by **line and, within Auction, by category (Private / Government / Judicial)**
- Auction margin engine: computes and books the margin/fee per lot at settlement — **rate configurable per auction category**, since the 7% figure given may not apply uniformly across Private, Government, and Judicial auctions (confirm with Amen Mart; flagged in Open Questions)
- Dealership margin tracking: landed cost vs. sale price per unit
- **Deposit and instalment engine:** buyers pay a deposit and settle the balance within **2 weeks**. Each sale carries a payment plan (deposit, balance due date, running balance), and payments can arrive in **one or several instalments** within the window, each by Cash, MoMo, or Bank Transfer. Every payment gets its own printable receipt showing amount paid, total paid to date, and balance remaining
- Outstanding-balance tracking and ageing: a receivables view of every sale with a balance, days remaining, and overdue items highlighted, feeding the accountant's reporting by line and auction category
- The deposit percentage and the 14-day window are **configurable settings** (per auction category if needed), not hard-coded, so Amen Mart can adjust them without a code change
- Multi-mode receipting: **Cash, MoMo, Bank Transfer** — each reconciled against its own settlement source (till, MoMo aggregator via Hubtel/MTN, bank statement)
- VAT handling at the current Ghana rate, invoice and receipt numbering, audit trail
- Printable receipts (thermal for front desk, A4 for formal invoices)
- Commission tracking for sales agents across lines
- Bank/MoMo reconciliation dashboard for the accountant

### 3.3 Auction Module

This is the most structurally important module given the breadth of what Amen Mart auctions, so the UI is built around two independent choices made at lot-intake time, not a single flat "vehicle" form.

**Step 1 — Auction Category (set at the auction-event level, inherited by every lot in it)**

- **Private** — movable or immovable
- **Government** — movable only by default (the intake form doesn't force this, since "mainly" leaves room for exceptions, but immovable is hidden unless a staff override is used)
- **Judicial** — movable or immovable; adds a **case/court reference field** and a document slot for the court order or sheriff's instruction, since these are typically required for judicial sales

**Step 2 — Asset Type per lot (Movable / Immovable)**

The intake form changes shape based on this choice:

| Asset Type | Sub-type | Fields captured |
|---|---|---|
| Movable | Vehicle | Chassis Number, Registration Number, Fuel type, condition notes, photos |
| Movable | Other movable asset | Description, serial/asset tag number, quantity, condition notes, photos — for equipment, machinery, furniture, and similar non-vehicle lots |
| Immovable | Land/Building | Parcel/site or title reference, size, location, site plan/title document attachment, condition notes, photos |

**Auction workflow (applies across all categories):**

- Auction event scheduling and lot management, each lot tagged with its category and asset type
- Bidder registration and bid capture (with an **offline bid-capture mode** for the auction yard itself, syncing once back on network)
- Winning-bid confirmation opens a **deposit-and-instalment payment plan** for the buyer: the buyer pays a deposit at the auction and has **2 weeks (14 days) to pay the balance**. The lot moves to a *Sold — Awaiting Balance* status, the deposit is receipted immediately, and a balance due date is set automatically (see §3.2 for the instalment engine)
- Once the balance is **fully paid**, the system triggers the **correct disposal document based on asset type**, not a one-size-fits-all form:
  - **Movable lots** → generates a **Waybill** (vehicle Reg./Chassis No., or asset description/serial number and quantity for non-vehicle movable lots) plus the final settlement receipt
  - **Immovable lots** → generates a **Sale/Transfer document** plus indenture-tracking entry plus the final settlement receipt (no waybill — nothing is being transported)
- Lots with an unpaid balance stay on hold in the yard/inventory and cannot be released; if the 14-day window lapses, the lot is flagged **Overdue** for the Auction Manager to act on (extend, re-auction, or apply the deposit-forfeiture rule once Amen Mart confirms it)
- Auction calendar and results feed straight to the public website's auction notices page, filterable there by category and asset type — no manual re-entry

### 3.4 Car Dealership Module
- Imported vehicle inventory: Chassis Number, Fuel type, landed cost, asking price
- Vehicle detail records with photo galleries (feeds the website showroom directly)
- Sales pipeline from inquiry to sale, financing/installment tracking where applicable
- Stock status (available, reserved, sold) synced live to the website showroom

### 3.5 Land Module
- Parcel records with site reference, size, location, and attached site plan/indenture documents
- Ownership and allocation status tracking (available, reserved, sold)
- Buyer document checklist per sale (contract, indenture, ID)

### 3.6 Property Module
- Property/unit listing records (type, location, price, status)
- Sales and, where relevant, lease tracking
- Document attachments per property

### 3.7 Inventory Module
- Centralized stock view across **all physical locations** (auction yard, dealership showroom, land/property offices) — one place to see what exists, where it sits, and its status
- Asset stock ledger covering **all movable asset types** (vehicles and other movable auction assets, not just cars), linked back to Auction and Dealership records so an asset's full lifecycle (intake → yard → showroom/auction → sold) is tracked in one place, not duplicated across modules
- Stock movement/transfer log between locations (e.g., a vehicle moved from the auction yard to the dealership showroom), with timestamps and responsible staff recorded
- Parts/consumables inventory for workshop or reconditioning needs (if Amen Mart services vehicles before sale or auction), with low-stock alerts
- Stock valuation (landed cost basis), feeding directly into the Accounts module's margin calculations
- Physical stock count/audit reconciliation tools — scheduled counts compared against system records, with variance reporting
- Aging reports (how long a vehicle/parcel/unit has sat unsold) to flag slow-moving stock for pricing review
- Fully offline-capable, since stock checks and transfers often happen at the yard itself with no connectivity

---

## 4. Offline-First Architecture

This is the backbone the rest of the system depends on.

- **Local-first data store on every device.** Each terminal (front desk PC, showroom tablet, auction-yard device) keeps a full local copy of the data it needs — customers, inventory, in-progress transactions — in a local database (SQLite/IndexedDB), not a cache of a remote system.
- **Everything critical works with zero connectivity:** registering a customer, recording a sale or bid, printing a receipt, generating a waybill or sale/transfer document.
- **Background sync engine** pushes and pulls changes the moment connectivity is available, with no user action required.
- **Conflict handling tuned to the data type:**
  - Financial transactions (receipts, sales) use unique, device-generated transaction IDs so the same sale can never be double-booked even if created offline on two devices — the ledger is append-only and auditable.
  - Reference data (inventory status, customer profile edits) uses last-write-wins with a visible audit trail, since these are lower-stakes and rarely conflict.
- **Sync status is always visible to the user** — a clear indicator shows whether a device is fully synced, has pending changes, or is offline, so front-desk staff always know if a receipt has actually reached head office.
- **Offline printing** is treated as a first-class case: a receipt or waybill generated offline prints immediately and syncs its record later — the customer is never told to "wait for the internet."

---

## 5. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| ERP front end | Next.js (React) as an installable PWA | Works on desktop and tablets, installs like an app, runs offline via service worker |
| Field/offline data layer | IndexedDB (Dexie) on web, SQLite on any dedicated tablets | Proven local-first pattern for intermittent connectivity |
| Backend API | NestJS | Structured, modular — matches the module split above (CRM, Accounts, Auction, Dealership, Land, Property) |
| Sync engine | Event-sourced/outbox pattern over the API | Guarantees offline-created records reconcile safely with the server ledger |
| Database | PostgreSQL | Relational integrity for financial and title/ownership records |
| Caching/queues | Redis | Sync queue processing, session handling |
| File/photo storage | S3-compatible object storage | Vehicle photos, land site plans, property images, ID documents |
| Payments | Hubtel (MTN MoMo, Vodafone Cash, AirtelTigo) + bank reconciliation on Amen Mart's own accounts; **Paystack** for card/online payment and website deposit collection, run through a **Dev Surge-managed Paystack subaccount** with settlements split to Amen Mart | Matches the three stated payment modes, with card/online transactions routed via subaccount rather than a separate client-held Paystack account |
| Notifications | Mnotify (SMS) / WhatsApp Business API, with **Arkesel** evaluated as an alternative/fallback SMS provider | Auction alerts, payment confirmations, document-ready notices |
| Hosting | AWS af-south-1 | Lowest latency for Ghana-based users |

---

## 6. Website Plan

The website is a **public window into the same ERP data**, not a separately maintained system.

### 6.1 Structure
- **Home** — company overview, the auction categories and service lines, trust/credibility signals (government affiliation, judicial-sale credibility)
- **Showroom** — browsable car inventory pulled live from the Dealership module (filter by make, price, fuel type, status); each listing links to an inquiry form that lands directly in CRM as a lead
- **Auctions** — public auction notices and schedule, pulled live from the Auction module (per the brief: *"Public notifications of Auctions are to appear on the website"*); **filterable by category (Private / Government / Judicial) and by asset type (Movable / Immovable)**, showing the relevant details per type (vehicle chassis/reg. info for vehicle lots, parcel/site reference for land/building lots, description/serial for other movable lots) and photos where appropriate
- **Land** — available parcels with location, size, price, and inquiry form
- **Properties** — available listings with inquiry form
- **Contact/Inquiry** — routes into the same CRM lead pipeline as walk-in and phone leads
- **Admin sync layer** — website content is generated from ERP records via API; no double data entry, no stale listings

### 6.2 Design Direction
- **Light theme by default, with a dark mode toggle** — the brief's "no dark theme" was a correction of the original wording, not a ban on dark mode: the ERP and website should **launch in light mode by default**, but give users (including the CEO, who may work at night) the option to switch to dark mode and have that preference remembered per user/device.
- Both themes are designed as first-class, not an afterthought — the dark palette gets its own accessible contrast pass rather than a simple color inversion, so text, charts, and status indicators (available/reserved/sold, sync state) stay legible in both modes.
- Premium, trust-forward visual language appropriate to high-value transactions (vehicles, land, property) — clean typography, generous whitespace, confident use of a light accent palette in the default theme.
- Fully responsive — most inbound inquiry traffic in this market comes from mobile.
- Fast-loading listing pages, since showroom and auction pages are the primary conversion points.

---

## 7. Roles & Permissions

| Role | Access |
|---|---|
| Admin | Full system access, reporting, user management |
| Accountant | Accounts module, reconciliation, reporting |
| Auction Manager | Auction module (all categories by default, scopeable to specific categories per staff member if needed), lot intake, waybill/sale-document generation |
| Dealership Sales Agent | Dealership module, CRM (own leads) |
| Land/Property Officer | Land & Property modules, CRM (own leads) |
| Front Desk/Cashier | Receipting, payment capture, printing |
| Inventory Officer | Inventory module, stock transfers, physical count reconciliation |
| Public (website visitor) | Read-only showroom/auction/land/property listings, inquiry forms |

---

## 8. Phased Implementation Roadmap

**Phase 1 — Foundation**
Core architecture, offline sync engine, authentication & roles, base Accounts module (chart of accounts, receipting, all three payment modes).

**Phase 2 — Core Trading Modules**
CRM, Car Dealership module, Auction module (intake → bid → waybill flow), Inventory module (stock ledger and cross-location transfers, tied into Auction/Dealership).

**Phase 3 — Land & Property + Full Accounts**
Land and Property modules, full reconciliation and cross-line P&L reporting.

**Phase 4 — Public Website**
Showroom, auction notices, land/property listings, inquiry-to-CRM pipeline, payment-deposit integration if required.

**Phase 5 — Hardening & Go-Live**
Offline stress-testing at the actual auction yard and showroom, staff training, phased rollout.

---

## 9. Open Questions / Assumptions

- **Margin/fee rate per auction category:** the 7% figure in the original brief was given for auctioned vehicles — this plan makes the rate configurable per category (Private / Government / Judicial) pending confirmation from Amen Mart on whether it's uniform or category-specific.
- **Judicial auction compliance requirements:** this plan assumes a case/court reference and a court-order/sheriff's-instruction document attachment are enough at intake — if the Judicial Service requires additional certification, sign-off, or reporting, that should be confirmed and added.
- **Deposit and instalment rules:** the brief gives a deposit followed by 2 weeks to pay the balance. To confirm with Amen Mart: the deposit amount or percentage (and whether it differs by category), whether the balance can be split into several instalments or is one payment, whether goods and documents are released **only after full payment** (this plan assumes yes), what happens on default (deposit forfeited, re-auction, penalty), whether extensions are allowed and who approves them, and whether the same terms apply to direct sales in the Dealership, Land, and Property lines.
- **Government auction exceptions:** the brief states Government auctions are "mainly" movable — this plan allows immovable lots under Government via a staff override rather than a hard block, pending confirmation on whether that should be fully disallowed instead.
- **Brand palette:** the brief doesn't specify brand colours for either the light or dark theme — this plan assumes a light, premium default palette (with a matching dark-mode palette) pending Amen Mart's actual brand guidelines.
- **Number of physical locations** and how many devices need simultaneous offline operation (affects sync engine sizing).
- **Expected transaction volume** per line and per auction category (affects database/reporting design).
- **Any existing government or judicial auction system** Amen Mart already integrates with, which this ERP would need to interoperate with rather than replace.
- **Deposit/online payment on the website** — whether website visitors should be able to pay a reservation deposit online, or whether the website stays inquiry-only with payment handled in person. Card/online payments will run through **Paystack via a Dev Surge-managed subaccount**, so Amen Mart doesn't need to hold its own Paystack account.
- **SMS provider** — Mnotify is the default carried over from prior Dev Surge deployments; **Arkesel** will also be evaluated (sandbox testing on delivery rates and pricing across MTN/Vodafone/AirtelTigo) before the provider is locked in.

---
*Dev Surge Infotech Ltd. — P. O. Box GP 22451, Accra — devsurgeinfotech@gmail.com — www.devsurgeinfotech.com*
