# API Authentication and Media Drop Flow

## Overview

`/tools/api` is a read-only guide for the 6529 REST API.

- It links to the full external-client API authentication guide.
- It explains the short native/script wallet-signature authentication
  quickstart (`session-nonce -> sign -> session-login -> access_token`).
- It shows a multipart media upload flow and drop creation flow.
- It defines key API terms used in routes and payloads.
- It links to the full external API reference: `https://api.6529.io/docs/`.

## Location in the Site

- Route: `/tools/api`
- Web sidebar path: `About -> Data & Developer Tools -> API`
- Native app sidebar path: `About -> Data & Developer Tools -> API`
- Footer link: `API`

## Entry Points

- Open `API` from Tools navigation.
- Open `/tools/api` directly.
- Open `/tools/api/authentication` from the authentication callout or
  quickstart link when you need refresh, logout, and security notes.
- Open `API` from the site footer.

## User Journey

1. Open `/tools/api`.
2. Review the introduction and terminology to confirm the page covers the
   intended auth or media-upload task.
3. Open the full API authentication guide if you need more than the quickstart.
4. Read the wallet-signature authentication example and copy the snippet when
   snippet when needed.
5. Read the multipart media-upload and drop-creation example and copy the
   snippet when needed.
6. Use the current contract highlights to spot recent payload/schema additions.
7. Follow the external API docs for endpoint-level details beyond the examples
   shown on this page.

## Page Structure and Behavior

- The page is static content. It does not execute API calls.
- It has a v2 auth callout plus sections for `Introduction`, `Key terminology`,
  `Authentication quickstart`, and `Creating drops with embedded media`.
- It includes two Node.js snippets:
  - native/script session-v2 auth and bearer-token usage
  - multipart upload and drop creation
- Each snippet has a `Copy` button with temporary `Copied!` feedback.
- The introduction includes an inline note that some routes are still
  undocumented.

## Authentication Quickstart Flow

The `/tools/api` example is intentionally short and external-client oriented.
The fuller guide lives at `/tools/api/authentication`.

1. Request a native session nonce:
   - `GET https://api.6529.io/api/auth/session-nonce?signer_address=<address>&client_type=native&chain_id=1`
2. Read `signable_message` and `server_signature` from the response.
3. Sign `signable_message` exactly with the same wallet private key.
4. Login:
   - `POST https://api.6529.io/api/auth/session-login`
   - JSON body: `client_type`, `client_address`, `client_signature`,
     `server_signature`
5. Read `access_token` from the login response.
6. Call protected routes with `Authorization: Bearer <access_token>`.
   - The snippet uses `GET https://api.6529.io/api/feed` as the example.

### Session Message Note

- The returned `signable_message` is the only text the wallet should sign.
- Do not trim, normalize, rebuild, JSON-stringify, or sign a `nonce` field.

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

## Current Contract Highlights

- The public API schema now exposes wave participation
  `submission_strategy` data in wave create/read/update payloads, alongside the
  existing scope, media, metadata, signature, terms, and period rules.
- Wave update payloads now document stricter immutability around wave type and
  existing participation strategy values, so API clients should preserve those
  fields unless they are intentionally resubmitting the current server values
  unchanged.
- Drop responses can now enrich `metadata[]` entries with `resolved_profile`
  when a metadata row maps to a profile, so clients no longer need to assume
  metadata is always just raw key/value text.
- Memes mint stats responses now expose explicit `mint_count`,
  `subscriptions_count`, and `total_count` counters in per-mint rows, totals,
  and yearly rollups.
- Use the external API docs for endpoint-level request/response details beyond
  the examples shown on `/tools/api`.

## Common Scenarios

- Open the API authentication guide before building or maintaining an external
  wallet-signature login flow.
- Review the quickstart snippet when you only need the basic bearer-token flow.
- Copy the multipart example while wiring media upload and drop creation in a
  Node.js script.
- Check the current contract highlights when generated clients or API payloads
  gain new wave-participation, metadata, or mint-stats fields.

## Edge Cases

- `/tools/api` is a static guide, so it does not confirm runtime API health or
  credentials.
- The snippets use simplified examples for readability and omit some production
  hardening, such as full response-status handling in the auth example.
- Copy-button feedback depends on browser clipboard support.

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

## Limitations / Notes

- Examples are Node.js-oriented and include placeholders (`0x...`, private key,
  `TARGET_WAVE_ID_GOES_HERE`).
- The auth example is for external native/script clients. First-party browser
  session internals are not covered by the quickstart.
- The media snippet uses `node-fetch`, `fs/promises`, `path`, and
  `mime-types`.
- Some API routes are still undocumented; use the external API docs for broader
  endpoint coverage.

## Related Pages

- [API Tool Index](README.md)
- [API Authentication](feature-api-authentication.md)
- [Block Finder](feature-block-finder.md)
- [Memes Subscriptions Report](feature-memes-subscriptions-report.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Docs Home](../README.md)
