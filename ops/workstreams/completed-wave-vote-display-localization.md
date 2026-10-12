# Completed wave vote display localization

Affected components: `ParticipationDropVoteDetailsTrigger` and
`ParticipationDropVoteDetailsContent`, in submission and winner cards.
The `waves.voteDetails` labels and missing-history explanation currently fall
back to en-US in en-GB, fr-FR, es-ES and de-DE. Number and plural formatting
use the selected locale; the explanatory sentence interpolates the tab label.

Owner: frontend maintainers. Follow-up: frontend PR #4212. Add translations
to the existing partial dictionaries, then check trigger wrapping, dialog
copy and accessible names at desktop and mobile widths. Until translated,
users see English explanatory text; the missing-history label wraps on podium
cards.
