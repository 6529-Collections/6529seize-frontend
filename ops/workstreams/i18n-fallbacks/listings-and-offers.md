# Listings and Offers localization

The card-page `MarketDepthPanel`, `MarketDepthPriceLevels`, and
`MarketDepthOrderDetails` components appear
on The Memes, Meme Lab, Gradients, and NextGen routes. Their `marketDepth.*`
interface messages use the reviewed `en-US` source dictionary in
`i18n/messages/collection-detail.ts`. Supported locales without translations
fall back to these messages; dates, relative time, and numbers use the selected
locale through the existing formatting helpers.

The same fallback applies to price-row accessible names, order information,
verification notices, pagination loading and retry messages, and disclosure
controls. Review these messages together when adding a locale.

The refreshed Meme Lab Additional details heading uses `memeLab.detail` with
the same source-language fallback. Existing metadata labels inside that
disclosure remain English; the artwork-page maintainers own their future
message extraction and reviewed translations.

The API also returns plain-text `notes` without stable message identifiers or
locale variants. About these prices preserves this English explanatory text.
Non-English readers may therefore see mixed-language interface and API copy.
Loading, empty, stale, unavailable, and error states have dedicated interface
messages and do not depend on translating the API notes.

The Listings and Offers feature maintainers own this debt. Remediation is to
add reviewed interface translations and coordinate stable note identifiers and
interpolation values with the backend, then map those identifiers to translated
messages. Keep an explicit source-text fallback for unknown identifiers. Verify
locale fallback and accessible names before removing this record.
