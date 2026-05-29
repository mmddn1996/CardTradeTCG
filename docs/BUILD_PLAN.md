# CardSwap — Build Plan

A pure card-for-card TCG trading marketplace (Pokémon TCG + One Piece, MVP).
This document is the staged build plan. It is derived from `CardSwap_Spec_v0.2`
and the agreed delivery priorities. See the spec for the full product rationale.

> **Core principle (do not violate):** No fiat ever changes hands for cards.
> Market value is a *reference signal*, never a balance requirement. The engine
> must never block, discourage, or auto-flag an uneven trade — it only ensures
> the overpaying side has *seen* the imbalance (Spec §5.4 / §5.5).

---

## 1. Technology choices

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript + React 19** | One language across UI + API. Server Actions/Route Handlers keep the backend in-repo. |
| Styling | **Tailwind CSS v4** | Ships with the scaffold; fast, consistent UI. |
| ORM / DB | **Prisma** — SQLite for dev, **Postgres for production** | Zero-setup local dev now; the spec's Postgres is a one-line provider swap later. |
| Validation | **Zod** | Single source of truth for input + the controlled vocabularies (conditions, tiers, states) that SQLite can't model as native enums. |
| Auth | **Auth.js (NextAuth)** — *added in Stage 5* | Stage 1 uses a seeded dev user + simple session so we can build UI without a KYC dependency. |
| Mobile / scan | **Installable PWA** (manifest + service worker) + `getUserMedia` camera | Avoids a separate native codebase. The camera capture (Stage 4) runs in the same app. |
| Live updates | **WebSocket / SSE** — *added in Stage 3* | Live offer/basket value updates per Spec §5.5. |

### Pluggable data providers
All catalog/pricing access goes through a single interface
(`src/lib/providers/`). Stage 1 ships a **Mock provider** backed by a seeded
local catalog so the app runs fully offline. Real providers (Pokémon TCG API,
a One Piece source) drop in behind the same interface in Stage 2 — no caller
changes (Spec §4.5).

> **Environment note:** this build runs in a network-allowlisted container.
> npm is reachable; external card APIs are **not** until their hosts are added
> to the environment's network policy. Plan Stage 2 live-API work accordingly.

---

## 2. Delivery stages (agreed priority order)

The spec's suggested order leads with the scan pipeline; we deliberately defer
scanning to Stage 4 and start with **code-lookup** card entry to reach a
working product sooner.

### Stage 1 — Basic interface & POC  ← *this session*
- Next.js + Tailwind + Prisma(SQLite) scaffold.
- Foundational data model: `User`, `CatalogCard`, `PriceSnapshot`,
  `InventoryCard`, `Listing`.
- Seeded catalog (Pokémon + One Piece sample cards with images + values) and a
  dev user with sample inventory.
- App shell + nav; pages: **Dashboard**, **My Collection**, **Card detail**,
  **Marketplace** (browse listings).
- Reusable **Value badge** component (value + "as of" timestamp + source) per §4.5.
- Mock catalog/pricing provider.

### Stage 2 — Add cards (code lookup)
- "Add card" flow: search/lookup by set + collector number (Pokémon) or card ID
  e.g. `OP01-001` (One Piece).
- Real Pokémon TCG API + One Piece provider behind the provider interface;
  price snapshot caching with freshness window (§3.3 stale-price guard).
- Condition band selection (§3.2); declared value rules (§3.3 ceiling).
- Catalog-gap queue for unmatched lookups (§4.6).

### Stage 3 — Trading & negotiation engine
- `Offer`, `Trade`, baskets; HAVE/WANT listings wired to offers.
- Offer state machine (DRAFT→PENDING→COUNTERED→ACCEPTED/REJECTED/EXPIRED/CANCELLED, §5.2).
- Multi-card baskets, counter-offers, pull-from-counterparty-listings (§5.3).
- Live value-delta badge; **overpay confirmation >15%** speed-bump (§5.5).
- Soft/hard locking + atomic two-phase accept with re-price/volatility check (§5.6).

### Stage 4 — Phone card scanning
- PWA camera capture with guided overlay + on-device glare/blur/crop checks (§4.1).
- Staged recognition: normalise → game classifier → region OCR → visual
  embedding match → fusion/rank → variant/finish + condition estimate (§4.2).
- Async worker model for inference; tap-to-confirm fallback for low confidence.

### Stage 5 — Full features: trust, settlement, governance
- Auth.js + KYC vendor integration; trust tiers & limit enforcement (§6).
- Reviews & reputation (§6.1).
- Standard postage settlement (labels, scan-to-confirm, tracking) then Premium
  Protection escrow-style flow (§7); settlement state machine (§7.3).
- Admin/ops console, dispute resolution, moderation.

---

## 3. Data model (foundation, Stage 1)

Modelled now: `User`, `CatalogCard`, `PriceSnapshot`, `InventoryCard`,
`Listing`. `Offer`/`Trade`/`Shipment`/`Review` are added in Stages 3 & 5.
Controlled vocabularies (condition bands, trust tiers, listing types, statuses)
are TypeScript/Zod unions in `src/lib/enums.ts` so the model stays identical
when we move SQLite → Postgres.

## 4. Conventions
- Money stored as AUD `Float` for the POC; revisit integer-cents before real money/labels (Stage 5).
- All controlled values validated through Zod at the edge.
- Provider interface is the only place external data is fetched.

## 5. Running locally
```bash
npm install
npm run db:push      # create SQLite schema
npm run db:seed      # seed catalog + dev user
npm run dev          # http://localhost:3000
```
