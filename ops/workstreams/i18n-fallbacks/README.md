# Frontend I18n Fallback Debt

Status verified against current source on 2026-07-23.

These records remain active because the corresponding surfaces still use the
source locale, `DEFAULT_LOCALE`, hardcoded English copy, or source-locale
fallback dictionaries.

| Record | Current source evidence |
| --- | --- |
| [About contents/navigation](about-contents-navigation.md) | The About route, contents dropdown, Tech reports, and wallet-auth page still resolve with `DEFAULT_LOCALE` |
| [About The Memes](about-memes.md) | `AboutMemes` still resolves `about.memes.*` through `DEFAULT_LOCALE` |
| [About minting](about-minting.md) | `AboutMinting` still uses `DEFAULT_LOCALE`, with canonical body copy remaining in source-locale English |
| [Sidebar navigation](sidebar-navigation.md) | `useSidebarSections` still resolves shared navigation through `DEFAULT_LOCALE` and retains residual hardcoded labels |
| [Wave competition badges](wave-competition-badges.md) | The source locale contains `waves.competitionBadges.*`; supported locale dictionaries still rely on fallback for this surface |
| [Wave rules](wave-rules.md) | Wave rule creation/rendering still includes direct English strings and non-localized formatting |

Remove a debt record only in the same change that completes its remediation and
verifies the supported locale and accessible-name behavior described by the
record.
