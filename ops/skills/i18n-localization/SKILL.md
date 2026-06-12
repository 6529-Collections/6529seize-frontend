---
name: i18n-localization
description: Implement, audit, or review progressive 6529 frontend internationalization and localization work. Use when extracting user-facing copy, adding message dictionaries, locale-aware date or number formatting, translated accessible names, locale fallbacks, or PR feedback about i18n/l10n.
---

# I18n Localization

Use this skill for progressive internationalization work in this repository.

## Workflow

1. Read `ops/standards/frontend-i18n-localization.md`.
2. Confirm the touched surface and whether an i18n path already exists nearby.
3. Use `en-US` as the canonical source locale. Use `en-GB`, `fr-FR`, `es-ES`,
   and `de-DE` as the initial supported locale set.
4. Extract visible copy and accessible names together. Include button text,
   tabs, labels, placeholders, tooltips, empty states, validation messages,
   error text, and `aria-label` values.
5. Use message keys based on product meaning. Avoid sentence fragments and
   string concatenation.
6. Route dates, numbers, percentages, relative time, and locale-sensitive
   sorting through repo helpers when available.
7. Keep untranslated locales functional by falling back to `en-US` and record
   fallback debt when a page is not fully translated.
8. Verify every supported locale for wrapping, formatting, missing-key behavior,
   and accessible labels.

## Migration Boundaries

- Do not introduce a broad i18n dependency unless the task explicitly requires
  it or the existing wrapper is no longer sufficient.
- Do not move the full App Router tree under `app/[lang]` during component-level
  migration work.
- Do not translate user-generated content unless the feature explicitly calls
  for it.

## Validation

Prefer focused checks:

```bash
6529 run lint:changed
6529 run typecheck:changed
6529 run check:changed
```

For visible UI, run browser checks for the affected route in `en-US`, `en-GB`,
`fr-FR`, `es-ES`, and `de-DE` when locale switching is available for the touched
surface.
