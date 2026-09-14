# Public Wave Sign-in Localization Fallback Debt

Status verified against source on 2026-09-13.

## Surface and current fallback

`components/waves/DropPlaceholder.tsx` and
`components/auth/AuthSignModal.tsx` resolve new sign-in copy through the browser
locale and canonical `waves.signIn.*` / `auth.signModal.*` messages. Missing
entries in `en-GB`, `fr-FR`, `es-ES`, and `de-DE` fall back to `en-US`.
This includes the posting CTA, wallet explanation, address label, reassurance,
close/cancel names, signing action, and pending announcement. Session-upgrade
counts now use the resolved locale even when the surrounding message falls back.

The pre-existing profile-setup, proxy-user, slow-mode, permission, availability,
and submission-limit messages in `DropPlaceholder` remain hardcoded English.
The profile-setup helper also retains its English link plus sentence suffix.
Those restriction states are unchanged by this onboarding work; the obsolete
logged-out literals have been removed.

## User impact

Non-English users can complete the existing flow and receive English sign-in
and restriction messages. The sign-in footer was checked with all five supported
locales; the footer and dialog wrap at desktop and narrow mobile widths.

## Remediation

- Add reviewed translations for the sign-in keys in all supported dictionaries.
- Migrate the remaining restriction messages to complete message keys, including
  a rich-text profile-setup message that does not concatenate sentence fragments.
- Verify translated visible and accessible names, long-text wrapping, focus,
  pending announcements, numeric formatting, and missing-key fallback.

Owner/follow-up: frontend wallet and Waves localization maintainers.
Remove this record only after translation and restriction-message migration are
complete and verified.
