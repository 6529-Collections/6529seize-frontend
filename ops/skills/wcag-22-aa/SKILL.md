---
name: wcag-22-aa
description: Audit, implement, or review 6529 frontend accessibility work against WCAG 2.2 AA. Use when changing user-facing React UI, forms, dialogs, navigation, cards, tables, focus behavior, keyboard interactions, accessible names, color contrast, or PR feedback about accessibility.
---

# WCAG 2.2 AA

Use this skill for accessibility audits, remediations, and PR reviews in this
repository.

## Workflow

1. Read `ops/standards/frontend-accessibility-wcag-22-aa.md`.
2. Inspect the touched route, component, and nearby shared primitives.
3. Prefer semantic HTML before ARIA. Use native controls, labels, links, form
   fields, and dialogs where practical.
4. Fix shared primitive issues before page-specific copies when the blast radius
   is reasonable.
5. Keep the change scoped. If the whole page is not being migrated, make the
   touched UI compliant and record remaining debt.
6. Verify with changed-file checks, browser review, keyboard-only navigation,
   visible focus, labels, and relevant empty/error/loading states.
7. In PR notes, state what was audited, what was fixed, what was not checked,
   and any exceptions.

## Review Checklist

- Controls have semantic elements, keyboard support, and accessible names.
- Focus order is predictable and focus remains visible.
- Modals, menus, popovers, and overlays manage focus and dismissal.
- Forms associate labels, descriptions, validation errors, and recovery text.
- Color is not the only signal and contrast is adequate.
- Touch targets are practical for mobile and WCAG 2.2 target-size expectations.
- Motion respects reduced-motion preferences.
- Dynamic status, loading, and error updates are announced when needed.

## Validation

Prefer focused checks:

```bash
6529 run lint:changed
6529 run typecheck:changed
6529 run check:changed
```

Use browser verification for visible UI changes. Automated checks support the
review but do not replace manual keyboard and focus testing.
