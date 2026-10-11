# Design Template

Portable capture of this app's frontend design, for rebuilding the same
interface in a larger, backend-driven project.

| File | What it is |
|---|---|
| [`DESIGN_TEMPLATE.md`](./DESIGN_TEMPLATE.md) | The spec. Tokens, typography, shell, coaching layer, every screen pattern, state model, backend porting plan, content voice, and a port checklist. **Start here.** |
| [`tokens.css`](./tokens.css) | Drop-in Tailwind v4 token file + the two coaching keyframes. Copy verbatim. |
| [`primitives.tsx`](./primitives.tsx) | Every visual pattern as a pure presentational React component. Copy-paste ready; needs `react`, `lucide-react`, `tokens.css` and a `cn()` helper. |

## Fastest path to the same look

1. Install `tailwindcss@4`, `tw-animate-css`, `lucide-react`, `clsx`,
   `tailwind-merge`, `canvas-confetti`.
2. Copy `tokens.css`; import it after `@import "tailwindcss"`.
3. Load Nunito 400–900 from Google Fonts.
4. Copy `primitives.tsx`; point its `cn` import at your own utils.
5. Compose screens from the primitives, following `DESIGN_TEMPLATE.md` §6.
6. Work through the checklist in §11 — especially the `lg:absolute` commit bar
   and the `fixed` vs `absolute` modal split in §10.

These files are reference material. They are excluded from eslint and prettier
and are not part of the running app.
