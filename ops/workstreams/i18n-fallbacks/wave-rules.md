# Wave Rules I18n Fallback Debt

## Scope

- Routes/components: `/waves/create`, `/waves?create=wave`, `/waves/{waveId}`,
  `/messages/{waveId}`, `components/waves/create-wave/CreateWaveRules.tsx`,
  `components/waves/create-wave/drops/terms/CreateWaveTermsOfService.tsx`,
  `components/waves/specs/WaveRulesPanel.tsx`,
  `components/waves/specs/WaveCustomRules.tsx`,
  `components/waves/specs/WaveBindingRules.tsx`, and
  `helpers/waves/wave-rules.helpers.ts`.
- Untranslated surface: wave rules headings, labels, helper text,
  placeholders, empty states, editor errors, automatic-rule labels, rule values,
  duration labels, period labels, counts, and accessible names added for the
  wave rules experience.
- Current fallback: these surfaces render English copy directly. User-authored
  custom rules remain in the creator's authored language.
- User impact: users in `en-GB`, `fr-FR`, `es-ES`, and `de-DE` contexts see
  English wave-rules copy and English-formatted automatic-rule values until the
  wave rules surfaces are migrated into the frontend i18n message and
  formatting helpers.
- Owner/follow-up: Frontend i18n migration follow-up for wave creation, wave
  sidebars, and wave settings.
- Remediation path: extract wave-rules copy into `i18n/messages/en-US.ts`, add
  fallback keys for supported locales, pass the active locale into the rule
  builder/rendering surfaces, replace string concatenation with interpolated
  messages and plural-aware labels, and route dates, numbers, and durations
  through `i18n/format.ts`.
