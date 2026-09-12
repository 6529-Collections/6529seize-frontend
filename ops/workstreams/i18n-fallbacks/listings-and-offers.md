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

## Advanced collecting

The `/collect` browsing, completion, group-offer, and TDH target views, together
with inline purchases on NFT pages and purchase history, use the reviewed
`en-US` source messages in `i18n/messages/collect.ts`. Supported locales without
reviewed translations fall back to this English interface copy. Amounts,
quantities, dates, and TDH values use the selected locale through the existing
formatting helpers; localized number formatting does not imply that the
surrounding interface is translated.

This fallback covers `CollectBatchReviewForm`, `CollectBatchQuoteReview`,
`CollectPlanBasket`, `CollectOfferWorkspace`, `OfferPlanPanel`, `OfferPlanItem`,
`OfferPlanPricing`, `CollectTdhTargetForm`, `CollectTdhTargetDelivery`,
`CollectTdhTargetResults`, `CollectInlineBuyForm`, `CollectDeliveryControl`,
`CollectOwnerAction`, and `CollectOrdersClient`. Review their visible messages,
accessible names, validation errors, delivery consent, pending-order status,
and recovery controls together when adding translations.

Some explanations remain backend-authored English text without localized
message identifiers. `OfferPlanPanel` renders the offer analysis
`policy_description` in its explanation disclosure. `CollectTdhTargetResults`
renders both the target plan's `assumptions` and its profile projection's
`assumptions` verbatim. The existing completion disclosure can also render
backend assumptions. These strings are not translated by
the interface dictionaries; non-English readers can see mixed-language results.

The Collect feature maintainers own this follow-up with the backend
marketplace maintainers. Add reviewed interface translations and stable
identifiers with interpolation values for policy, coverage, and projection
explanations, then map those identifiers to messages while preserving an
explicit source-text fallback. Until that work is complete, keep the English
fallback documented and verify non-English amount formatting, readable
wrapping, and accessible names when changing these views.
