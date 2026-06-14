# WCAG/I18n Audit Inventory

## 2026-06-14

This inventory is a triage map, not a bug list. The scans intentionally find
candidate areas where accessibility or localization debt may exist, then future
PRs should verify each hit against the standards before changing code.

Scans ran from the current workstream branch after the profile stack was opened.

## Scan Summary

| Category | Files | Matches | Signal |
| --- | ---: | ---: | --- |
| Static copy attributes | 525 | 2753 | Hardcoded `aria-label`, `placeholder`, or `title` values likely need message-backed treatment when touched. |
| Interaction candidates | 859 | 1687 | Dense `onClick`, key, `tabIndex`, or role usage that needs semantic-control review before WCAG claims. |
| Locale formatting candidates | 86 | 186 | Direct `toLocale*` or `Intl.*` usage that may need the repo i18n helper path. |
| Image alt candidates | 213 | 596 | `<img>` and empty/null alt patterns that need decorative-vs-informative review. |
| I18n helper adoption | 77 | 621 | Current usage of `t()`, locale normalization, and repo formatting helpers. |

## Top Hotspots

Static copy attributes:

- `app/museum/6529-fund-szn1/cod/page.tsx`
- `app/museum/genesis/fragments-of-an-infinite-field/page.tsx`
- `app/blog/from-fibonacci-to-fidenza/page.tsx`
- `app/museum/6529-fund-szn1/incomplete-control/page.tsx`
- `app/museum/6529-fund-szn1/rarepepe/page.tsx`

Interaction candidates:

- `components/nextGen/admin/NextGenAdmin.tsx`
- `components/drop-forge/craft/DropForgeCraftClaimPageClient.tsx`
- `components/waves/TwitterPreviewCard.tsx`
- `components/meme-calendar/MemeCalendar.tsx`
- `components/delegation/CollectionDelegation.tsx`

Locale formatting candidates:

- `components/drop-forge/launch/DropForgeLaunchClaimPageClient.view.tsx`
- `components/drop-forge/craft/DropForgeCraftClaimPageClient.tsx`
- `components/distribution-plan-tool/create-custom-snapshots/form/CreateCustomSnapshotForm.tsx`
- `components/distribution-plan-tool/create-snapshots/table/CreateSnapshotTableRow.tsx`
- `components/meme-calendar/meme-calendar.helpers.tsx`

Image alt candidates:

- `app/museum/6529-fund-szn1/capsule-house/page.tsx`
- `app/museum/6529-fund-szn1/cod/page.tsx`
- `app/museum/page.tsx`
- `app/om/6529-museum-district/page.tsx`
- `app/capital/company-portfolio/page.tsx`

I18n helper adoption is currently concentrated in the media/profile migration
surface, especially `components/the-memes`, `components/memelab`,
`components/rememes`, `components/meme-calendar`, and user profile components.

## Recommendations

- Keep the current implementation stack review-ready only until humans are
  comfortable with the size and shape of the migration.
- Continue bottom-up hardening, starting with PR #2604, because it supplies the
  i18n helpers inherited by the rest of the stack.
- Prefer safe public media or static surfaces for the next stack. `meme-calendar`
  and read-only media/card surfaces are better candidates than claim, admin,
  delegation, or transaction flows.
- Treat museum, blog, capital, and OM pages as a separate editorial/static-page
  backlog. They have many image and static-copy hits, but the translation and
  content-review burden is different from app UI.
- Defer `drop-forge`, `nextGen/admin`, distribution tooling, delegation, and
  transfer flows until the helper pattern and review appetite are proven.

## Commands

```powershell
rg --count-matches -g '*.tsx' -g '*.ts' 'aria-label=\x22[^\x22]+\x22|placeholder=\x22[^\x22]+\x22|title=\x22[^\x22]+\x22' app components contexts hooks pages
rg --count-matches -g '*.tsx' 'role=\x22button\x22|role=\x22dialog\x22|tabIndex=|onClick=|onKeyDown=|onMouseDown=|onMouseUp=' app components pages
rg --count-matches -g '*.tsx' -g '*.ts' 'toLocaleString|toLocaleDateString|toLocaleTimeString|Intl\.' app components contexts hooks lib pages
rg --count-matches -g '*.tsx' '<img\b|alt=\{?\x22\x22|alt=\x22\x22|alt=\{undefined\}|alt=\{null\}' app components pages
rg --count-matches -g '*.tsx' -g '*.ts' '\bt\(|\bformatInteger\(|\bformatNumber\(|\bformatDate\(|\bformatRelativeTime\(|\bnormalizeLocale\(' app components i18n
```
