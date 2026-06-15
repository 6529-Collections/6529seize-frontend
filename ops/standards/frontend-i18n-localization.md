# Frontend I18n and Localization Standard

## Target

The frontend must become translation-ready and locale-aware progressively. New
or touched user-facing UI should avoid hardcoded copy and should format
locale-sensitive values through approved helpers.

The initial locale set is:

- `en-US`: canonical source locale and default
- `en-GB`: English UK variant
- `fr-FR`: French
- `es-ES`: Spanish
- `de-DE`: German

Use BCP 47 locale identifiers. Treat "EN-UK" as `en-GB`.

## Applies To

- Visible app copy, headings, buttons, tabs, labels, placeholders, tooltips,
  empty states, loading states, errors, validation messages, and metadata.
- Non-visible accessible names and descriptions such as `aria-label`, `alt`,
  screen-reader-only text, and status messages.
- Dates, times, numbers, currencies, percentages, relative time, pluralization,
  list formatting, and locale-sensitive sorting.

User-generated content should remain in the user's authored language unless a
specific translation feature is added.

## New PR Requirements

- Do not add new hardcoded user-facing strings in React components when an i18n
  path exists for the touched area.
- Store message source text under the app's approved i18n message structure.
- Use stable message keys that describe product meaning, not English wording.
- Use interpolation for dynamic values. Do not concatenate translated fragments
  into sentences.
- Keep accessible names in the same message system as visible labels.
- Use locale-aware helpers for dates, times, numbers, percentages, relative
  time, lists, and sorting.
- Design for longer translated text. UI must wrap or resize without overlap.
- Avoid text embedded in images unless the image is content and an accessible
  text alternative is supplied.
- Keep untranslated locales functional through documented fallback to `en-US`.

## Progressive Routing Policy

Do not move the full app under `app/[lang]` as part of the first migration wave.
The first wave makes components message-backed and locale-format-ready.

Localized route prefixes can be introduced later route by route when the page
has message coverage, metadata policy, canonical links, and QA for supported
locales.

## Message And Fallback Policy

- `en-US` is the complete source dictionary.
- Other locale dictionaries may be partial during migration.
- Missing keys fall back to `en-US`.
- Missing fallback keys should fail loudly in development or tests when the
  helper supports it.
- Keep fallback debt visible in the page or workstream tracker.

## Formatting Policy

Use native `Intl` through repo helpers before adding a larger i18n dependency.
Helpers should cover:

- date and time
- relative time
- integers, decimals, compact numbers, and percentages
- currency only when the product explicitly knows currency semantics
- locale-sensitive compare and sorting

Do not use `toLocaleString()` directly in newly touched UI when a repo helper is
available.

## Verification

For each migrated page or component:

- Render with `en-US`, `en-GB`, `fr-FR`, `es-ES`, and `de-DE`.
- Check that long labels wrap without overlap or clipped buttons.
- Check that accessible labels translate or fall back consistently.
- Check that dates, numbers, and sorted labels follow the selected locale.
- Confirm missing translations fall back to `en-US` without crashing.
- Run focused changed-file checks and browser verification for visible UI.

## Exceptions

Record exceptions for untranslated or not-yet-localized areas with:

- route or component
- untranslated surface
- current fallback behavior
- user impact
- owner or follow-up issue
- expected remediation path
