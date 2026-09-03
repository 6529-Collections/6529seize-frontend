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
- Open `/preferences?tab=blocked-profiles` to manage blocked profiles, or the
  adjacent **Reports** tab to track reports and their public outcomes. The
  older `/content-preferences` and `?tab=content` routes remain compatible and
  resolve to the blocked-profile view.
- Authorized moderators can open **WatchTower** at `/content-moderation` from
  the desktop, mobile-browser, and mobile-app side navigation. It is not shown
  in the profile menu. The page heading is **WatchTower - Content Moderation**.

The unified `/preferences` page contains **Notifications & messages**,
**Blocked Profiles**, and **Reports** tabs and fills the available page height.
Preferences are saved to a profile.
An authenticated wallet without a profile is offered the existing profile
creation flow before the controls in either tab become available.

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

Structured private-data patterns, including US Social Security number patterns
and Luhn-valid payment-card candidates, are signals sent to the AI check.
Clearly labelled fictitious, sandbox, test, example, redacted, or documentation
data is allowed. A genuine usable private identifier can be rejected whether
it belongs to the author or another person; ownership claims and known test
status are context rather than automatic allow rules. The general fail-open
rule still applies when the evaluator is unavailable.

## Posting suspension

An authorized moderator can manually suspend a profile from publishing new or
edited drop content. A report or AI result does not suspend a profile
automatically.

Posting suspension:

- blocks new posts and edits before the normal safety screen runs;
- does not sign the user out or stop them reading the site;
- does not delete, hide, or change their existing posts; and
- remains active until an authorized moderator reinstates the profile.

Before rendering a post composer, the client checks the active profile's
public moderation status. While that check is in flight it shows **Checking
posting access…**. A suspended profile sees **Profile suspended · Posting
disabled. Contact support if this is an error.** instead of an input or Post
button.
The backend remains authoritative: if a stale client still submits and receives
the structured suspension rejection, it immediately updates that profile's
cached status and replaces the composer. A failed status lookup does not
incorrectly block posting; the backend makes the final decision.

## Flag Content

**Flag Content** opens one dialog with no option selected by default. The user
can choose an action or combine reporting with blocking:

- **Report post** sends the post to moderators for review, with a reason and
  optional context, and automatically hides it for the reporter;
- **Hide post** hides only that post from the viewer; or
- **Block author** hides the author's content, mutes their activity, and
  unfollows them without notifying them.

Hide-only and block-only remain available without reporting. Selecting Report
marks Hide as included, while Block author remains optional. A user cannot
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

An open reported post keeps a compact **Reported** control with the hidden-post
actions. Reveal is still temporary and Unhide removes only the personal hide;
neither action withdraws the report. If the post is visible, the compact
control appears inside that post rather than as an ambiguous line between
posts. Hovering it shows the full state, and clicking or tapping it opens the
report details. The full viewer-facing states are **Reported · Awaiting
review**, **Reviewed · No action taken**, and **Reviewed · Content removed**.
Only the reporter sees this personal report state. Internal moderator notes,
AI details, moderator identity, and other reporters are never exposed.

Clicking or tapping a post's reporter-only **Reported** or **Reviewed** control
opens a dedicated report-status view rather than reopening the action form. An
open report shows that it is awaiting review and offers **Withdraw report**.
Resolved reports show **Report reviewed** with **No action taken** or **Content
removed** and no stale Report, Hide, or Block checkboxes. A successful
withdrawal closes the dialog and leaves the post hidden. Withdrawal is
auditable, does not affect other reporters, and does not become available again
after resolution. The same profile cannot report the unchanged post again
after either reviewed outcome, while other profiles may still report it
independently. Withdrawing an open report permits that profile to submit a
later report. Blocking remains an independent profile action.

The **Reports** tab at `/preferences?tab=reports` lists the current profile's
own reports, the reported profile, a snapshot of the reported post, reason,
submission date, and public status. The snapshot remains available when the
live post has been removed, while media and files stay collapsed by default.
Each report keeps the current Wave name and picture visible and links to that
Wave even when the post itself has been removed. Visible posts also provide a
direct link to the exact post, using the direct-message route when applicable.
Open reports can also be withdrawn there. Resolved reports show the public
moderator outcome, but never expose AI assessment details, reply-parent
evidence, internal notes or reasons, moderator identity, or other reporters.

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
also be unblocked from the **Blocked Profiles** tab under `/preferences`; the
profile picture and handle in that list link to the public profile. A blocked
profile's header shows a red-tinted **Blocked** status beside the handle and a separate
**Unblock** action where **Follow** normally appears. Follow and
notification-mute actions are hidden while the block is active because the
block already provides those states. Direct message remains available. Unblock
opens a confirmation dialog; confirming restores the applicable actions
immediately without changing the viewer's saved notification preference or
refollowing the profile. On an unblocked profile, the standalone notification
button is replaced by one responsive profile-actions menu containing
icon-labelled **Mute notifications** or **Unmute notifications**, followed by
**Block profile** with the same explanation used by the post action dialog.
Desktop uses an overflow menu; mobile browsers and the mobile app use the same
actions in a bottom sheet.

Blocking automatically unfollows that profile and prevents following it again
until it is unblocked. It does not remove the blocked profile as a follower of
the blocker or tell that profile who blocked it. Public profile metadata,
including Brain activity summaries and **Most Active In**, remains visible when
the blocker deliberately opens the profile. On that profile's Brain tab,
blocked activity keeps each post's normal height under a non-interactive blur.
A visible header retains the Wave identity and time with **Blocked · Reveal**.
Reveal removes the blur locally without changing the saved block, keeps the
card dimensions stable, and changes the action to **Blocked · Hide again**.
There is no per-row Unblock control. Mixed Wave feeds keep the standard blurred
blocked-post presentation.

## Blocking and direct messages

Blocking is a directional, privacy-preserving mute rather than a delivery
restriction. One-to-one direct messages remain available under the normal
direct-message admission policy, including conversations created after the
block. Messages continue to be delivered, so the blocked profile receives no
error or explicit indication that a block exists.

For the blocker, an existing or future one-to-one conversation is treated as
muted and deprioritized without changing its saved manual mute setting.
Messages from the blocked profile retain the standard blocked-post presentation
and can be revealed individually. They do not create ordinary notifications,
push notifications, or direct-message unread counts for the blocker.

Group direct messages and shared Waves remain usable and are not muted as a
whole. Only activity from the blocked profile is hidden and silent for the
blocker; activity from other members behaves normally.

## Global moderation

A high-confidence urgent report assessment may temporarily quarantine a post.
Other assessments remain in the occasional moderator queue without changing
the post's global visibility.

Authorized moderators can review open reports in **WatchTower** at
`/content-moderation`, which defaults to **Open reports**. All tabs share the
site's bordered page frame and consistent content padding:

- **Open reports**: `/content-moderation/open-reports`
- **Resolved reports**: `/content-moderation/resolved-reports`
- **Suspended profiles**: `/content-moderation/suspended-profiles`
- **Block activity**: `/content-moderation/block-activity`

Selecting a tab updates the URL without reloading the page. Direct links and
refresh open the selected tab, and browser Back and Forward restore previous
tab selections. Arrow keys, Home, and End move focus between tabs; Enter or
Space activates the focused tab. Unknown tab URLs show the not-found page.

Block activity is a newest-first,
continuously loaded trail showing who blocked or unblocked whom. Each compact
row aligns the two linked profiles, action, and date in consistent columns
across the full available content width inside the shared page frame.
**Blocked** has red text and a closed lock; **Unblocked** has green text and an
open lock. Full handles wrap when needed instead of being truncated, and the
date moves below on narrow screens. Block and unblock events appear in
the same feed, and an unblock does not remove the earlier block from history.
It records only actual relationship transitions;
blocking remains independent from reporting, AI assessment, content decisions,
and profile suspension. Each report identifies both the author
and the profile that submitted it, makes the content primary, shows a compact
AI summary with expandable detail, and keeps audit history available. A neutral
AI category is omitted; a substantive category is labelled **Potential
category** to make clear that it is not the moderator decision. For an open
report the moderator first selects one explained content decision, may add an
optional internal note, and then applies it once:

- **Allow** keeps or restores the post to visible and closes its reports;
- **Quarantine** hides it globally while its reports stay open; and
- **Remove** hides it globally and closes its reports as removed.

Author suspension is a separate, confirmation-backed action. **Suspend Profile**
prevents future creates and edits without changing existing posts. Suspended
profiles can be found and reinstated from the central Suspended profiles view,
without first locating a report. Moderators also see **Suspend Profile** or
**Reinstate Profile** in another profile's action menu. That global moderation
action remains independent of the moderator's personal Blocked state.

In primary Wave chat views, globally quarantined or moderator-removed posts
keep their author, time, and Wave context while only the post body is replaced
by a stable unavailable or **Content removed by moderators** message. Compact
secondary surfaces use a redacted tombstone. A removed reply or quoted-post
tombstone remains keyboard- and pointer-actionable: activating it loads the
original Wave context, scrolls to the post, and uses the existing target
highlight without revealing content the viewer may not access. Ordinary
viewers cannot Reveal globally moderated content. The author can still see the
original content of their own globally moderated post with **Removed by
moderators** or **This post is under review** and **Only you can see this
post**. Moderators inspect the preserved report snapshot in WatchTower rather
than through the ordinary Wave post. Authors do not see the reporter, report
reason, or pending report details.

The WatchTower link is shown only to profiles whose server-provided access
state allows it. A red indicator appears while the queue contains open reports;
the client refreshes this lightweight state periodically while active, without
a WebSocket. The backend checks every moderator request; hiding the link is not
the authorization boundary. A user who opens `/content-moderation` without
access, including through a direct tab link, sees the no-access countdown and
is redirected home. A failed access
request shows an error instead of incorrectly treating the user as
unauthorized.

## Common scenarios

### Hide without reporting

Open **Flag Content**, select only **Hide post**, and submit. The
post blurs immediately. Use Reveal for a temporary look or Unhide to remove the
saved preference.

### Block without reporting

Open **Flag Content**, select only **Block author**, and submit. Mounted
posts by that author blur immediately. Reveal affects one post temporarily;
Unblock restores the author's mounted posts and removes the saved block.

### Report and hide

Open **Flag Content**, select **Report post**, choose a reason, add optional
context, and submit with **Report and hide**. The report is sent and the post
blurs immediately. Blocking the author remains optional.

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
- A still-valid saved session remains usable without an active wallet
  connection or supported signing network. If the session expires,
  authenticated actions preserve the connected profile and selection, verify
  that signing is available before invalidating only that session, request a
  new signature, and continue after authentication. An unavailable signer or
  signing network leaves the session intact and does not start signing.
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
- Reporters see only their own report status and public outcome in Preferences.
  Open reports can be withdrawn; the full moderation record remains available
  only in WatchTower.

## Related pages

- [Waves](waves/README.md)
- [Wave participation](waves/flow-wave-participation.md)
- [Wave navigation and posting](waves/troubleshooting-wave-navigation-and-posting.md)
- [Profile preferences](notifications/feature-profile-preferences.md)
- [Backend feature specification](https://github.com/6529-Collections/6529seize-backend/blob/main/docs/content-moderation.md)
