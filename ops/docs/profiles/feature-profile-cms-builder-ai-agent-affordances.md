# Use Your Own Agent with the Website Studio

## Overview

Every template works with the studio's point-and-click controls. For help with
writing or design, bring an external agent through file exchange or temporary
access to one saved draft. Use your own agent subscription or API account; the
studio does not provide paid inference.

## Location in the Site

Open `/{user}/cms/builder`, choose **More tools**, then **Agent**. The profile
header's **Website** link opens the published site, rather than this editor.

## Entry Points

Start with a template, saved draft, or complete imported package. **Exchange a
file** works with the document currently open in the editor. **Connect an
agent** requires a saved draft and the signed-in, non-proxy profile owner.

## User Journey

### Exchange a file

1. Choose **Download agent kit**. It includes every page, existing artwork
   references, schemas, and editing instructions. Review its draft text and
   wallet-source information before sharing it with your chosen agent.
2. Give your agent the file and describe your changes. Ask it to return the
   proposal format included in the kit.
3. Choose **Upload proposal** and select the returned JSON file, up to 1 MiB.
4. Inspect **Current draft**, **Proposed website**, every affected page, and
   **All changes**. The summary comes from the external agent; check the actual
   content and links yourself.
5. Choose **Use in draft** to accept the reviewed document locally. Save and
   publish separately when ready.

### Connect an agent

1. Save your current changes as a draft. Add any new artwork in the studio first.
2. Enter a **Connection name**, choose access for **1 hour**, **4 hours**, or
   **24 hours**, and choose **Create access key**.
3. Copy the key into your agent client's private environment configuration.
   It is shown once; keep it out of chat prompts and website files.
4. Choose **Download local MCP adapter** and follow the **Setup guide**. The
   adapter requires Node.js 22 or newer and a client that can launch a local
   MCP process. Extract the complete ZIP; no package installation is needed.
5. Ask your agent to read the saved draft, make a complete proposed revision,
   validate it, and submit it for review.
6. Choose **Refresh**, then **Review** beside a proposal. Inspect all pages and
   changes. Choose **Save proposed draft** to save the exact reviewed revision,
   or **Reject proposal** to decline it.
7. Open the saved draft and publish through the separate owner controls when
   ready. Saving an agent proposal does not publish a website.

## Common Scenarios

### What an agent can change

Both workflows support complete websites with several pages: writing, pages,
navigation, blocks, layout, and design. The proposal must retain the website's
identity and existing ordered artwork catalog. It can rearrange or reference
that artwork. Add new images through the visual editor, save a new base, and
give the agent a fresh kit or connection for further work.

Connected access belongs to one exact saved revision. It permits reading that
draft, validating candidates, submitting proposals, and reading their status.
It cannot save or overwrite drafts, upload media or permanent publication
content, sign, publish, unpublish, or change the profile. The owner decides
which proposal to save and whether to publish it.

### Revoke access or review older work

Choose **Revoke access** beside a connection to stop its future requests.
Access also expires automatically. Proposals already submitted remain available
for owner review after access expires or is revoked. **Load older activity**
retrieves earlier entries for the selected saved draft.

### Existing patch files

**Advanced source and legacy patches** retains Package JSON, Source packet JSON,
Schema bundle JSON, and the older `6529.cms.agent_patch.v1` review controls.
That patch format edits supported first-page fields only and accepts files up
to 2 MiB. Use the full agent kit for multipage changes. Complete packages can
also be imported through **JSON** for the current profile handle.

## Edge Cases

- A file proposal must match the current document's base hash. Editing the
  document makes an older proposal stale; give the agent a fresh kit.
- Connected proposals are reviewed against their exact saved base. Unsaved
  editor changes must be saved before accepting a connected proposal.
- Apply or discard pending JSON and visual form edits before replacing the
  document. Invalid proposals leave the current draft unchanged.
- Agent summaries and source text can contain instructions from someone else.
  They are content to review, not permission to operate a wallet or publish.
- A client that cannot launch a local MCP process can use file exchange. The
  adapter supports MCP 2025-11-25 and does not claim every newer client revision.

## Failure and Recovery

**Refresh** retrieves current access and proposal status. If a key is lost,
revoke that connection and create a new one. Expired or revoked keys cannot be
recovered. Access and proposal quotas can reject requests; check the displayed
message before creating more connections.

If a save response is lost, **Retry save confirmation** checks whether the
same proposed revision reached the server. It does not create another draft.
The studio retains a small recovery record in this browser and blocks another
connected-proposal save until the result is confirmed. Zero or multiple matching
saved revisions remain unresolved; neither proves the original request failed.
Keep that recovery record and inspect **Versions** rather than repeating the
save from another browser. Apply or discard pending JSON first; restoring a
confirmed draft asks before replacing unsaved local work.

If the draft is confirmed but its proposal status could not be recorded, choose
**Retry status update**. It updates the review receipt without replacing your
open document or saving another draft. Safe connected-proposal saves require
local storage and browser Web Locks. File exchange and ordinary visual editing
remain available if those browser features are unavailable.

## Limitations / Notes

- The downloaded kit has no access credential, but it contains your draft and
  its references. Sharing it gives that content to your chosen agent provider.
- The access key is separate from your website login. Neither workflow needs
  your wallet private key or recovery phrase.
- The local adapter makes no model calls and has no automatic background retry.
  Your agent's own account supplies inference.
- Wallet-signed publication remains a separate owner action.

## Related Pages

- [Profile Website Studio](feature-profile-cms-builder.md)
- [Profiles](README.md)
- [Recover a Signed Profile CMS Website](../developer/profile-cms-recovery.md)
