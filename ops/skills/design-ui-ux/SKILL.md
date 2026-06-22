---
name: design-ui-ux
description: Review, build, or revise 6529 frontend UI against the repo-specific design and UX standard. Use when changing user-facing routes, components, layouts, cards, forms, dialogs, menus, media surfaces, loading/empty/error states, responsive behavior, visual styling, Tailwind/Bootstrap/Sass migration choices, or PR feedback about UI consistency, UX quality, or visual evidence.
---

# Design UI/UX

Use this skill for user-facing design and UX work in this repository.

## Workflow

1. Read `ops/standards/frontend-design-ui-ux.md`.
2. Inspect the nearest existing route, component, style module, and shared
   primitive before proposing or changing UI.
3. Classify the touched surface as modern Tailwind, legacy Bootstrap/Sass, or
   mixed. Treat legacy styling as compatibility evidence, not automatically as
   the target for new UI.
4. Prefer prefixed Tailwind utilities, `tailwind-scope`, `tailwind.config.ts`
   tokens, and shared Tailwind-based components for new or migrated UI. Use
   existing Sass or Bootstrap patterns only when maintaining a legacy surface or
   when a narrow exception is justified.
5. Check shape, color, and surface-token choices. Use `tw-rounded-xl` for cards,
   dialogs, and larger framed surfaces; `tw-rounded-lg` for buttons, inputs,
   panels, rows, and standard controls; `tw-rounded-md` only for compact details
   where `tw-rounded-lg` would feel oversized; and `tw-rounded-full` for circular
   or pill UI. When an element needs a visible edge, separator, focus ring, or
   layered separation, match the established local boundary treatment.
6. Keep the change scoped to the touched surface. Reuse the existing visual
   language, icon set, spacing scale, palette, styling library, and
   Bootstrap/Sass boundaries.
7. Verify desktop and mobile rendering for visible UI changes. Check overflow,
   clipping, readable text, focus, hover/touch alternatives, media behavior,
   and loading/empty/error/disabled states that the change can affect.
8. Use screenshot or pixel sanity evidence when the visual result matters. Do
   not rely only on DOM presence when a route can render blank or unreadable.
9. In PR notes or closeout, summarize the UI pattern reused, migration judgment,
   evidence collected, unchecked states, and any documented exceptions.

## Review Checklist

- The UI fits the local 6529 surface and does not read like a new product style.
- The result feels sleek, current, polished, and premium without becoming
  decorative or over-produced.
- The surface is content-led and native to 6529: art, media, identity, waves,
  profiles, badges, activity, and collector context create the richness.
- Social and art surfaces do not collapse into generic dashboard, admin, or
  template UI.
- New or migrated UI uses `tw-` Tailwind classes and modern tokens unless the
  touched surface is intentionally still legacy.
- Dark-first surfaces, `iron-*` greys, boundary treatments when present,
  typography, and compact spacing match current Tailwind patterns before older
  Bootstrap/Sass patterns.
- Cards, dialogs, controls, and framed surfaces use the product radius hierarchy:
  `tw-rounded-xl` for larger framed surfaces, `tw-rounded-lg` for standard
  controls and rows, `tw-rounded-md` only for compact details, and
  `tw-rounded-full` for circular/pill UI.
- Color choices use Tailwind tokens or established local custom colors tied to
  product meaning, media/art treatment, brand color, chart/domain state, or
  legacy compatibility.
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
