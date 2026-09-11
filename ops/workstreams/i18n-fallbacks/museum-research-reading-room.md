# Museum Research reading-room localization fallback debt

- Routes/components: `/museum/network/research` and the Research landing,
  acquisition essays, institutional-practice study, scholarship and writing
  standard, data-architecture overview, rights overview, and sources and
  chronology page.
- Untranslated surface: the `museum.network.research.*` interface namespace,
  including reading-layer labels, complete-record disclosures, work-gallery
  headings, image qualifiers, directory controls, editorial-figure alternative
  text and credits, card alternative text and credits, and detail-diagram
  alternative text and credits. Governed manuscripts, work titles, artist
  names, identifiers, rights statements, and source records remain source
  material rather than interface translations.
- Current fallback: these routes resolve through `DEFAULT_LOCALE`; visitors
  using `en-GB`, `fr-FR`, `es-ES`, or `de-DE` receive the reviewed `en-US`
  interface copy.
- User impact: every public study remains readable and operable, but the
  reading-room navigation and explanatory labels are English-only.
- Owner: Network Museum frontend maintainers, with translation review by the
  Museum editorial team.
- Remediation path: move every enumerated interface and editorial-media string
  into the Research namespace, add professionally reviewed translations for
  the complete namespace, verify headings, disclosure controls, image
  qualifiers, alternative text, credits, and 390 px layouts, then remove this
  debt record.
