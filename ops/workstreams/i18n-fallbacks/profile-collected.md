# Profile Collected language coverage

- Surface: `/{user}/collected`, including collection headings, browse filters,
  collection-stat disclosures, holdings labels, error recovery, and Network card
  actions. Artwork names and collection names supplied by metadata remain authored
  content.
- Fallback: new and updated `user.collected.*` messages use reviewed `en-US`
  source copy. Missing `en-GB`, `fr-FR`, `es-ES`, and `de-DE` entries fall back to
  that source. Existing filter helpers still resolve the source locale.
- Impact: non-English readers see English controls and explanatory copy. Native
  and Network card values use the selected supported locale; collection
  calculations and URL values do not change with translated labels.
- Owner: frontend profile maintainers.
- Follow-up: translate the Collected message family, pass the selected locale
  through the existing filter controls, and verify accessible names, long labels,
  and number formatting in all five supported locales. Preserve `{profile}`,
  `{name}`, and `{value}` interpolation while using each language's natural
  possessive and count wording.
