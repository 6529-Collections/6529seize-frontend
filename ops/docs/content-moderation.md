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

## Personal controls

Authenticated users can open a post's More menu on desktop or action sheet on
mobile to:

- report the post with a reason and optional context;
- hide that individual post for themselves; or
- block the author for themselves.

Submitting a report does not automatically hide the post or block its author.
The report dialog offers those as separate, explicit personal choices. A
personally hidden post is replaced by a tombstone with a persistent **Unhide
post** action. A post from a blocked author uses a temporary **Show post**
action that does not unblock the author. Blocked profiles can be reviewed and unblocked at
`/content-preferences`, linked as **Content preferences** from the authenticated
profile menu.

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
