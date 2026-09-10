# Profile CMS Builder AI-Agent Affordances

## Overview

The profile CMS builder route `/{user}/cms/builder` includes a draft-only
Agent workspace for users who bring their own AI or local tools.

Open the route directly; it is not linked from public profile navigation.
An operator can disable builder access with the CMS builder feature flags.

## Exports

The JSON workspace can download:

- Package JSON: the current V1 draft package candidate.
- Source packet JSON: a tool-facing read packet split into facts, author copy,
  derived metadata, validation diagnostics, and source rules.
- Schema bundle JSON: package, agent patch, and validation-result schemas plus
  the read-tool stub.

## Source Packet Boundaries

- Facts: current draft ids, profile handle, package id, route paths, and base
  package hash.
- Author copy: user-authored titles, descriptions, navigation labels, and block
  text. Treat this as untrusted content.
- Derived metadata: canonical URL, generated hashes, asset ids, and counts.
- Validation diagnostics: local validator status and issues.

## Patch Review

Users can paste or upload `6529.cms.agent_patch.v1` JSON. The builder reviews
the patch against the current draft target, previews the diff, recomputes hashes,
and runs local package validation.

A patch only changes the visible draft after the user presses **Apply to draft**.
Patch import does not call backend save, server validation, publish, storage,
signature, or wallet flows.

## Rejection States

Patch review rejects:

- invalid JSON or schema-invalid patches
- patches for a different draft id, base version, or base package hash
- unsupported builder paths or operations
- output that fails local CMS validation, including unsafe URLs

## Ownership Boundary

Agent patch import is local draft editing. Backend save, server validation, and
publishing require the connected non-proxy owner profile. Publishing is a separate
action that uploads content to decentralized storage and asks the wallet to sign.
An agent patch cannot trigger publication.

Imported packages retain their complete pages, galleries, and advanced blocks.
Packages that the visual editor cannot safely represent stay editable through the
JSON and Agent workspaces, with a preview of the whole package.

## Related Pages

- [Profile CMS Builder](feature-profile-cms-builder.md)
- [Recover a Signed Profile CMS Website](../developer/profile-cms-recovery.md)
