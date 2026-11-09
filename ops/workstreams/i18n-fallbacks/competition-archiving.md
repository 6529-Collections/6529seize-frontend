# Competition archiving localization fallback debt

- Surface: competition Settings and the saved-draft archive control.
- New message keys: `competitions.archiveAndStop`,
  `competitions.archiveStopConsequences`, `competitions.archiveConsequences`
  plus `competitions.archiveIrreversible`, `competitions.archiveConfirmationName`
  and `competitions.archiveNameHelp`.
- The complete en-US source is accessed through `t()`. en-GB, fr-FR, es-ES
  and de-DE currently use the English fallback for these keys.
- User impact: en-GB, fr-FR, es-ES and de-DE users see English archive copy and
  name-confirmation guidance until reviewed translations are available.
- Owner: frontend wave UI localization follow-up.
- Follow-up: add reviewed translations and verify wrapping in the confirmation
  dialog on desktop and mobile. Include the `competitions.confirmAction` title
  with `competitions.archiveAndStop` and a long competition name, plus both
  consequence messages and the name-confirmation guidance. Check de-DE, fr-FR and es-ES
  at narrow widths and 200% zoom. Current fallback copy has been visually
  checked on desktop and phone; expanded translations remain follow-up QA.
