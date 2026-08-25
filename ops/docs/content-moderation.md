# Content moderation

## Overview

Content moderation gives users private control over what they see, provides a
clear way to flag posts, and gives authorized occasional moderators a queue for
serious reports. It also applies a narrow safety check before new or edited
Wave posts are accepted.

The posting check is deliberately permissive. Most posts pass a lightweight
server-side screen without an AI call. Only a specific risk signal is escalated
to AI, and a post is rejected only for a high-confidence result. Profanity,
unpopular opinions, and ordinary offensive speech are not rejected merely for
being objectionable.

## Location in the site

- Open a post's More menu on desktop, or its action sheet on mobile, and select
  the final **Flag Content** entry.
- Open `/preferences?tab=content` to manage blocked profiles. The older
  `/content-preferences` path redirects to this tab.
- Authorized moderators can open `/content-moderation` from the app navigation
  or profile menu.

The unified `/preferences` page contains Notification, Messages, and Content
tabs and fills the available page height.

## Posting and the safety check

New and edited Wave posts are screened before the backend writes them. This
includes chat messages, replies, and direct messages because they are all
stored as drops.

A locally created post stays in its normal layout while the request is in
flight. The UI does not replace it with a prominent "being checked" message.
The backend response remains authoritative:

- on success, the server result replaces the optimistic post;
- on rejection, the unsent optimistic post remains in the current Wave with a
  subtle red treatment and **Not sent · Blocked by safety check** status; it is
  removed when the user leaves or refreshes the Wave and is never persisted;
  and
- when the evaluator is unavailable or uncertain, the permissive server policy
  allows the post.

Known unsafe destinations can be rejected directly. Other narrow signals are
reviewed by the AI check and require high confidence before rejection. File
attachments such as PDF and CSV files continue through their separate
asynchronous validation pipeline rather than the synchronous text check.

Luhn-valid payment-card candidates are one of the signals sent to the AI
check. Clearly labelled sandbox, test, example, or documentation card data is
allowed. A card number presented as genuine financial information can be
rejected as sensitive private information even when the author says it belongs
to them. The general fail-open rule still applies when the evaluator is
unavailable.

## Posting suspension

An authorized moderator can manually suspend a profile from publishing new or
edited drop content. A report or AI result does not suspend a profile
automatically.

Posting suspension:

- blocks new posts and edits before the normal safety screen runs;
- does not sign the user out or stop them reading the site;
- does not delete, hide, or change their existing posts; and
- remains active until an authorized moderator reinstates the profile.

When a suspended profile tries to publish or edit, the request is rejected and
the user is directed to contact support if they believe the suspension is a
mistake.

## Flag Content

**Flag Content** opens one dialog with no option selected by default. The user
can choose any one action or combine them:

- **Report this post** with a reason and optional context;
- **Hide this post for me**; or
- **Block this author**.

These are independent. A user can hide or block without reporting, and a
report does not automatically hide the post or block its author. A user cannot
report their own post.

Reporting confirms with **Report submitted.** Personal hide, unhide, block,
and unblock actions do not show redundant success toasts; failures keep or
restore the previous presentation and explain what did not complete.

## Personally hidden posts

A personally hidden post keeps its original space and layout under a strong,
non-interactive blur. The centered control reads **Hidden · Reveal · Unhide**.

- **Reveal** removes the blur only for the current mounted view. It makes no API
  request and does not change the saved preference.
- **Unhide** removes the saved hide through the API and updates mounted copies
  of the post immediately.

Short tooltips explain the difference between temporary Reveal and persistent
Unhide.

## Posts from blocked profiles

Blocking a profile changes the current viewer's experience; it does not alter
the author's account or posts for anyone else. Every mounted post by that
profile changes immediately to a blurred presentation with a small muted
profile picture, handle, and centered **Blocked · Reveal · Unblock** controls.

- **Reveal** shows only that post in the current mounted view without making an
  API request or unblocking the profile.
- **Unblock** removes the saved block through the API and updates all mounted
  posts by that profile immediately.

Blocked profiles remain reachable through their public profile pages. They can
also be unblocked from the Content tab under `/preferences`.

## Global moderation

A high-confidence urgent report assessment may temporarily quarantine a post.
Other assessments remain in the occasional moderator queue without changing
the post's global visibility.

Authorized moderators can review open reports at `/content-moderation`. Each
queue item includes the reported content and context, author, report details,
AI recommendation and evidence, current state, and audit history. Every allow,
quarantine, removal, suspension, or reinstatement requires a written reason.

Globally quarantined or moderator-removed posts are replaced by a redacted
tombstone across primary Wave views, replies, quotes, leaderboards, and related
notification data. Ordinary viewers cannot Reveal globally moderated content.
The author can still see their own globally moderated post and its moderation
state.

The moderator link is shown only to profiles whose server-provided access state
allows it. The backend checks every moderator request; hiding the link is not
the authorization boundary.

## Common scenarios

### Hide without reporting

Open **Flag Content**, select only **Hide this post for me**, and submit. The
post blurs immediately. Use Reveal for a temporary look or Unhide to remove the
saved preference.

### Block without reporting

Open **Flag Content**, select only **Block this author**, and submit. Mounted
posts by that author blur immediately. Reveal affects one post temporarily;
Unblock restores the author's mounted posts and removes the saved block.

### Report without changing the feed

Open **Flag Content**, select only **Report this post**, choose a reason, add
optional context, and submit. The report is sent without hiding the post or
blocking its author.

### Understand a rejected post

The failed row is a temporary local delivery record, not a published post. It
does not offer edit, retry, reaction, reply, or post-action controls. Submit a
new post if desired. Leaving or refreshing the Wave clears the failed row.
Contact support when a known-unsafe-link or safety rejection appears to be a
mistake.

## Failure and recovery

- If a personal hide, unhide, block, or unblock request fails, the UI restores
  the prior state instead of leaving an optimistic presentation behind.
- If only part of a combined Flag Content request succeeds, the dialog reports
  the partial failure so the user can retry the remaining action.
- If reported-content AI assessment is unavailable, the report is retained for
  human review rather than discarded.
- If a moderation WebSocket update is missed, the next API refresh converges on
  the saved server state.

## Limitations and notes

- Reveal is temporary and local to the mounted post. It never changes saved
  hide or block state.
- Unhide and Unblock are persistent API actions.
- Global moderation cannot be overridden by personal Reveal.
- Attachment safety is asynchronous and separate from the text gate.
- There is no continuous hold-before-publish review queue and no requirement
  for a full-time moderator.
- Report history and "unreport" controls are not exposed to users in this
  version.

## Related pages

- [Waves](waves/README.md)
- [Wave participation](waves/flow-wave-participation.md)
- [Wave navigation and posting](waves/troubleshooting-wave-navigation-and-posting.md)
- [Profile preferences](notifications/feature-profile-preferences.md)
- [Backend feature specification](https://github.com/6529-Collections/6529seize-backend/blob/main/docs/content-moderation.md)
