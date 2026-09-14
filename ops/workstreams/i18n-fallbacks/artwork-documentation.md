# Artwork documentation localization

The authenticated `/artwork-documentation` workspace, list, historical versions and
inline submission module use English source messages in
`i18n/messages/artwork-documentation.ts`,
`i18n/messages/artwork-documentation-fields.ts` and
`i18n/messages/artwork-documentation-integration.ts`,
`i18n/messages/artwork-documentation-guidance.ts` and
`i18n/messages/artwork-documentation-chapters.ts`,
`i18n/messages/artwork-documentation-editorial.ts` and
`i18n/messages/artwork-documentation-museum.ts`.

Supported non-source locales currently fall back to this English copy. Date and
number formatting uses the browser locale through the existing `i18n/format`
helpers. Artist text, original-script titles and separately attributed language
versions are preserved; changing the interface language never translates them.

The feature owner should add reviewed translations for en-GB, fr-FR, es-ES and
de-DE when their editorial review is available. Field and enum labels use the
same English fallback dictionaries until that review. No runtime translation
service is called and no private documentation is sent for translation.

The reusable complete Stream record, its ten media profiles, full-document and
conversation controls, material descriptions, file evidence, publication-permission
guidance, linked-caption and transcript controls, Museum journal and dossier export use the same `en-US` fallback. The
supplied AN ALTERATION reference and separately labelled illustrative media
examples are source material; the interface does not translate or rewrite them.

Artists using en-GB, fr-FR, es-ES or de-DE therefore see English instructions and
accessible names, while dates and numbers retain the selected supported locale.
The Stream artwork-documentation feature owner owns this follow-up: commission
and review the four partial dictionaries, including catalogue labels and backend
validation guidance, then verify long text, mobile wrapping, accessible names and
complete plural messages. Until that review, no external translation service is
called and artist text is never sent for translation. Dossier counts use
`formatNumber` and `Intl.PluralRules` with the same supported application locale;
the current supported locales require the `one` and `other` cardinal keys.
