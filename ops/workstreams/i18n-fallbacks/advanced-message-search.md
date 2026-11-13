# Advanced message search localization fallback debt

- Routes/components: `AdvancedWaveSearchInput` and `MessageSearchResults`, shared by
  `WaveDropsSearchModal` and the global `Messages` tab on desktop, mobile web, and app.
- Untranslated surface: `waves.drops.searchModal.advanced.*` and `result.openInWave`, `headerSearch.category.messages`, and the updated
  `headerSearch.dialogDescription.site`.
- Current fallback: missing locale entries use the reviewed `en-US` catalog.
- User impact: untranslated locales see English filter instructions and result labels.
  The `from:` and `in:` keywords are intentionally non-translatable command syntax,
  with shared labels matching the parser in every locale.
- Owner/follow-up: frontend Wave UI localization follow-up.
- Remediation: add reviewed entries to partial locale catalogs and verify chip
  wrapping, suggestion labels, and accessible names at desktop and mobile widths.
