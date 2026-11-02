# Private Bookmarks I18n Fallback Debt

- Routes/components: `/bookmarks`, `BookmarksPage`, `BookmarkCard`,
  `HeaderBookmarksLink`, and `WaveDropBookmarkAction`.
- Untranslated surface: the `bookmarks.*` source keys, including menu actions,
  status messages, empty/error states, and accessible names. Browser-locale copy
  falls back through `t()` to `en-US` in `en-GB`, `fr-FR`, `es-ES`, and `de-DE`.
- Metadata: the private route's title and description currently use canonical
  `en-US` via `DEFAULT_LOCALE`, matching the current metadata migration policy.
- User impact: non-source locales see English bookmark copy and metadata. User
  message content remains in its authored language.
- Owner/follow-up: Waves UI maintainers and the frontend i18n migration workstream.
- Remediation: add reviewed translations for all bookmark keys, verify longer
  footer labels at narrow widths, and adopt per-route metadata locale resolution
  when that routing work is available. Remove this debt record after validation.
- Existing adjacent `More` / `More actions` copy belongs to the shared wave-action
  localization follow-up; this feature adds no hardcoded bookmark copy.
