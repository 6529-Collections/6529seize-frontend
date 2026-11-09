# Decisions Rename: Remaining English-Only Copy

The decisions rename (competitions are now called decisions, and scheduled
winner-selection moments are now called results) updated these strings in
place. They still render hard-coded English and are not yet routed through the
frontend message dictionaries.

## API tools glossary

- Route/component: `/tools/api`, `AboutApi` in `app/tools/api/page.tsx`.
- Untranslated surface: the glossary definitions (Brain, Wave, Drop and its
  CHAT / PARTICIPATORY / WINNER types, Groups and the other terms), including
  "PARTICIPATORY → a decision entry" and "participate in decisions".
- Current fallback: English only. The metadata description and the
  authentication callouts already resolve `tools.api.*` keys through
  `DEFAULT_LOCALE`; the glossary body is JSX text.
- User impact: users in `en-GB`, `fr-FR`, `es-ES`, and `de-DE` contexts read
  the API glossary in English. The code samples are intentionally English.
- Owner/follow-up: frontend i18n migration follow-up for the tools pages.
- Remediation path: extract the glossary definitions into the existing
  `tools.api.*` keys, render them with `t()`/`tRich()`, and keep the code
  samples untranslated.

## Wave rules result rows

- Component: `getDecisionRows` in `helpers/waves/wave-rules.shared.ts`.
- Untranslated surface: the "First result", "Result cadence" and
  "Single result" rule labels and values, alongside the other rule rows already
  covered by [Wave rules](wave-rules.md).
- Current fallback: English only. The module builds rows without a viewer
  locale; its few localized values use `DEFAULT_LOCALE`.
- Remediation path: the same as [Wave rules](wave-rules.md): pass the active
  locale into the rule builders and add `waves.rules.*` keys.

## Memes voting FAQ phases

- Component: `VOTING_PHASES` in `components/brain/my-stream/MyStreamWaveFAQ.tsx`.
- Untranslated surface: the Pre-voting, Voting and Selection phase labels,
  times and descriptions, including "it does not impact the final result".
- Current fallback: English only. The phases are a module-level constant
  outside the component's `useBrowserLocale()` scope; the checkpoint FAQ
  section in the same file is already localized.
- Remediation path: move the phase copy into `memesCheckpoint.faq.*` keys and
  resolve it in `VotingTimeline` with the browser locale.
