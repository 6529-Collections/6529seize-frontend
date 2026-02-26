# API Authentication and Media Drop Flow

## Overview

The `/tools/api` page explains how to authenticate against the 6529 API and how
to create wave drops with embedded media using multipart upload.

## Location in the Site

- Route: `/tools/api`
- Navigation path: `Tools -> API`
- External API reference linked from the page: `https://api.6529.io/docs/`

## Entry Points

- Open `Tools -> API` from the sidebar.
- Open `/tools/api` directly.
- Open the external API reference from the link on the page.

## Terminology Snapshot

The page includes a key-terminology glossary used by the examples and endpoint
descriptions, including `Identity`, `Profile`, `Brain`, `Wave`, drop types,
`Groups`, `REP`, and `NIC`.

## User Journey

1. Open `/tools/api` and review terminology used across API endpoints.
2. Follow the authentication flow: request nonce, sign it with wallet, submit
   signature, and receive a bearer token.
3. In the auth example, include `short_nonce=true` on nonce request, read
   `nonce` and `server_signature` from that nonce response, then submit the
   signed payload to login with `server_signature`.
4. Use that token for protected API requests.
5. For media drops, start multipart upload (`/api/drop-media/multipart-upload`)
   with file name and MIME type.
6. Request signed upload URLs for each part
   (`/api/drop-media/multipart-upload/part`) using `upload_id`, `key`, and
   `part_no`, then upload file bytes.
7. Collect ETags from each successful part upload and keep only valid values.
8. Complete multipart upload (`/api/drop-media/multipart-upload/completion`)
   with `upload_id`, `key`, and `parts` to receive a `media_url`.
9. Submit drop payload with the `media_url` and target `wave_id` (replace the
   example placeholder before sending).

## Common Scenarios

- Authenticate once, then call read/write endpoints with a bearer token.
- Upload a small media file as one part, then create a `CHAT` drop with that
  media URL.
- Upload larger media as multiple parts by repeating part URL retrieval and
  upload steps before completion.
- Use the page examples as a starting point for scripting with Node.js.
- Use the glossary section first when mapping API terms to UI concepts.

## Edge Cases

- Non-standard file extensions can resolve to a generic content type, which may
  affect downstream media behavior.
- Auth examples explicitly warn against hardcoding private keys.
- Multipart completion requires matching ETags for every uploaded part; missing
  values block completion.
- Drop creation requires a valid target `wave_id`; placeholder values must be
  replaced before requests succeed.
- The page notes that some API routes are still undocumented even though they
  are in active use.

## Failure and Recovery

- If nonce/login requests fail, token generation does not complete; retry after
  confirming wallet address and signature flow.
- If nonce response fields are incomplete (for example missing
  `server_signature`), rerun the nonce/sign/login sequence with fresh values.
- If part upload fails, retry that part and keep the ETag returned by the
  successful upload response.
- If authentication is retried from the same session, request a fresh nonce and
  complete a new signing attempt before resubmitting.
- If multipart completion fails, do not create the drop until a valid `media_url`
  is returned.
- If drop creation fails after media upload succeeds, reuse the same `media_url`
  in a retried drop request.

## Limitations / Notes

- `/tools/api` is a guide page, not an interactive API console.
- Examples are Node.js-focused and may require adaptation for other runtimes.
- Some backend routes are not yet included in the external docs site.
- Example payloads center on `CHAT` drops with media; other drop types can
  require different fields.

## Related Pages

- [API Tool Index](README.md)
- [Block Finder](feature-block-finder.md)
- [Memes Subscriptions Report](feature-memes-subscriptions-report.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Wave Drop Media Download](../waves/drop-actions/feature-media-download.md)
- [Docs Home](../README.md)
