@AGENTS.md

# CardSwap

Pure card-for-card TCG trading marketplace (Pokémon + One Piece, MVP).
Full plan: `docs/BUILD_PLAN.md`. Product spec: CardSwap_Spec_v0.2.

## Non-negotiable product rules
- No fiat ever changes hands for cards.
- Market value is a **reference signal**, never a balance requirement. The trade
  engine must never block/discourage/auto-flag an uneven trade — it only ensures
  the overpaying side has *seen* the imbalance (>15% overpay confirmation).
- The only value-based restriction is the trust-tier ceiling (Spec §6).

## Architecture notes
- Next.js (App Router) + Prisma. Dev DB = SQLite; production target = Postgres.
- Controlled vocabularies (condition bands, trust tiers, listing types, statuses)
  live in `src/lib/enums.ts` as Zod unions — SQLite has no native enums.
- All external catalog/pricing access goes through `src/lib/providers/`
  (`CatalogProvider`). Stage 1 ships `MockProvider`; never fetch external data
  outside a provider.
- After schema changes: `npm run db:push` then `npm run db:seed`.
- Verify with `npm run typecheck && npm run lint && npm run build`.
