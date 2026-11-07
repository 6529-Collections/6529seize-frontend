# Send Diagnostics

Parent: [Shared Index](README.md)

## Overview

Send Diagnostics lets a person send the 6529 team a report of what the app did
in the last 5 minutes, so the team can look into a problem they hit. Nothing
is sent until the person chooses Send. They then get a short code, such as
`D-7K3Q-9XW2`, to give to the team.

- The report comes from the on-device flight recorder: pages opened (as route
  templates such as `/waves/[wave]`), API calls (endpoint template, status,
  timing and request ID), live-connection changes, action steps, scrubbed
  error messages, slow tasks and failed file loads, plus the app version,
  platform, device type, browser and enabled features.
- It never includes messages the person wrote, what they typed, wallet
  addresses, handles, full page addresses or sign-in tokens.
- The backend keeps a report encrypted for 14 days. Only the team can open it.

## Location in the Site

- `/about/diagnostics`, also listed as **Send Diagnostics** in the About menu
  under the 6529 group, next to Contact Us.
- The same page is the support link: the team can send
  `https://6529.io/about/diagnostics`.
- It is available on the web, in 6529 Mobile and in 6529 Desktop while
  `NEXT_PUBLIC_FEATURE_DIAGNOSTICS` is on (staging only for now). With the flag
  off, the menu item is hidden and the page is a 404.

## Entry Points

- About menu > 6529 > Send Diagnostics.
- A support link to `/about/diagnostics`.
- The crash prompt. When a page crashes into the error screen, a **Send the
  team a report?** card offers **Review the report**, which opens the same
  preview and Send button in place. If the whole app shell fails (the global
  error screen), a **Send the team a report** link opens
  `/about/diagnostics` with a full reload; the report includes the crash from
  the recorder's saved copy. Nothing is sent without Send.

## User Journey

1. Open Send Diagnostics. The page shows **What will be sent**: this app's
   details, the recent activity as a readable list, any activity saved from
   before the last reload, and **Show the exact data** with the full report.
2. Optional: tick **Attach a screenshot** (off by default), then **Choose what
   to capture**. The browser asks which tab, window or screen to share, takes
   one picture, and shows it before sending.
3. Choose **Update preview** to include anything that happened since the page
   opened.
4. Choose **Send diagnostics**. While it sends, a status line says so.
5. The page shows **Report sent** and the code, which receives focus.
   **Copy code** copies it and announces "Code copied".

## Common Scenarios

- After a crash and reload: the activity from before the reload appears under
  **Before the last reload** for up to an hour.
- A person who only browsed this page sees a short activity list; the report
  is still useful because it carries the app version and platform.

## Edge Cases

- The screenshot option appears only where the browser can capture the screen
  (`getDisplayMedia`), on the web. 6529 Mobile and 6529 Desktop don't show it.
- If the person cancels the capture picker, the page says "No screenshot was
  captured." and sends without one.
- A report larger than 256 KB after compression is not sent; the page asks the
  person to remove the screenshot.

## Failure and Recovery

- Offline: "You seem to be offline. Check your connection and try again."
- Rate limit (5 reports an hour): "Too many reports were sent from this
  connection. Try again in an hour."
- Backend not configured: "Reports can't be received right now. Try again
  later."
- Any other failure: "The report couldn't be sent. Try again." The Send button
  stays available.

## Limitations / Notes

- Error messages are scrubbed of URLs, emails, tokens, wallet addresses,
  identifiers, quoted text, @handles, paths and words with digits. Plain words
  remain, which is why the person sees the full report before sending.
- The recorder's local copy lives in the tab's session storage for at most an
  hour. See [First-party telemetry](../developer/first-party-telemetry.md).

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Cookie Consent and Performance Analytics](feature-cookie-consent-and-performance-analytics.md)
- [First-party telemetry (developer)](../developer/first-party-telemetry.md)
