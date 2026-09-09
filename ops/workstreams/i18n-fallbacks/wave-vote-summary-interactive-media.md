# Wave vote summary and interactive media localization fallback debt

- Routes/components: `/waves/{waveId}` leaderboard vote summaries and shared
  `SandboxedExternalIframe` media banners.
- Untranslated surface: `waves.leaderboard.voteSummary.*` labels and
  `media.interactive.untrustedContent`. Source hostnames, URLs, profile handles,
  and artwork titles remain authored or technical data.
- Current fallback: these messages resolve through `t()` or `tRich()` with the
  browser locale. `en-GB`, `fr-FR`, `es-ES`, and `de-DE` fall back to the reviewed
  `en-US` source messages. Summary vote values use locale-aware formatting;
  the shared projected-vote tooltip retains legacy number formatting pending
  its own migration. The largest-vote child is already locale-aware.
- User impact: the labels remain functional English in non-source locales;
  the projected-vote tooltip can still use English number separators.
- Remaining adjacent debt: existing Rep/NIC header copy and winner outcome
  labels remain English. Their padding, borders, and typography were refined
  without changing their copy or expanding this migration into those surfaces.
- Owner/follow-up: frontend wave, media, and profile localization follow-up.
- Remediation path: add reviewed translations for these keys, localize shared
  vote summary children and adjacent profile/winner labels, then verify all five
  supported locales for wrapping, accessible names, and number formatting.
