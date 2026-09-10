# EMMA collection shortcuts: browser evidence

The screenshots show the real snapshot form in a local Next.js development
fixture, inside the app shell, with mocked API responses. They are not deployed
environment evidence. The fixture is not part of the application.

- [Desktop, 1440px viewport](evidence/desktop.png): Meme Lab selected with keyboard focus.
- [Mobile, 390px viewport](evidence/mobile.png): Intern JPGs selected with its token-ID string.
- [Intern token-ID error, 390px viewport](evidence/intern-error.png): an empty lookup preserves the manual collection and offers retry.
- Chromium checks covered Tab/Enter/Space, visible focus, season selection,
  dialog dismissal and focus restoration, exact-address name autofill, and
  horizontal overflow, and Intern lookup error/retry. No page errors or axe violations were found in the
  checked form and dialog. Network tracing found no keyword-search requests.

The rows reuse EMMA's existing Tailwind iron palette and rounded controls. New
copy and accessible names use the existing message system. All snapshot-form
labels, placeholders, help text, tooltips, errors, and action labels are backed by
`emma.snapshots.*` messages. The `en-GB`, `fr-FR`, `es-ES`, and `de-DE` dictionaries
currently fall back to `en-US`, so these controls appear in English. The frontend
EMMA maintainers own the follow-up translations in the existing locale
dictionaries; the fallback tests deliberately assert usable English controls.
Canonical collection names, season identifiers, and token-ID syntax are data and
stay identical in every locale and snapshot submission. The modal title
interpolates the same canonical collection name used by its shortcut.

Outside the changed form, the EMMA step header, snapshots table, and step footer
remain English. Progressive localization of those components and translated
locale dictionaries is follow-up work for the frontend EMMA maintainers. Native
app and screen-reader device testing were not performed.

Before backend cleanup, deploy and smoke-test the frontend in staging and
production, then allow an older-client compatibility window or verify through
route telemetry that the old keyword endpoint is no longer used. This frontend
stage requires no Lambda deployment.
