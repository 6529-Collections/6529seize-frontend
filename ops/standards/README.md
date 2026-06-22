# Frontend Standards

This folder defines repo-wide frontend standards that apply across routes and
components. These are operational standards for contributors and agents, not
user-facing product docs.

## New PR Quality Bar

New frontend work must avoid adding accessibility, localization, or UI/UX debt.

- Follow [WCAG 2.2 AA](frontend-accessibility-wcag-22-aa.md) for user-facing UI,
  including keyboard access, visible focus, semantic controls, labels, color
  contrast, target size, error recovery, and modal behavior.
- Follow [I18n and Localization](frontend-i18n-localization.md) for
  user-facing copy, accessible names, dates, numbers, sorting, and locale
  fallbacks.
- Follow [Design and UI/UX](frontend-design-ui-ux.md) for repo-specific visual
  consistency, responsive layout, interaction states, media treatment, loading,
  empty, error, and visual evidence expectations.
- If a touched page is not fully migrated yet, make the touched UI meet these
  standards and record any remaining page-level debt.
- Document exceptions with owner, reason, user impact, and a follow-up path.

## Progressive Migration

The frontend is migrating incrementally. Standards PRs may merge independently.
Page and component migration PRs should stay focused, validate the touched
surface, and move one area at a time toward the standards.
