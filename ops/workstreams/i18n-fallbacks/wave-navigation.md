# Wave navigation localization fallback debt

- Routes/components: wave section rows in `MyStreamWaveDesktopTabs` and
  `BrainMobileTabs`, across desktop web, mobile web, and the app.
- Untranslated surface: wave information (`waves.information.open`), Settings
  (`competitions.settings`), Votes and its subtabs, and the legacy Settings notice.
  `MyStreamWaveDesktopTabs` also retains English literals for Chat, Leaderboard,
  Sales, Winners, Outcome, Polls and FAQ.
- Current fallback: new information and competition labels resolve through `t()` with the
  selected browser locale. Missing entries in `en-GB`, `fr-FR`, `es-ES`, and
  `de-DE` fall back to the reviewed `en-US` messages.
- User impact: functional English labels remain for untranslated locales.
  The existing horizontal scrolling and label truncation accommodate longer
  reviewed translations when added.
- Owner/follow-up: frontend wave UI localization follow-up.
- Remediation path: add reviewed locale entries, migrate the remaining desktop
  static desktop labels to message keys, and verify distinguishable labels, wrapping, and accessible names at
  desktop, mobile web, and app widths before removing this record.
