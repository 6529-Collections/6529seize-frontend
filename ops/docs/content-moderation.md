# Content moderation

6529 applies a narrow pre-publication safety check to new Wave posts. Most
posts pass a deterministic server-side screen without an AI call. Only a
specific risk signal is escalated to a permissive AI check, and ambiguous
content is allowed. Profanity, unpopular opinions, and ordinary offensive
speech are not filtered merely because they may be objectionable.

When the safety check rejects a post with high confidence, the composer keeps
the user's draft and explains why it could not be submitted so the user can
edit and retry. File attachments such as PDF and CSV continue through their
separate asynchronous validation pipeline.

A locally created optimistic post remains visible in its normal post layout
while the request is in flight. The backend response remains authoritative: a
successful response replaces the optimistic post, while a rejected request
removes it and preserves the draft for correction.

## Personal controls

Authenticated users can open the final **Report** entry in a post's More menu
on desktop or action sheet on mobile, then choose one or more independent
actions:

- report the post with a reason and optional context (selected by default);
- hide that individual post for themselves; or
- block the author for themselves.

The report option can be deselected, so a user can hide or block without
submitting a report. Submitting a report does not automatically hide the post
or block its author. A personally hidden post keeps a soft faded preview whose
original content is non-interactive, with a small persistent **Unhide** action.
A post from a blocked author uses a temporary **Show post** action that does not
unblock the author. Blocked profiles can be reviewed and unblocked at
`/content-preferences`, linked as **Content preferences** from the
authenticated profile menu.

## Global moderation

A high-confidence urgent report assessment may temporarily quarantine a post.
Authorized occasional moderators can use `/content-moderation` to review open
reports. Every allow, quarantine, removal, suspension, or reinstatement action
requires a written reason and is recorded by the backend.

Globally quarantined or moderator-removed posts are replaced by a redacted
tombstone everywhere, including primary Wave views, replies, quotes,
leaderboards, and notification-related drop data. Global tombstones cannot be
temporarily revealed by viewers.

The moderation queue link is only shown in the app sidebars and profile menu to
profiles whose server-enforced role allows access. Direct navigation is also
checked by the backend; hiding the link is not the authorization boundary.
