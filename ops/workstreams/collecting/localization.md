# Collecting localization follow-up

- Surfaces: `/collect` plan results, acquisition strategies and offer workspace;
  NFT market-depth actions; trade-preparation recovery messages; the Collect
  navigation label and individual purchase summaries, wallet labels, fee
  breakdowns and quote-refresh controls.
- Remaining translations: the new English messages in
  `i18n/messages/collect.ts` and `i18n/messages/collection-detail.ts` do not yet
  have translations in every supported locale.
- Current behavior: missing translations use the existing `en-US` fallback.
  Visible labels and accessible names use the same message keys. Amounts,
  quantities and dates continue to use the selected locale's formatters.
- User impact: some controls and recovery instructions appear in English when
  another locale is selected; the controls remain usable.
- Owner: frontend collecting maintainers.
- Remediation: translate these keys through the existing locale dictionaries,
  then verify long labels, accessible names and responsive wrapping in `en-GB`,
  `fr-FR`, `es-ES` and `de-DE`, retaining the fallback for untranslated locales.
