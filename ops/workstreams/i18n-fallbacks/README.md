# Frontend I18n Fallback Debt

Status verified against current source on 2026-08-11.

These records remain active because the corresponding surfaces still use the
source locale, `DEFAULT_LOCALE`, hardcoded English copy, or source-locale
fallback dictionaries.

| Record                                                              | Current source evidence                                                                                                       |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [About contents/navigation](about-contents-navigation.md)           | The About route, contents dropdown, Tech reports, and wallet-auth page still resolve with `DEFAULT_LOCALE`                    |
| [About The Memes](about-memes.md)                                   | `AboutMemes` still resolves `about.memes.*` through `DEFAULT_LOCALE`                                                          |
| [About minting](about-minting.md)                                   | `AboutMinting` still uses `DEFAULT_LOCALE`, with canonical body copy remaining in source-locale English                       |
| [Content moderation](content-moderation.md)                         | Moderation actions, tombstones, preferences, queue, and composer feedback currently fall back to the reviewed `en-US` messages |
| [Public contract review](public-contract-review.md)                 | The shell, feedback composer, ledger, and immutable editorial snapshots currently use the source-locale fallback              |
| [Network reference pages](network-reference-pages.md)               | Prenodes and xTDH remain English in source; Definitions and Historic Boosts messages fall back to `en-US` outside the source  |
| [Museum Open Museum and source contribution](museum-open-source.md) | Museum source/contribution and transition interface messages currently resolve through the reviewed `en-US` fallback          |
| [Museum data architecture](museum-data-architecture.md)             | The data-architecture reading room and profile interface currently resolve through the reviewed `en-US` fallback              |
| [Share and connect controls](share-connect-controls.md)             | Page-sharing, social-action, device-connection, and account-menu messages currently fall back to `en-US` outside the source locale |
| [Sidebar navigation](sidebar-navigation.md)                         | `useSidebarSections` still resolves shared navigation through `DEFAULT_LOCALE` and retains residual hardcoded labels          |
| [Wallet and profile setup controls](wallet-profile-setup-controls.md) | App-wallet dialogs, profile-setup gates, and app-sidebar feedback remain source-locale English                               |
| [Wave competition badges](wave-competition-badges.md)               | The source locale contains `waves.competitionBadges.*`; supported locale dictionaries still rely on fallback for this surface |
| [Wave rules](wave-rules.md)                                         | Wave rule creation/rendering still includes direct English strings and non-localized formatting                               |

Remove a debt record only in the same change that completes its remediation and
verifies the supported locale and accessible-name behavior described by the
record.
