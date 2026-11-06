# Legacy-browser update notice

- Component: `components/legacy-browser/LegacyBrowserNotice.tsx`.
- Untranslated surface: the iOS and generic browser update titles and instructions.
- Current fallback: the notice resolves `legacyBrowser.*` in `en-US` with
  `DEFAULT_LOCALE`, matching the root layout's server-rendered `lang`.
- User impact: users whose browsers cannot load the application see update
  instructions in English, including users who prefer another language.
- Owner: frontend localization maintainers; tracked here as outstanding debt.
- Remediation: add translated `legacyBrowser.*` dictionaries, derive an
  allowlisted server locale from `Accept-Language`, and pass that locale to
  both the notice and its language declaration. Keep the notice independent
  of hydration and test the legacy-browser path in each supported locale.

The notice intentionally remains server-rendered: its target browsers cannot
run the application bundle or the client locale hook.
