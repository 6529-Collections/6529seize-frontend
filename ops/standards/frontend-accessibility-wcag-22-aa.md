# Frontend Accessibility Standard: WCAG 2.2 AA

## Target

The frontend target is WCAG 2.2 AA for user-facing web UI. Migration is
progressive: new work must not add accessibility debt, and touched UI should be
moved toward this standard even when the whole page is not yet verified.

WCAG 2.2 AA is the required baseline. AAA improvements are welcome when they
fit the product, but they do not replace AA verification.

## Applies To

- App routes, layouts, modals, forms, navigation, cards, tables, dialogs,
  toolbars, menus, overlays, toasts, loading states, empty states, and errors.
- Visible text and non-visible accessible names such as `aria-label`,
  `aria-labelledby`, `alt`, status messages, and validation copy.
- Keyboard, pointer, touch, screen reader, zoom, reduced motion, and high
  contrast use.

User-generated content is not required to be rewritten, but the app shell that
renders it must remain accessible.

## New PR Requirements

- Use semantic interactive elements: `button`, `a`, `Link`, native form fields,
  and native `dialog` where practical.
- Do not attach click or keyboard handlers to non-interactive elements unless
  the element is given a valid role, focus behavior, keyboard behavior, and an
  accessible name. Prefer replacing it with a semantic element.
- Preserve keyboard access for every action. Tab order must match visual and
  task order.
- Provide visible focus indicators that are not removed or hidden by custom
  styling.
- Give every control a stable accessible name. Icon-only controls need labels.
- Use headings, landmarks, lists, tables, and form labels according to meaning,
  not visual appearance.
- Meet contrast requirements for text, non-text UI, focus indicators, and
  disabled or selected states where WCAG applies.
- Make pointer targets large enough for normal touch use. Use WCAG 2.2 target
  size guidance unless a documented exception applies.
- Ensure errors are announced, associated with fields, and explain recovery.
- Keep motion optional. Respect reduced-motion settings for animation that can
  distract, disorient, or block task completion.
- Avoid content that requires hover, precise pointer movement, or dragging when
  a keyboard or touch alternative is not available.

## Migration Checklist

For each migrated page or component:

- Can all meaningful actions be reached and operated with keyboard only?
- Is focus visible and restored after dialogs, menus, route changes, and async
  operations?
- Do controls, links, tabs, inputs, menus, and dialogs expose correct roles and
  names?
- Are labels, descriptions, validation errors, status messages, and empty states
  programmatically connected where needed?
- Are heading order, landmarks, page title, and main content navigation usable?
- Does text remain readable at 200% zoom and on mobile widths?
- Do color, icon, and shape choices avoid color-only meaning?
- Do loading, error, disabled, selected, and pressed states remain clear?
- Are images, media, charts, and NFT previews given useful alt text or marked
  decorative when appropriate?
- Does automated a11y scanning show no new serious issues on the touched
  surface?

## Verification

Use the strongest focused checks available for the touched surface:

- `6529 run lint:changed`
- `6529 run typecheck:changed`
- Targeted unit or component tests when existing coverage is nearby
- Browser verification for visible UI changes
- Manual keyboard pass
- Screen reader smoke check when labels, dialogs, forms, or dynamic status
  messages change

Automated tools do not prove WCAG conformance. They catch regressions and
obvious defects; manual review is still required.

## Exceptions

Exceptions are allowed only when fixing the issue would be disproportionate for
the current PR or blocked by third-party behavior. Record:

- route or component
- WCAG-related issue
- user impact
- reason for deferral
- owner or follow-up issue
- expected remediation path

Do not use exceptions for new code when a compliant implementation is practical.
