# Frontend Design and UI/UX Standard

## Target

New and touched user-facing UI must fit the existing 6529 product experience:
dark-first, dense, content-led, and built for repeated use. This standard is for
contributors and agents creating or reviewing frontend work. It complements the
WCAG 2.2 AA and i18n standards; it does not replace them.

The goal is consistency and usability, not a new visual direction. Agents should
derive decisions from the current codebase and rendered product before adding
new UI patterns.

The frontend is in a progressive styling migration. Tailwind CSS with the repo
`tw-` prefix is the preferred direction for new and touched UI. Bootstrap,
React Bootstrap, global Sass, and Sass modules still exist and may be correct
for legacy or not-yet-migrated surfaces, but their presence is not permission to
copy old colors, spacing, or component chrome into new work.

## Applies To

- App routes, layouts, shells, cards, lists, tables, forms, dialogs, menus,
  popovers, toolbars, toasts, loading states, empty states, errors, media
  surfaces, and navigation.
- Visual styling, spacing, typography, responsive behavior, interaction states,
  motion, image/media treatment, page density, and styling-system choices.
- Agent-authored PR notes that claim UI readiness or visual validation.

Backend-only changes, generated models, docs-only changes, and internal scripts
do not need this standard unless they change visible frontend behavior.

## Design Direction

6529 should feel like a modern, sleek, content-led social product for art,
collecting, identity, and community participation. The UI should feel polished
and premium while remaining fast, readable, and useful for repeated use. Product
content should create the richness: artwork, media, avatars, profiles, waves,
badges, activity, and collector context. Do not flatten social or art surfaces
into a generic dashboard, spreadsheet-first utility interface, or template-like
admin surface. Do not add decoration in place of real product content.

## 6529 UI Posture

- Treat 6529 as a working app, not a marketing site. Prefer dense but readable
  information, compact controls, predictable navigation, and fast scanning.
- Preserve the dark-first visual system. Use black and `iron-*` / grey surfaces,
  subtle borders, restrained contrast, and existing accent colors instead of
  inventing a new palette.
- Let real product content carry the page. NFT/media/art imagery, avatars,
  wave names, scores, badges, timestamps, and user activity are primary content,
  not decoration.
- Keep surfaces restrained. Cards, rows, panels, and controls should feel
  functional and grounded; avoid unrelated hero treatments, ornamental
  gradients, decorative blobs, oversized marketing copy, or novel chrome.
- Match the local surface. A feed row, media grid, admin/tool form, modal, and
  collection card may have different density, but each new piece should look
  native to its neighboring route.
- Do not treat legacy styling as the future design system. Older Bootstrap,
  WordPress/Fusion, global Sass, and pre-migration module styles can be useful
  evidence for layout constraints or product behavior, but modern Tailwind
  surfaces are the stronger visual reference for new or migrated UI.

## Source Of Truth

Before designing or reviewing touched UI, inspect the closest relevant source:

- `tailwind.config.ts` for the `tw-` prefix, `iron-*` palette, primary/error/
  success colors, breakpoints, container queries, hover/touch variants, and
  motion tokens.
- `styles/globals.scss` for global layout classes, `tailwind-scope`, app-level
  resets, and places where legacy global rules intentionally avoid Tailwind
  scoped UI.
- `styles/variables.scss` and `styles/seize-bootstrap.scss` for legacy Sass and
  Bootstrap compatibility. Treat these as compatibility sources unless the
  touched surface is still intentionally Bootstrap-based.
- Nearby `*.module.scss`, route components, and shared components for local
  spacing, borders, typography, state styling, and responsive behavior. First
  classify the surface as modern Tailwind, legacy Bootstrap/Sass, or mixed.
- Existing user-facing docs under `ops/docs/` only as behavior references; verify
  UI details against code and browser evidence.

Do not add hardcoded hex values, font families, one-off spacing scales, new icon
sets, or styling libraries when an existing token or pattern covers the need.
Avoid new React Bootstrap usage, Bootstrap utility classes, or Sass-only styling
for new/migrated UI unless the PR is deliberately maintaining a legacy surface
and the exception is documented.

## New PR Requirements

- Reuse existing layout and component patterns before creating a new pattern,
  but prefer migrated Tailwind patterns over older Bootstrap/Sass patterns when
  both are available.
- Use Tailwind utilities and shared Tailwind-based components for new or
  substantially touched UI. Use Sass modules only when they are already local to
  the surface or when Tailwind cannot express the behavior cleanly.
- Keep legacy changes narrow. If a Bootstrap/Sass page is only being fixed,
  preserve behavior and avoid a broad redesign; migrate the touched UI toward
  Tailwind when practical and record remaining styling debt when not.
- Keep text readable and contained at mobile and desktop widths. Long labels,
  translated text, badges, counters, wallet/profile names, and timestamps must
  wrap, truncate, or resize intentionally without overlapping adjacent content.
- Design every visible state that the user can reach: default, hover, focus,
  active, selected, disabled, loading, empty, error, and recovery.
- Verify both pointer and touch behavior. Hover-only affordances need a visible
  or reachable touch/keyboard alternative.
- Keep focus visible and task-ordered. Use the WCAG standard for semantic roles,
  names, keyboard operation, and contrast requirements.
- Keep loading states stable. Skeletons and spinners should reserve realistic
  space and should not be mistaken for the final rendered state during review.
- Make empty and error states useful. They should explain what happened, whether
  the user can recover, and which action is available next.
- Keep media surfaces content-first. Images, videos, embeds, and NFT previews
  should preserve aspect ratio, avoid distortion, and fail with a clear fallback.
- Avoid horizontal overflow on every touched route at mobile and desktop widths.
- Avoid layout jumps caused by late media, dynamic counters, badges, tooltips,
  menus, or loading transitions.
- Respect reduced motion and keep animations short, purposeful, and consistent
  with existing motion.

## Verification

Do not claim UI readiness from code inspection alone. Use the strongest focused
checks available for the touched surface:

- `6529 run lint:changed`
- `6529 run typecheck:changed`
- `6529 run check:changed`

For visible UI changes, also collect browser evidence that covers:

- Source evidence: the nearby components, style modules, tokens, and docs used
  as the pattern.
- Migration evidence: whether the touched surface is modern Tailwind, legacy
  Bootstrap/Sass, or mixed, and why the chosen styling approach is appropriate.
- Browser evidence: desktop and mobile render checks for the touched route or a
  representative route shell.
- State evidence: loading, empty, error, disabled, selected, and interaction
  states when the PR can affect them.
- Layout evidence: no horizontal overflow, no obvious clipping, and no text or
  controls overlapping at tested widths.
- Visual evidence: screenshot or pixel sanity when the user-facing result is
  visual. DOM-only checks are not enough when a route can contain DOM content
  while rendering as a blank or unreadable surface.
- Console/runtime evidence: no new page errors and no new relevant console
  errors on the checked surface.

Initial browser evidence for this standard used `/waves` as a dense app surface
for desktop and mobile review: dark UI, left rail navigation, compact
typography, avatar-heavy lists, badges, pinned/unread states, media cards, and
subtle borders. It also found that some local routes can expose DOM geometry and
page titles while screenshot evidence appears blank. UI/UX verification must
therefore check both DOM geometry and rendered pixels.

## Review Checklist

For each touched page or component:

- Which existing route, component, or style source did it match?
- Is the touched surface modern Tailwind, legacy Bootstrap/Sass, or mixed?
- Which `tw-` utilities, Tailwind tokens, fonts, colors, spacing, and surface
  patterns were reused?
- Did the PR avoid adding new Bootstrap, React Bootstrap, global Sass, or
  Sass-only design debt unless it is intentionally maintaining legacy UI?
- Which desktop and mobile widths were checked?
- Which loading, empty, error, and disabled states were checked or unaffected?
- How were focus, hover, touch, and keyboard affordances preserved?
- Did screenshot or visual evidence match the DOM state?
- What was not checked, and why is that acceptable for this PR?

Include a concise UI/UX note in the PR body or closeout when the PR changes
visible UI.

## Exceptions

Exceptions are allowed only when a better-compliant result is out of scope,
blocked by existing debt, or blocked by third-party behavior. Record:

- route or component
- UI/UX issue
- user impact
- reason for deferral
- owner or follow-up issue
- expected remediation path

Do not use exceptions to justify new visual debt when a consistent implementation
is practical.
