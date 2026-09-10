# EMMA collection shortcuts: browser evidence

The screenshots show the real snapshot form in a local Next.js development
fixture, inside the app shell, with mocked API responses. They are not deployed
environment evidence. The fixture is not part of the application.

- [Desktop, 1440px viewport](evidence/desktop.png): Meme Lab selected with keyboard focus.
- [Mobile, 390px viewport](evidence/mobile.png): Intern JPGs selected with its token-ID string.
- Chromium checks covered Tab/Enter/Space, visible focus, season selection,
  dialog dismissal and focus restoration, exact-address name autofill, and
  horizontal overflow. No page errors or axe violations were found in the
  checked form and dialog. Network tracing found no keyword-search requests.

The rows reuse EMMA's existing Tailwind iron palette and rounded controls. New
copy and accessible names use the existing message system with `en-US` fallback
for the other supported locales. Full translation of the remaining English EMMA
form is deferred to progressive localization work; the new controls stay usable
in all five supported locales. Native app and screen-reader device testing were
not performed.

Before backend cleanup, deploy and smoke-test the frontend in staging and
production, then allow an older-client compatibility window or verify through
route telemetry that the old keyword endpoint is no longer used. This frontend
stage requires no Lambda deployment.
