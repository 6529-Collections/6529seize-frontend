# Share and Connect Controls

Status verified against current source on 2026-08-07.

## Current fallback

The page-share and device-connection surfaces route their visible copy and
accessible names through `headerShare.*`, `headerUserMenu.*`, and
`webSidebar.accountMenu.*` message keys. These keys currently exist only in the
canonical `en-US` dictionary, so `en-GB`, `fr-FR`, `es-ES`, and `de-DE` use the
`en-US` fallback.

The affected components include `HeaderShareModalView`, `HeaderShareMenu`,
`HeaderUserMenuDropdown`, and `WebSidebarUser`. The untranslated surface covers
the Share and Connect Device dialog titles and states, QR target labels, social
and system-share actions, and connected-account menu actions.

## User impact

Non-source-locale users can use the complete sharing and device-connection
flows, but see English interface copy until reviewed translations exist.

## Source evidence

- `components/header/share/header-share/`
- `components/header/user/HeaderUserMenuDropdown.tsx`
- `components/layout/sidebar/WebSidebarUser.tsx`
- `i18n/messages/en-US.ts`

## Completion criteria

- Add reviewed entries for the affected keys to `en-GB`, `fr-FR`, `es-ES`, and
  `de-DE`.
- Verify the Share and Connect Device dialogs, social-action rows, account-menu
  labels, tooltips, accessible names, and live status messages in every
  supported locale.
- Verify longer translations at horizontal and stacked modal breakpoints without
  clipping, overlap, or ambiguous truncation.

Owner/follow-up: frontend navigation localization follow-up.

Remove this record only after the supported locale dictionaries and responsive
and accessible-name behavior have been verified.
