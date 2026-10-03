# Wave navigation localization fallback debt

- Routes/components: wave section rows in `MyStreamWaveDesktopTabs` and
  `BrainMobileTabs`, across desktop web, mobile web, and the app.
- Untranslated surface: the new About label (`wave.navigation.about`) and
  reused Configuration label (`competitions.configuration`); the desktop row
  also retains pre-existing English labels for its other sections.
- Current fallback: About and Configuration resolve through `t()` with the
  selected browser locale. Missing entries in `en-GB`, `fr-FR`, `es-ES`, and
  `de-DE` fall back to the reviewed `en-US` messages.
- User impact: functional English labels remain for untranslated locales.
  The existing horizontal scrolling and label truncation accommodate longer
  reviewed translations when added.
- Owner/follow-up: frontend wave UI localization follow-up.
- Remediation path: add reviewed locale entries, migrate the remaining desktop
  labels, and verify distinguishable labels, wrapping, and accessible names at
  desktop, mobile web, and app widths before removing this record.
