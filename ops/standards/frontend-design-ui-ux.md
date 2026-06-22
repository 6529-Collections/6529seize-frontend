# Frontend Design and UI/UX Standard

## Target

New and touched user-facing UI must fit the existing 6529 product experience:
dark-first, dense, content-led, and built for repeated use. This standard is for
contributors and agents creating or reviewing frontend work. It complements the
WCAG 2.2 AA and i18n standards; it does not replace them.

The goal is consistency and usability, not a new visual direction. Agents should
derive decisions from the current codebase and rendered product before adding
new UI patterns.

## Applies To

- App routes, layouts, shells, cards, lists, tables, forms, dialogs, menus,
  popovers, toolbars, toasts, loading states, empty states, errors, media
  surfaces, and navigation.
- Visual styling, spacing, typography, responsive behavior, interaction states,
  motion, image/media treatment, and page density.
- Agent-authored PR notes that claim UI readiness or visual validation.

Backend-only changes, generated models, docs-only changes, and internal scripts
do not need this standard unless they change visible frontend behavior.

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

## Source Of Truth

Before designing or reviewing touched UI, inspect the closest relevant source:

- `styles/variables.scss` for core fonts, colors, and shared dimensions.
- `styles/globals.scss`, `styles/animations.scss`, and `tailwind.config.ts` for
  global layout, prefixed Tailwind tokens, motion, and `iron-*` colors.
- Nearby `*.module.scss`, route components, and shared components for local
  spacing, borders, typography, state styling, and responsive behavior.
- Existing user-facing docs under `ops/docs/` only as behavior references; verify
  UI details against code and browser evidence.

Do not add hardcoded hex values, font families, one-off spacing scales, new icon
sets, or styling libraries when an existing token or pattern covers the need.

## New PR Requirements

- Reuse existing layout and component patterns before creating a new pattern.
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

## Evidence Requirements

Do not claim UI readiness from code inspection alone. For visible UI changes,
collect the strongest focused evidence practical for the touched surface:

- Source evidence: the nearby components, style modules, tokens, and docs used
  as the pattern.
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

The initial evidence pass for this standard found `/waves` useful as a dense app
surface for desktop and mobile review: dark UI, left rail navigation, compact
typography, avatar-heavy lists, badges, pinned/unread states, media cards, and
subtle borders. It also found that some local routes can expose DOM geometry and
page titles while screenshot evidence appears blank. Future UI/UX automation
must check both DOM geometry and rendered pixels.

## Agent Self-Review

Before opening or updating a PR with visible UI changes, agents should be able
to answer:

- Which existing route, component, or style source did this match?
- Which tokens, fonts, colors, spacing, and surface patterns were reused?
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
