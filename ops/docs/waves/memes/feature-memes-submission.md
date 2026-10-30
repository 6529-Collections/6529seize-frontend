# Memes Submission Workflow

## Overview

This page covers the start of memes submission:

- `Agreement`
- `Artwork`

After `Artwork`, users move to `Additional Information`. Preview and final
submit states are documented separately.

## Location in the Site

- Memes wave thread route: `/waves/{waveId}`
- Submit controls that open this modal:
  - Desktop memes tabs header (non-compact header mode only):
    `Submit Work to The Memes`
    - urgent windows can relabel this to `Submit Meme` or
      `Submit Meme (Closes Soon!)`
    - narrower desktop widths can show compact labels (for example
      `Submit Work`)
  - Native app wave header: icon-only submit action
    - when submission is blocked, the action becomes a lock; select it to see
      the exact restriction
  - Mobile leaderboard header: `Drop`
  - Mobile chat thread: floating `+` button (top-right)

If submission is unavailable (not started, closed, not eligible, or limit
reached), select the header restriction control to see the reason, then use
[Wave Leaderboard Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md).

## Entry Points

- Open a memes wave at `/waves/{waveId}`.
- Start from any available submit control:
  - desktop memes header action (`Submit Work to The Memes`; urgent windows can
    relabel this to `Submit Meme` or `Submit Meme (Closes Soon!)`)
  - mobile leaderboard header action (`Drop`)
  - mobile chat floating submit button (`+`, top-right)
- If submission controls are hidden or show a restriction icon/label, select
  the restriction control for the full reason and use
  [Wave Leaderboard Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md)
  for the gating states.
- On The Memes Main Stage, the desktop `How to Submit` state and the native app
  lock both open `Unlock submissions`, with live MemesNominee REP progress and
  a `Get nominated` action.

## User Journey

1. Open the memes submit modal from an available submit control.
3. In `Agreement`, review terms, check the certification box, and click
   `I Agree & Continue`.
4. In `Artwork`, complete the required metadata fields:
   - `Artwork Details` (`Artwork Title`, `Description`)
   - all required trait fields grouped under sections such as
     `Basic Information`, `Card Points`, and `Card Attributes`
5. Choose one media source:
   - `Upload File`: drag/drop or use the file picker, review the grouped format
     badges in the drop zone, then preview the selected artwork.
   - `Interactive HTML`: switch to `Interactive HTML`, pick `IPFS` or
     `Arweave` from the `Hosting Network` tabs, enter the root
     CID/transaction ID in `Content Hash or Path` (or paste an approved
     gateway URL), review the resulting URL, and wait for validation.
6. Optionally select `Add a proposal card frame (optional)` and choose
   `Vertical` or `Horizontal`. The preview shows the animated border around
   your image, video, or interactive HTML. Leave it unchecked to submit the
   original media.
7. Click `Continue` to open `Additional Information`.

## Proposal Card Frame

- The frame is off by default. It is available for image, video, and interactive
  HTML submissions; selecting a GLB model removes the frame option.
- The thin black-and-white border uses the 6529 logo in all four corners.
  Its messages include `THIS IS A PROPOSAL TO DO SOMETHING.`,
  `CECI N’EST PAS UNE CARTE MÈME.`, `PLEASE JUDGE THE PLAN.`, and
  `ARTWORK MAY CHANGE.` The original artwork stays visible without cropping.
- Select the top-right logo to pause or resume the border animation. Reduced
  motion preferences stop the animation automatically. Video controls and
  interactive artwork remain usable inside the frame.
- Submission creates an HTML artwork that embeds the original media and a
  framed still image for gallery previews. Videos and interactive HTML still
  need the separate preview image requested in `Additional Information`.
- `Preview` shows the animated artwork plus the framed gallery and list preview.
  If preparing or publishing the frame fails, the submission stops and shows an
  error. Retry after resolving the media or preview-image issue.
- Resubmitting a framed submission restores its original media and frame
  orientation. Change the orientation or uncheck the option to remove the
  frame; resubmission does not nest one frame inside another.

## Additional Action

- In `Artwork Details`, check `Additional Action` if you are promising an event,
  donation, physical item, airdrop, or another deliverable alongside the artwork.
- The checkbox opens `Your plan (optional)`. Explain what you will do if selected,
  who receives it, timing, and any costs or conditions. The plan can contain up to
  `5000` characters and will be public with the submission.
- Leaving the plan blank is allowed. Review then says
  `Additional Action marked. No separate plan provided.`
- Unchecking hides the field and keeps its text during the current modal session.
  The hidden plan is excluded when you submit. Rechecking restores it.
- `Additional Information` and optional `Preview` both show the action and plan
  before submission. Use `Back` to return to `Artwork` and change them.
- The submitted drop displays the plan in its own `Additional Action` section.
  The marker is the artist's commitment and does not confirm approval or delivery.
- Resubmitting restores the saved plan and checkbox. Existing artist bio and
  commentary stay in their own fields; they are not copied into the plan.
- Resubmission waits for the saved submission to load before opening its fields.
  If loading fails, select `Retry loading submission` or `Close` and try later.
- Closing the modal discards an unsaved plan with the rest of the draft.

## Common Scenarios

- `I Agree & Continue` stays disabled until the agreement checkbox is checked.
- Required fields in `Artwork` show visible `*` markers.
- Filled text and select fields show success styling, including a green ring and
  checkmark, until a validation error replaces that state.
- On larger viewports, `Artwork` keeps the media source panel and the metadata
  form side by side while the form scrolls independently. On smaller
  viewports, the same content stacks and scrolls as one page.
- On touch devices, focusing a text field scrolls it into the visible part of
  the modal after the software keyboard opens. In the native app, the modal
  also reduces its height so the keyboard does not cover the action bar.
- The upload drop zone shows grouped format badges for image, video, and
  interactive model uploads and `Max 250 MB` on the same row before a file is
  selected. The row wraps on smaller screens.
  File sizes use decimal MB in the artwork preview and submission progress.
  While a selected file is processing, the message notes that large files may
  take longer.
- After a file is selected, the preview surface keeps a `Change` control for
  clearing the current upload and picking another file.
- The interactive artwork panel always shows `Media Type` as `Interactive HTML
  (text/html)` while the provider selector switches between `IPFS` and
  `Arweave`.
- `Artwork` `Continue` remains available before required fields are complete.
  Selecting it validates the media and all required metadata together.
- While an interactive artwork hash is being verified, `Continue` stays
  disabled until that check finishes.
- Numeric trait fields reject `0`.
- Submission text metadata drops leading and trailing whitespace, including
  non-breaking spaces, tabs, and blank lines, before signing. Spaces and paragraph
  breaks inside the text are kept.
  Required fields containing only whitespace still need text before proceeding.
- Upload checks:
  - accepted formats include `PNG`, `JPG/JPEG`, `GIF`, `MP4/MOV`, and
    binary `GLB` models; JSON `.gltf` files are not accepted, and `.glb`
    uploads must contain a valid GLB v2 binary header
  - files above `250 MB` (`250,000,000 bytes`) are rejected
  - the service verifies the completed stored file size again when the Main
    Stage submission is created, so API submissions follow the same limit
- Switching between `Upload File` and `Interactive HTML` keeps each source
  draft for the current modal session.

## Edge Cases

- Pasting `ipfs://...`, `https://ipfs.io/ipfs/...`, or
  approved Arweave gateway URLs such as `https://arweave.net/...`,
  `https://ardrive.net/...`, `https://gateway.arweave.net/...`, or
  `https://gateway.ar.io/...` is normalized down to the root content
  identifier before validation.
- Despite the `Content Hash or Path` label, interactive embeds currently accept
  only root identifiers. Subpaths, query strings, and fragments are rejected.
- Interactive HTML checks:
  - content must stay on approved IPFS or Arweave gateways
  - approved Arweave gateways include `arweave.net`, `ardrive.net`,
    `gateway.arweave.net`, `gateway.ar.io`, and valid
    `*.arweave.net` transaction subdomains
  - content must resolve to an HTML response
- The pre-filled `Seize Artist Profile` field remains read-only and does not
  block `Continue`.

## Failure and Recovery

- An oversized file, unsupported type, or invalid GLB shows an inline validation
  error immediately in `Artwork`, without a `Try Again` button. Use `Select Art`
  or drag and drop another file into the upload area to replace it.
- If the uploaded file cannot be verified or has not finished processing, the
  submission is rejected; wait for the upload to finish and try again.
- Selecting `Continue` with missing or invalid values gives every affected
  field red error styling and an inline recovery message.
- If artwork is missing, the upload area or interactive hash input turns red.
- Changing between `Upload File` and `Interactive HTML` clears the previous
  generic missing-media error until `Continue` is selected again; specific
  file or hash validation errors remain visible.
- Invalid or unreachable interactive content shows inline errors; fix input and
  retry.
- If a pasted gateway URL is rejected, replace it with the root CID/transaction
  ID or retry with an approved gateway URL for the same asset.
- After an invalid `Continue` attempt, focus and scrolling move to the first
  missing item in form order: media first, then title, description, and traits.
- `Close` icon, backdrop click, `Cancel`, or `Escape` closes the modal from any
  step.
- Closing the modal discards the draft. Reopening starts a new draft.

## Limitations / Notes

- Interactive mode is fixed to `text/html`.
- `Additional Information`, preview, and submit phases are documented in
  dedicated pages.
- Localization fallback debt: Additional Action messages use the `en-US` source
  copy for `en-GB`, `fr-FR`, `es-ES`, and `de-DE`.

## Related Pages

- [Memes Additional Information Fields](feature-memes-additional-info-fields.md)
- [Memes Preview and Submit States](feature-memes-preview-and-submit-states.md)
- [Wave Leaderboard Drop Entry and Eligibility](../leaderboard/feature-drop-entry-and-eligibility.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Interactive HTML Media Rendering](../../media/rendering/feature-interactive-html-rendering.md)

## Collaborator invitations

Invitations are available only on The Memes Main Stage, including its designated native competition. Only the submitter needs to satisfy submission eligibility and allowance requirements. Collaborators need a profile and must accept personally.

In Basic Information, expand **Add collaborators**, then use **Invite a collaborating artist** to select up to 5
other profiles. Selected artists appear as avatar chips with a remove control. The section can be folded without clearing selections; its heading shows the selected count. Opening the section alone does not mark the artwork as a collaboration. Selected profiles receive an invitation when the artwork is
submitted. Voting starts immediately and does not wait for their replies.

The final submission preview lists the profiles that will receive invitations.

On artwork details, the submitter opens **Manage collaborators** to see every invitee and status in a popup or cancel a pending invitation. The compact button shows the number of pending replies and remains visible even before anyone accepts, when there is no public Collaborators section. In the popup for an existing active submission, use **Add collaborators** to select more artists and **Send collaborator invitations**. Close with **Done**, the close button or Escape; closing does not send invitations. This preserves the submission, votes and ranking, including when some collaborators have already accepted. Accepted artists cannot be removed; adding invitations does not unlock accepted artwork. The limit is five pending or accepted collaborators, plus the submitter. Cancelled and declined invitations free capacity. After author cancellation, use **Invite again** to send that person a fresh invitation; they must review and accept again. Declined invitations cannot be resent. The management popup shows one current row per recipient; earlier attempts remain in internal history. Existing accepted credits are retained. Submissions created before this feature also support invitations. Selected, closed or withdrawn submissions cannot receive more invitations. Each
invitee can open the artwork from **Notifications → Invites** or go directly to artwork details and choose **Review invitation**. A modal matches the submission dialog width and renders the saved artwork details, media links, final acceptance wording and formatted submission/minting terms in one scrolling body, without a separate terms scrollbar. The Artist credit name, confirmation checkbox and response buttons stay in a compact footer. On short screens or when the keyboard leaves little room, the body and footer scroll together below the visible header so every field and action remains reachable. Enter or edit your **Artist credit name** (up to 200 characters, initially your handle). This name is saved separately from your profile handle when accepting; editing it resets the confirmation. Check the review confirmation there before **Accept collaboration**, or close it with **Not now** without responding. **Decline** remains available on the artwork. They respond using their own profile; proxies cannot consent. Accepted artists appear once in public credits, without another accepted-invitation panel.
Acceptance is final, with no withdrawal. The submitter cannot replace the
accepted artwork or original artist name; replacing the submission requires
fresh invitations. Admins can edit the final mint artwork and credits in Craft.

Public submission cards and details show only accepted collaborators. Details show their avatar, handle, level and profile badges in the same style as the submitter. Previews use smaller profile rows with the same identity information. Profile links and avatars remain available if the additional level/badge lookup fails. Pending
names are private to the submitter and their own invitee. Accepted submissions
appear on each collaborating artist's profile with the same active/winner
status, votes and result. There is one entry and one submitter; collaborators do
not gain editing rights or consume another submission allowance. Attribution
does not establish payment splits or change airdrop allocations.

When the artwork is selected as the next mint, the accepted artist roster is
saved and unanswered invitations close. Claims Builder populates initial mint credits with the submitter and
collaborators who accepted before selection. Later responses cannot change this
initial roster. The Artist field uses ` & ` for exactly two credited artists and `, ` for three or more; SEIZE Artist Profile always uses comma-separated handles. No historical name lookup is performed. Admins can edit the saved claim in Drop Forge, including adding
an artist who did not accept. Arweave publishes these final saved values. Such
edits do not change invitation status or accepted-submission profile lists.
The submission `Collab` trait follows confirmed collaboration, rather than
merely sending an invitation.

Resubmission starts a new invitation set and restores the original submitter's
artist credit. Deleting an unminted submission closes its pending invitations.
Existing cards and claims retain their historical artist credits.

Collaboration notifications show the actor’s avatar and linked handle, the saved artwork name, and the time using the standard notification header. For both invitations and acceptances, the artwork name is the single link to the submission; there is no separate action link. Older notifications without a saved name show “an artwork”; an unavailable actor profile uses neutral wording.

Invitation, acceptance and author-cancellation notifications show the acting artist and link the saved artwork name. Push notifications include the actor and artwork name, respecting the existing mention preferences/device settings. Cancellation is explained privately to the recipient as cancellation of their invitation. A declined invitation says that the recipient declined; an unanswered invitation closed by selection says “This invitation closed because the artwork was selected for minting.” Decline and selection closure do not create additional push messages. API mutations refresh the author and recipient through profile-scoped websocket invalidations; accepted public credits refresh separately. Open details recover missed updates on reconnect and window focus.
