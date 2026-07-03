# Sidebar Navigation I18n Fallback Debt

## Scope

- Routes/components: desktop sidebar, mobile app sidebar, header search sidebar
  entries, `components/header/AppSidebar.tsx`,
  `components/layout/sidebar/WebSidebarNav.tsx`,
  `components/header/header-search/HeaderSearchModal.tsx`, and
  `hooks/useSidebarSections.ts`.
- Untranslated surface: several pre-existing sidebar labels still resolve from
  hardcoded English strings in `useSidebarSections.ts`, including NFT collection
  labels, Network & People items, Network Data items, delegation destination
  labels, reporting tool labels, and Developer & Open Data item labels. The new
  Tools and About group labels introduced by the Tools landing page work remain
  message-backed.
- Current fallback: hardcoded English labels render directly while message-backed
  labels use `DEFAULT_LOCALE` (`en-US`). Missing non-source locale dictionaries
  continue to fall back to `en-US` through `t()`.
- User impact: users in `en-GB`, `fr-FR`, `es-ES`, and `de-DE` contexts will
  see English copy for the residual sidebar navigation labels until the broader
  navigation locale migration is completed.
- Owner/follow-up: Frontend i18n migration follow-up for the shared sidebar
  navigation model.
- Remediation path: add message keys for the residual sidebar labels, replace
  hardcoded strings in `useSidebarSections.ts`, pass the active locale through
  sidebar consumers instead of resolving with `DEFAULT_LOCALE`, and remove this
  fallback note once non-source locale dictionaries and runtime locale wiring are
  in place.
