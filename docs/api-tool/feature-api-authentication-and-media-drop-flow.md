# API Authentication and Media Drop Flow

## Overview

`/tools/api` is a read-only guide for the 6529 REST API.

- It explains wallet-signature authentication (`nonce -> sign -> login -> token`).
- It shows a multipart media upload flow and drop creation flow.
- It defines key API terms used in routes and payloads.
- It links to the full external API reference: `https://api.6529.io/docs/`.

## Location in the Site

- Route: `/tools/api`
- Web sidebar path: `Tools -> Other Tools -> API`
- Native app sidebar path: `Tools -> API`
- Footer link: `API`

## Entry Points

- Open `API` from Tools navigation.
- Open `/tools/api` directly.
- Open `API` from the site footer.

## Page Structure and Behavior

- The page is static content. It does not execute API calls.
- It has four sections: `Introduction`, `Key terminology`, `Authentication`,
  and `Creating drops with embedded media`.
- It includes two Node.js snippets:
  - auth and bearer-token usage
  - multipart upload and drop creation
- Each snippet has a `Copy` button with temporary `Copied!` feedback.
- The introduction includes an inline note that some routes are still
  undocumented.

## Authentication Example Flow

1. Request nonce:
   - `GET https://api.6529.io/api/auth/nonce?signer_address=<address>&short_nonce=true`
2. Read `nonce` and `server_signature` from the response.
3. Sign `nonce` with the same wallet private key.
4. Login:
   - `POST https://api.6529.io/api/auth/login?signer_address=<address>`
   - JSON body: `client_address`, `client_signature`, `server_signature`
5. Read `token` from the login response.
6. Call protected routes with `Authorization: Bearer <token>`.
   - The snippet uses `GET https://api.6529.io/api/feed` as the example.

### Nonce Format Note

- `short_nonce=true`: short nonce string (script-friendly).
- `short_nonce=false`: long multiline nonce message.

## Multipart Media-Drop Example Flow

1. Authenticate first and keep the bearer token.
2. Read local file bytes.
3. Derive MIME type from file extension (`content_type`).
4. Start multipart upload:
   - `POST https://api.6529.io/api/drop-media/multipart-upload`
   - Body: `file_name`, `content_type`
5. Request an upload URL for a part:
   - `POST https://api.6529.io/api/drop-media/multipart-upload/part`
   - Body: `upload_id`, `key`, `part_no`
6. Upload bytes to the returned `upload_url` with `PUT`.
   - Send file bytes and content type.
   - Do not send API bearer auth to the S3 upload URL.
7. Save the returned part `ETag` and strip wrapping quotes.
8. Complete multipart upload:
   - `POST https://api.6529.io/api/drop-media/multipart-upload/completion`
   - Body: `upload_id`, `key`, `parts: [{ part_no, etag }]`
9. Create drop with the returned `media_url`:
   - `POST https://api.6529.io/api/drops`
   - Body includes `drop_type`, `parts`, `signer_address`, `wave_id`,
     `mentioned_users`, `referenced_nfts`, `metadata`, `signature`,
     `is_safe_signature`.

### Media-Drop Payload Notes

- The snippet uses one part (`part_no = 1`) for readability.
- Large files can be split and uploaded as multiple parts.
- `wave_id` is a placeholder in the snippet:
  `TARGET_WAVE_ID_GOES_HERE`.
- The snippet expects `token` and `wallet.address` to already exist.

## Key Terms in the Page

- Identity: one or more Ethereum addresses representing a user.
- Profile: user properties linked to an identity.
- Brain: 6529 social namespace that contains waves.
- Wave: channel/chat space with its own participation rules.
- Drop: message in a wave (`CHAT`, `PARTICIPATORY`, `WINNER`).
- Groups: identity filters used for access and discovery (for example TDH, REP,
  NIC).
- REP: reputation signal.
- NIC: trust signal.

## Failure and Recovery

- Route-level loading, empty, and API-error states do not apply; the route is
  static documentation.
- If clipboard access is blocked, `Copy` may not switch to `Copied!`.
- The auth snippet parses JSON directly and does not guard with `response.ok`.
  Add status checks in production scripts.
- The multipart snippet throws on non-OK responses for:
  `multipart-upload`, `multipart-upload/part`, S3 `PUT`,
  `multipart-upload/completion`, and `/api/drops`.
- If a multipart part fails, retry failed part uploads, then retry completion.
- If completion succeeds but `/api/drops` fails, retry `/api/drops` with the
  same `media_url`.

## Limits / Notes

- Examples are Node.js-oriented and include placeholders (`0x...`, private key,
  `TARGET_WAVE_ID_GOES_HERE`).
- The media snippet uses `node-fetch`, `fs/promises`, `path`, and
  `mime-types`.
- Some API routes are still undocumented; use the external API docs for broader
  endpoint coverage.

## Related Pages

- [API Tool Index](README.md)
- [Block Finder](feature-block-finder.md)
- [Memes Subscriptions Report](feature-memes-subscriptions-report.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Wave Drop Media Download](../waves/drop-actions/feature-media-download.md)
- [Docs Home](../README.md)
