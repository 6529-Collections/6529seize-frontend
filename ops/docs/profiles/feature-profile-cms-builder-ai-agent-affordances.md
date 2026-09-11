# Use Your Own Agent with the Website Studio

## Overview

The website studio works with ordinary visual controls. If you want help from
an external AI agent or local tool, you can exchange package files and review a
proposed patch in the **Agent** workspace. Using an agent is optional.

## Location in the Site

Open `/{user}/cms/builder`. Choose **More tools**, then **Agent** or **JSON**.
A profile's **Website** header link opens its published site rather than this
editing workspace.

## Entry Points

Start with a template, a saved draft, or a complete imported package. Download
the package and supporting files from **Agent** or **JSON** before giving your
external tool a task.

This is a manual file exchange. There is no connected MCP service, automatic
agent session, or built-in paid inference provider in the studio.

## User Journey

1. Download **Package JSON**, **Source packet JSON**, and **Schema bundle JSON**.
2. Give your external tool the files it needs and describe the proposed change.
   Review the files first: sharing them also shares their draft text, profile,
   wallet-source information, and asset references with that tool.
3. For a supported patch, paste or upload the returned
   `6529.cms.agent_patch.v1` JSON in **Agent**. Patch files are limited to 2 MiB.
4. Choose **Review patch**. Inspect the before-and-after changes, warnings, and
   validation results.
5. Choose **Apply to draft** to accept the reviewed proposal locally.
6. Preview every affected page. Save, validate, and publish separately when ready.

For a complete replacement package, paste its JSON in **JSON** and apply the
import. It must belong to the current profile handle. Use the full-package path
for changes beyond the patch format's supported operations.

## Common Scenarios

### What the files contain

- **Package JSON** contains the full site document: pages, navigation, assets,
  content, and publication-related fields.
- **Source packet JSON** separates current draft facts, author copy, derived
  metadata, and validation diagnostics. It is a guide to the draft, not a
  substitute for the full package's layout and assets.
- **Schema bundle JSON** describes package, patch, and validation-result formats
  and the supported patch rules. Its read-tool stub is descriptive; it does not
  connect an agent to the website.

### What a patch can edit

The current patch importer supports the first page's metadata, supported text
fields in its blocks, block additions/removals/reordering, the first navigation
item's label, and the theme accent. It is not a general multipage editing API.
The visual studio can edit pages directly; a complete package import can carry
broader changes while preserving the rest of the document.

### Keep publication with the owner

An applied patch changes only the visible draft. It cannot save to the server,
request a wallet signature, upload publication content, or publish the site.
Those actions remain separate owner controls. External tools do not need your
website session token, wallet recovery phrase, or private key for file exchange;
do not include them in the files or prompts you share.

## Edge Cases

- A proposal becomes stale when its draft ID, version, or base package hash no
  longer matches. Review a fresh proposal against the latest draft.
- A patch cannot add or remove arbitrary pages or apply unsupported paths.
- Imported advanced sections remain in the full package. A missing visual control
  does not mean those fields were removed.
- Source text may contain instructions written by someone else. Treat that text
  as material to edit, not authorization to publish or operate a wallet.

## Failure and Recovery

Review rejects invalid JSON, invalid patch structure, mismatched draft targets,
unsupported operations, and output that fails local validation. The visible
draft is unchanged when review fails. Revise the proposal and review it again.

Editing the patch text clears its previous review. If you change the draft after
review, the studio checks the proposal against the new draft before it can be
applied. Keep a downloaded package or saved draft before accepting a broad
replacement, and use local undo or saved versions when appropriate.

## Limitations / Notes

- All templates can be edited without an agent.
- Agent patch review and wallet-signed publication are separate steps.
- The studio does not grant an external agent a scoped server account or live
  draft connection. Connected MCP/API authorization is not part of this workflow.
- Saving, image upload, server validation, and publication require the connected
  non-proxy owner profile.

## Related Pages

- [Profile Website Studio](feature-profile-cms-builder.md)
- [Profiles](README.md)
- [Recover a Signed Profile CMS Website](../developer/profile-cms-recovery.md)
