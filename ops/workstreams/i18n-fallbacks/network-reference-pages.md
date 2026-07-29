# Network reference pages localization fallback debt

- Routes/components: `/network/definitions`,
  `/network/tdh/historic-boosts`, and `/network/xtdh`; their route client
  components and `NetworkReferenceNavigation`.
- Untranslated surface: xTDH's complete explanatory body and accessible
  headings remain hardcoded source-locale English. Definitions, Historic
  Boosts, and the shared reference navigation are message-backed, but the new
  `network.definitions.*`, `network.tdhHistoric.*`, and
  `network.references.navigation.*` namespaces currently have only `en-US`
  source messages. The browser titles also remain source-locale English.
- Current fallback: Definitions and Historic Boosts use the active browser
  locale and fall back to `en-US` for missing supported-locale entries. xTDH
  renders its existing source-locale English copy directly.
- User impact: all three routes remain functional and readable, including
  localized date and number formatting on Historic Boosts, but users selecting
  `en-GB`, `fr-FR`, `es-ES`, or `de-DE` receive English copy for these
  untranslated surfaces.
- Owner/follow-up: frontend Network-reference localization follow-up.
- Remediation path: externalize xTDH's complete sentences and accessible names,
  message-back the browser titles, add reviewed entries for all supported
  locales, verify wrapping and fallback behavior at desktop and mobile widths,
  then remove this debt record.
- Product token note: `SZN` is established 6529 terminology and remains
  unchanged inside complete translatable messages such as
  `network.tdhHistoric.table.seasonRange`; translators may localize the range
  punctuation around the interpolated season number without translating the
  token.
