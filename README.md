# CardSwap

A pure **card-for-card** trading marketplace for Pokémon TCG and One Piece.
No fiat ever changes hands — every card carries a live AUD market value used as
a *reference signal*, never a balance requirement.

This repo currently contains **Stages 1–2** (basic interface POC + add cards by
code lookup). See [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) for the full staged
plan.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Prisma ORM — **SQLite** in dev, **Postgres** in production
- Zod for validation / controlled vocabularies

## Getting started
```bash
npm install
cp .env.example .env   # DATABASE_URL="file:./dev.db"
npm run db:push        # create the SQLite schema
npm run db:seed        # seed catalog, prices, dev user + inventory
npm run dev            # http://localhost:3000
```

## What's in Stages 1–2
- App shell + navigation (Dashboard / My Collection / Add cards / Marketplace).
- Data model: `User`, `CatalogCard`, `PriceSnapshot`, `InventoryCard`,
  `Listing`, `CatalogGap`.
- Seeded sample catalog (Pokémon Base Set + One Piece OP01) with per-condition
  pricing and a dev user holding listed cards.
- Reusable **value badge** (value + "as of" + source) and a card detail view
  with a market-value-by-condition table.
- **Add cards by code lookup** (`/add`): search/lookup per game, condition
  selection, declared-value ceiling, optional "list for trade", with a
  manual-entry + catalog-gap fallback for unmatched cards.
- **Pluggable catalog/pricing providers** behind one interface — offline
  `MockProvider` (default) plus live Pokémon TCG / One Piece HTTP providers,
  selected with `CARDSWAP_PROVIDERS`. Pricing is freshness-guarded (§3.3).

### Going live with real card data
Set `CARDSWAP_PROVIDERS=live` and allowlist the API hosts (`api.pokemontcg.io`,
the One Piece source) in your environment's network policy. Optional API keys
go in `.env` (see `.env.example`). With `mock` (the default) everything runs
fully offline.

## Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run db:push` | Sync Prisma schema to the DB |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Prisma Studio |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |

## Roadmap
1. **Stage 1 — Basic interface & POC** ✅
2. **Stage 2 — Add cards by code lookup** ✅
3. Stage 3 — Trading & negotiation engine
4. Stage 4 — Phone card scanning (PWA camera)
5. Stage 5 — Trust tiers, KYC, settlement, Premium Protection, governance
