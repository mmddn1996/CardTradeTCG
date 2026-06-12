# Card back images

These are shown on the back face of the 3D card flip (`CardArt`).
Filenames are referenced from `src/components/ui.tsx` → `cardBackSrc()`.

| File | Used for |
|------|----------|
| `POKE_Back.png`        | All Pokémon cards |
| `OP_Back_Leader.png`   | One Piece **Leader**-type cards (cardType contains "Leader") |
| `OP_Back_Standard.png` | All other One Piece cards |

Until a file is present, the flip falls back to the CSS-generated CardSwap back.
Drop the three images here with these exact names (PNG/JPG re-saved as `.png`).
