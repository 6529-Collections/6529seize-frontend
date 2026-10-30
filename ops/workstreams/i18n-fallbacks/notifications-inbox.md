# Desktop Notifications Inbox I18n Fallback Debt

- Routes/components: desktop sidebar `DesktopNotifications`, `NotificationsInbox`,
  and `NotificationInboxRow`, available across web routes.
- Untranslated surface: all `notifications.inbox.*` source keys, including
  controls, summaries, loading/error/empty states, and accessible names. Partial
  `en-GB`, `fr-FR`, `es-ES`, and `de-DE` dictionaries currently fall back through
  `t()` to the complete `en-US` source.
- User impact: users of those locales see English inbox copy. User-authored drop
  previews retain their authored language. Numbers and timestamps use the
  existing formatting helpers.
- Owner/follow-up: Waves UI maintainers and the frontend i18n migration workstream.
- Remediation: add reviewed translations for every inbox key in all supported
  dictionaries, check long summaries and action labels at narrow desktop widths,
  and verify localized accessible names. Remove this record after that validation.
