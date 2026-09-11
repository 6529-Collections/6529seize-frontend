# Museum data architecture localization fallback debt

- Routes/components: `/museum/network/methodology/data-architecture`, its
  `[slug]` routes, `DataArchitectureReadingRoom`, and the Methodology entry.
- Untranslated surface: the `museum.network.dataArchitecture.*` interface
  namespace, including metadata descriptions, eyebrows, standfirst, back
  links, section introductions, machine-disclosure labels, and the Methodology
  invitation. Governed standards manuscripts, titles, authority names,
  identifiers, hashes, schemas, and machine JSON remain source records rather
  than interface translations.
- Current fallback: these routes resolve through `DEFAULT_LOCALE`; visitors
  using `en-GB`, `fr-FR`, `es-ES`, or `de-DE` receive the reviewed `en-US`
  interface copy.
- User impact: the complete publication remains readable and operable, but its
  explanatory interface is English-only.
- Owner/follow-up: the frontend Museum internationalization follow-up before
  enabling non-English Museum scholarship routes.
- Remediation path: add professionally reviewed translations for the complete
  `museum.network.dataArchitecture.*` namespace; route the Museum shell through
  the active locale; preserve official standard titles and machine values;
  verify heading growth, disclosure controls, long authority names, tables,
  exact-source links, and 390 px layout in every supported locale; then remove
  this debt record.
