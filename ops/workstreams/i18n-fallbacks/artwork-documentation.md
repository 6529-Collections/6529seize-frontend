# Artwork documentation localization

The private `/artwork-documentation` workspace, list, historical versions and
inline submission module use English source messages in
`i18n/messages/artwork-documentation.ts`,
`i18n/messages/artwork-documentation-fields.ts` and
`i18n/messages/artwork-documentation-integration.ts`.

Supported non-source locales currently fall back to this English copy. Date and
number formatting uses the browser locale through the existing `i18n/format`
helpers. Artist text, original-script titles and separately attributed language
versions are preserved; changing the interface language never translates them.

The feature owner should add reviewed translations for en-GB, fr-FR, es-ES and
de-DE when their editorial review is available. Field and enum labels use the
same English fallback dictionaries until that review. No runtime translation
service is called and no private documentation is sent for translation.
