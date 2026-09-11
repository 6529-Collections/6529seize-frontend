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

## Wave pin controls

- Component: `BrainLeftSidebarWavePin`; internal viewer-change errors in
  `usePinnedWavesServer`.
- Untranslated surface: pin/unpin accessible names, tooltips, limit feedback,
  and error messages now use `waves.sidebar.pinControl.*` source messages.
- Current fallback: the button follows browser locale; missing translations in
  `en-GB`, `fr-FR`, `es-ES`, and `de-DE` resolve to `en-US`. Internal error details
  use the canonical `en-US` message. The pin limit uses locale-aware formatting.
- User impact: these controls and errors remain English in non-source locales.
- Owner/follow-up: Waves UI maintainers and the frontend i18n migration workstream.
- Remediation path: add reviewed translations for the pin-control message keys
  and localize internal error details when the shared error surface is migrated.
