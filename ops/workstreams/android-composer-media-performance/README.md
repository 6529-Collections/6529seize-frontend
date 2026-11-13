# Android composer emoji and media performance

Status: investigation prepared on 2026-11-03; resume on 2026-11-04.
No reproduction, root cause, or implementation has been established yet.

## Reported behavior

Following the Android keyboard layout fix in
[#4615](https://github.com/6529-Collections/6529seize-frontend/pull/4615),
the reporter confirmed that the keyboard issue was fixed and reported three
separate delays:

- Emoji loading is slow.
- Image uploads are slow.
- GIF loading and uploading are slow.

The supplied screenshot shows an emoji picker with category controls and a
search field rendered above an empty results area while the keyboard is open.
A single frame cannot establish the duration or cause of the delay. Treat these
as reports awaiting reproduction, and do not assume that they share a cause.

## Evidence still needed

- Reporter device, Android, app and WebView versions, keyboard, and network.
- Steps and timings, including first opening versus repeated opening.
- Image dimensions, file size and format, and the stage at which progress slows.
- Whether GIF delays affect provider search, preview, selection and sending,
  uploading a local GIF, or more than one of these paths.

Do not infer the reporter's device details from a different testing phone.

## Next session

1. Reproduce each report before changing code. Record controlled test assets,
   device details, network conditions, and timings without exposing private
   messages or account data.
2. Compare cold and warm emoji picker opening, category navigation, and search.
   Separate module/data loading, network requests, and rendering time.
3. Trace image selection, decoding or resizing, upload, server processing, and
   preview display to locate the slow stage.
4. Trace GIF search and preview separately from selection, sending, and local
   file upload. Check whether any delay shares the image-upload path.
5. Choose the smallest fix supported by the evidence and use the
   solution-review-loop workflow. Keep unrelated performance work separate.
6. Inspect affected browser coverage and add or update focused checks where
   needed. Recheck the working Android keyboard layout, including open/close
   transitions, and preserve iOS and mobile-web behavior.

Success means a measured reproduction and a scoped correction: the picker
shows results promptly, media progress reflects the actual operation, and no
keyboard gap or composer bounce returns. Set timing expectations from the
baseline and device evidence rather than inventing a threshold in advance.

## Current scope

This draft contains preparation only. No runtime code, tests, deployment, or
proposed implementation is included. Investigation and bot review of any future
implementation remain outstanding; no human review is requested.
