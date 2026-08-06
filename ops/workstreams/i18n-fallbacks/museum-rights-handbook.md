# Museum rights handbook localization fallback debt

- Route/component: `/museum/network/rights/**`; `MuseumRightsReadingRoom` and
  the object-level `MuseumRightsLink` presentation.
- Untranslated surface: navigational labels; use-table labels; object-level
  rights labels carried by governed Museum records; and the three governed
  English manuscripts loaded from the Museum publication. Official Creative
  Commons legal-code snapshots remain in their published English form and
  must not be machine-translated in place.
- Current fallback: the complete UI surface resolves through the reviewed
  `en-US` message catalog. The manuscripts are exact source documents from the
  canonical Museum release.
- User impact: visitors can read the complete educational and legal-source
  publication in English; no locale selector is offered for these routes yet.
- Owner/follow-up: Museum editorial and frontend localization follow-up.
- Remediation path: commission reviewed translations of the educational
  manuscripts, add locale-aware document selection without weakening the
  exact-source boundary, translate the interface catalog, link official
  Creative Commons translations where available, and verify desktop/mobile
  wrapping and accessible names before removing this record.
