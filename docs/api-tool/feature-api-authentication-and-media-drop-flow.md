# API Authentication and Media Drop Flow

## Overview

`/tools/api` is a code-first guide for working with backend endpoints from Node.js:

- Authenticate with an Ethereum wallet and get a bearer token.
- Upload media via multipart and create a media drop.
- Keep a common vocabulary for API payloads.

Route: `/tools/api`

Sidebar path: `Tools -> API`

API reference: `https://api.6529.io/docs/`

## What this page is

- No interactive API console is embedded.
- The page currently focuses on two runnable examples and the API terms they use.

## Authentication flow

1. Request a nonce:
   - `GET https://api.6529.io/api/auth/nonce?signer_address=<address>&short_nonce=true`
   - `short_nonce` defaults to `false`.
   - Response includes `nonce` and `server_signature`.
2. Sign `nonce` with the same wallet.
3. Exchange the signature:
   - `POST https://api.6529.io/api/auth/login?signer_address=<address>`
   - JSON body: `client_address`, `client_signature`, `server_signature`.
4. Read `token` and send it as `Authorization: Bearer <token>` on protected calls.
5. Use the token in the `/tools/api` sample feed request:
   - `GET https://api.6529.io/api/feed`

Example note from implementation:

- The embedded auth/feed sample parses `resp.json()` directly. In production, check `resp.ok` before parsing JSON so non-2xx responses surface clear errors.
- Invalid signature, signer address, or server signature returns an error at login.

## Multipart media drop flow

1. Start upload:
   - `POST https://api.6529.io/api/drop-media/multipart-upload`
   - Header: `Authorization: Bearer <token>`
   - Body: `file_name`, `content_type`
   - Response: `upload_id`, `key`
2. Get a pre-signed part URL for each part:
   - `POST https://api.6529.io/api/drop-media/multipart-upload/part`
   - Body: `upload_id`, `key`, `part_no` (1-based)
   - Response: `upload_url`
3. Upload bytes directly to `upload_url` using `PUT`.
   - Do **not** include API auth on this request.
   - Save returned `ETag` (strip quotes) for each successful part.
4. Complete multipart upload:
   - `POST https://api.6529.io/api/drop-media/multipart-upload/completion`
   - Body: `upload_id`, `key`, `parts: [{ part_no, etag }]`
   - Response: `media_url`
5. Create the drop:
   - `POST https://api.6529.io/api/drops`
   - `drop_type: "CHAT"`, `wave_id`, and `parts[0].media[0]` with `url` + `mime_type`.

## Error recovery

- Re-run nonce/login if either auth step fails.
- Retry only the failed media part and keep successful `ETag`s.
- Retry completion after a part failure before submitting the drop.
- If `complete` succeeds but `/drops` fails, reuse the same `media_url` on retry.

## Key terms used in API payloads

- Identity: one or more Ethereum addresses.
- Profile: data linked to an identity, including handle and metadata.
- Brain: the social namespace containing waves.
- Wave: chat/participation space.
- Drop: a single message inside a wave.
- Groups: filters for identities (including TDH, REP, NIC).
- REP: reputation tag.
- NIC: trust tags.

## Limits and notes

- `short_nonce=true` is easier for programmatic callers; `short_nonce=false` returns a longer nonce.
- Examples are Node.js-focused and use placeholder keys and addresses.
- Not every public endpoint is demonstrated in this page.

## Related pages

- [API Tool Index](README.md)
- [Block Finder](feature-block-finder.md)
- [Memes Subscriptions Report](feature-memes-subscriptions-report.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Wave Drop Media Download](../waves/drop-actions/feature-media-download.md)
- [Docs Home](../README.md)
