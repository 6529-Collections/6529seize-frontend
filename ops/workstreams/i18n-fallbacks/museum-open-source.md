# Museum Open Museum and source-contribution localization fallback debt

- Routes/components: all `/museum/network` routes through
  `MuseumSourceContribution`; the homepage and `/museum/network/about` through
  `MuseumNetworkPage`, `MuseumNetworkProposition`, and `MuseumNavigation`; and
  the research context on `/museum/network/stories/source-and-chronology`.
- Untranslated surface: the `museum.network.openMuseum.*`,
  `museum.network.home.*`, and `museum.network.proposition.*` visitor copy,
  action labels, source-state explanations, accessible navigation labels, and
  institutional proposition currently have reviewed source messages only in
  `en-US`. Governed manuscript titles, rights text, credits, record identifiers,
  and repository paths remain source-authored content rather than interface
  translations.
- Current fallback: these components resolve through `DEFAULT_LOCALE`, so all
  supported locales receive the reviewed `en-US` interface copy.
- User impact: exact source, improvement, and contribution actions remain
  functional and unambiguous, but visitors using `en-GB`, `fr-FR`, `es-ES`, or
  `de-DE` receive English explanatory and navigation copy on these surfaces.
- Owner/follow-up: frontend Museum internationalization follow-up covering the
  homepage and proposition copy before enabling non-English Museum locales.
- Remediation path: add reviewed translations for the complete
  `museum.network.openMuseum.*`, `museum.network.home.*`, and
  `museum.network.proposition.*` namespaces; route the Museum shell through the
  active locale; verify heading growth, interpolated caption/commit/path
  wrapping, accessible names, and the four-column facts layout at desktop and
  390px mobile widths; then remove this debt record.
