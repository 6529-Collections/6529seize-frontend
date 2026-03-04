# API Authentication and Media Drop Flow

## Overview

`/tools/api` is a static guide page with copyable Node.js examples for:

- Ethereum-signature authentication (`nonce -> sign -> login -> bearer token`)
- Multipart media upload and drop creation
- Common API vocabulary used in payloads

## Location in the Site

- Route: `/tools/api`
- Web sidebar path: `Tools -> Other Tools -> API`
- Native app sidebar path: `Tools -> API`
- Also linked from site footer as `API`
- External reference: `https://api.6529.io/docs/`

## Entry Points

- Open `API` from the Tools menu.
- Open `/tools/api` directly.
- Open the footer `API` link.

## Page Behavior

- The page is read-only content with code examples.
- No API calls execute from this page.
- No interactive API console is embedded.

## Authentication Example Flow

1. Request nonce:
   - `GET https://api.6529.io/api/auth/nonce?signer_address=<address>&short_nonce=true`
2. Sign returned `nonce` with the same wallet.
3. Login:
   - `POST https://api.6529.io/api/auth/login?signer_address=<address>`
   - Body: `client_address`, `client_signature`, `server_signature`
4. Read `token` from response.
5. Use `Authorization: Bearer <token>` for protected requests
   (example shows `GET https://api.6529.io/api/feed`).

## Multipart Media-Drop Example Flow

1. Start multipart upload:
   - `POST https://api.6529.io/api/drop-media/multipart-upload`
   - Body: `file_name`, `content_type`
2. Request per-part upload URL:
   - `POST https://api.6529.io/api/drop-media/multipart-upload/part`
   - Body: `upload_id`, `key`, `part_no`
3. Upload bytes with `PUT` to `upload_url` (no API bearer header).
4. Save each part `ETag` (without surrounding quotes).
5. Complete upload:
   - `POST https://api.6529.io/api/drop-media/multipart-upload/completion`
   - Body: `upload_id`, `key`, `parts: [{ part_no, etag }]`
6. Create drop with returned `media_url`:
   - `POST https://api.6529.io/api/drops`
   - Payload includes `drop_type: "CHAT"`, `wave_id`, and media URL/mime type.

## Failure and Recovery

- Route-level failures do not apply here because the page itself does not send requests.
- In your script, re-run nonce/login on authentication failure.
- Retry failed multipart parts only, then complete upload again.
- If upload completion succeeds but `/drops` fails, reuse the same `media_url`.
- Invalid signatures or signer data fail at login.

## Key Terms in the Page

- Identity: one or more Ethereum addresses.
- Profile: user data linked to an identity.
- Brain: 6529 social namespace containing waves.
- Wave: chat/participation space.
- Drop: one message inside a wave.
- Groups: identity filters (for example TDH, REP, NIC).
- REP: reputation signal.
- NIC: trust signal.

## Limits and Notes

- `short_nonce=true` returns a short nonce format; `short_nonce=false` returns a longer message nonce.
- Examples are Node.js-oriented and use placeholders.
- The page notes that some API routes are still undocumented.
- Current auth example parses JSON directly; production scripts should gate on `response.ok` first.

## Related Pages

- [API Tool Index](README.md)
- [Block Finder](feature-block-finder.md)
- [Memes Subscriptions Report](feature-memes-subscriptions-report.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Wave Drop Media Download](../waves/drop-actions/feature-media-download.md)
- [Docs Home](../README.md)
