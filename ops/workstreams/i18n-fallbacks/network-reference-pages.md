# Network reference pages localization fallback debt

- Routes/components: `/network/definitions`, `/network/levels`,
  `/network/prenodes`, `/network/tdh/historic-boosts`, and `/network/xtdh`;
  their route client components, `PrenodesStatus`, and
  `NetworkReferenceNavigation`.
- Untranslated surface: xTDH's complete explanatory body and accessible
  headings remain hardcoded source-locale English. Prenodes' title, UTC note,
  timestamp/status labels, location fallback, and accessible status names also
  remain hardcoded source-locale English. Definitions, Historic Boosts, and the
  shared reference navigation are message-backed, but the new
  `network.definitions.*`, `network.levels.*`, `network.tdhHistoric.*`, and
  `network.references.navigation.*` namespaces currently have only `en-US`
  source messages. Browser titles outside the localized Definitions and Levels
  client titles also remain source-locale English.
- Current fallback: Definitions, Levels, and Historic Boosts use the active
  browser locale and fall back to `en-US` for missing supported-locale entries.
  Prenodes and xTDH render their existing source-locale English copy directly.
- User impact: all four routes remain functional and readable, including
  localized date and number formatting on Historic Boosts, but users selecting
  `en-GB`, `fr-FR`, `es-ES`, or `de-DE` receive English copy for these
  untranslated surfaces.
- Owner/follow-up: frontend Network-reference localization follow-up.
- Remediation path: externalize Prenodes and xTDH complete sentences, labels,
  fallbacks, and accessible names; message-back the remaining browser titles;
  add reviewed entries for all supported locales; verify wrapping and fallback
  behavior at desktop and mobile widths; then remove this debt record.
- Product token note: `SZN` and `TDH + Rep` are established 6529 terminology
  and remain unchanged inside complete translatable messages. Translators may
  localize the surrounding sentence structure and punctuation without
  translating these tokens.
