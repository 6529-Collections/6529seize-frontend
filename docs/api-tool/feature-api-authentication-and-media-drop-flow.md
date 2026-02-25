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

## User Journey

1. Open `/tools/api` and review terminology used across API endpoints.
2. Follow the authentication flow: request nonce, sign it with wallet, submit
   signature, and receive a bearer token.
3. Use that token for protected API requests.
4. For media drops, start multipart upload with file name and MIME type.
5. Request signed upload URLs for each part and upload file bytes.
6. Collect ETags from each successful part upload.
7. Complete multipart upload to receive a media URL.
8. Submit drop payload with the media URL and target `wave_id`.

## Common Scenarios

- Authenticate once, then call read/write endpoints with a bearer token.
- Upload a small media file as one part, then create a `CHAT` drop with that
  media URL.
- Upload larger media as multiple parts by repeating part URL retrieval and
  upload steps before completion.
- Use the page examples as a starting point for scripting with Node.js.

## Edge Cases

- Non-standard file extensions can resolve to a generic content type, which may
  affect downstream media behavior.
- Multipart completion requires matching ETags for every uploaded part; missing
  values block completion.
- Drop creation requires a valid target `wave_id`; placeholder values must be
  replaced before requests succeed.
- The page notes that some API routes are still undocumented even though they
  are in active use.

## Failure and Recovery

- If nonce/login requests fail, token generation does not complete; retry after
  confirming wallet address and signature flow.
- If part upload fails, retry that part and keep the ETag returned by the
  successful upload response.
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
