---
name: design-ui-ux
description: Review, build, or revise 6529 frontend UI against the repo-specific design and UX standard. Use when changing user-facing routes, components, layouts, cards, forms, dialogs, menus, media surfaces, loading/empty/error states, responsive behavior, visual styling, or PR feedback about UI consistency, UX quality, or visual evidence.
---

# Design UI/UX

Use this skill for user-facing design and UX work in this repository.

## Workflow

1. Read `ops/standards/frontend-design-ui-ux.md`.
2. Inspect the nearest existing route, component, style module, and shared
   primitive before proposing or changing UI.
3. Reuse existing tokens and patterns from `styles/variables.scss`,
   `styles/globals.scss`, `tailwind.config.ts`, nearby `*.module.scss`, and
   shared components.
4. Keep the change scoped to the touched surface. Do not introduce a new visual
   language, icon set, spacing scale, palette, or styling library.
5. Verify desktop and mobile rendering for visible UI changes. Check overflow,
   clipping, readable text, focus, hover/touch alternatives, media behavior,
   and loading/empty/error/disabled states that the change can affect.
6. Use screenshot or pixel sanity evidence when the visual result matters. Do
   not rely only on DOM presence when a route can render blank or unreadable.
7. In PR notes or closeout, summarize the UI pattern reused, evidence collected,
   unchecked states, and any documented exceptions.

## Review Checklist

- The UI fits the local 6529 surface and does not read like a new product style.
- Dark-first surfaces, `iron-*` greys, typography, borders, and compact spacing
  match nearby code.
- Product content remains primary, especially NFT/media/art imagery, avatars,
  wave names, badges, scores, and timestamps.
- Long text, translated text, counters, and labels do not overlap or clip on
  tested mobile and desktop widths.
- Loading, empty, error, disabled, selected, focus, hover, and touch states are
  designed or explicitly unaffected.
- Browser evidence includes both DOM/layout checks and visual confirmation when
  the rendered surface is part of the change.

## Validation

Prefer focused checks for the touched surface:

```bash
6529 run lint:changed
6529 run typecheck:changed
6529 run check:changed
```

Use browser verification for visible UI changes. If the change touches React,
Next.js, JSX, TSX, hooks, routing, or UI state, also use the repo's React Doctor
workflow when available.
