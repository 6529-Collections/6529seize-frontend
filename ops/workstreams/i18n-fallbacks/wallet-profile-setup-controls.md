# Wallet and Profile Setup Controls Localization Fallback Debt

Status verified against current source on 2026-08-11.

## Current fallback

The app-wallet dialogs, wallet-without-profile gates, and app-sidebar account
feedback route their new interface copy through `appWallet.modal.*`,
`profileSetup.*`, and `appSidebar.*` keys in the canonical `en-US` dictionary.
The touched components currently resolve those keys with `DEFAULT_LOCALE`, so
`en-GB`, `fr-FR`, `es-ES`, and `de-DE` users receive the English source copy
even if translated entries are added later.

The sensitive app-wallet unlock callers also continue to pass hardcoded English
action labels and warnings for plaintext export, recovery-phrase reveal, and
private-key reveal. Those caller values are interpolated into the modal's
canonical confirmation sentence and are not yet message-backed.

## Untranslated surface

- Create, import, and unlock app-wallet titles, labels, placeholders, help,
  validation feedback, action states, success/failure feedback, and accessible
  close/password-visibility names.
- Sensitive wallet action labels and warnings supplied by `AppWallet`.
- The `/messages` and `/notifications` wallet-without-profile setup prompts and
  `Create profile` action.
- App-sidebar add/switch failure feedback and account-connection busy label.

## User impact

All affected controls remain functional and accessible, but non-source-locale
users see English copy. Hardcoded `DEFAULT_LOCALE` resolution also prevents
these components from adopting translated dictionaries until locale wiring is
added.

## Source evidence

- `components/app-wallets/AppWallet.tsx`
- `components/app-wallets/AppWalletModal.tsx`
- `components/header/AppSidebarConnectedAccounts.tsx`
- `components/messages/layout/MessagesLayout.tsx`
- `components/notifications/NotificationsPage.tsx`
- `components/user/utils/set-up-profile/UserSetUpProfileCta.tsx`
- `i18n/messages/en-US.ts`

## Completion criteria

- Add reviewed entries for the affected keys to `en-GB`, `fr-FR`, `es-ES`, and
  `de-DE`.
- Replace `DEFAULT_LOCALE` at these component boundaries with the resolved
  active locale.
- Move sensitive-action labels and warnings into complete message-backed
  sentences without fragment concatenation.
- Verify visible copy, wrapping, focus behavior, accessible names, validation
  announcements, and missing-key fallback across every supported locale.

Owner/follow-up: frontend wallet, profile setup, and navigation localization
follow-up.

Remove this record only after the supported locale dictionaries and locale
wiring have been completed and verified.
