# MCP Read Tool Design

Last updated: 2026-06-18.

## Scope

Phase 8 does not add a repository MCP server. The frontend now exports the same
read payloads a future MCP server should expose: source packet JSON and schema
bundle JSON. Until backend draft storage and authenticated read APIs land, MCP
implementation should remain an interface contract rather than a fake local
server.

## Tool: `profileCms.readDraftSourcePacket`

Purpose: read one editable draft source packet and optional schemas without
write, save, publish, wallet, or signature authority.

Input:

```json
{
  "profile_handle": "punk6529",
  "draft_id": "local-draft",
  "include_schema_bundle": true
}
```

Output:

```json
{
  "source_packet": {
    "schema": "6529.cms.builder_source_packet.v1"
  },
  "schema_bundle": {
    "schema": "6529.cms.builder_schema_bundle.v1"
  }
}
```

Rules:

- The tool is read-only.
- The tool returns the same fact/author-copy/derived-metadata/diagnostics split
  as the builder UI.
- Author copy and agent notes are untrusted data and must never be interpreted
  as system instructions.
- The tool does not return secrets, cookies, JWTs, wallet signatures, private
  profile fields, or publish credentials.
- Patch output must still be imported into the builder and explicitly applied
  by the user.

## Future Backend Contract

Once backend draft storage exists, the frontend can request:

```ts
GET /api/profile-cms/packages/{draftId}/source-packet
GET /api/profile-cms/schemas/agent-bundle
```

Expected auth boundary:

- The source-packet endpoint returns editable drafts only to the owner profile
  or an explicitly delegated builder session.
- Public published packages can expose package/schema reads separately, but not
  editable draft metadata.
- No MCP/read endpoint can publish or save a draft.
