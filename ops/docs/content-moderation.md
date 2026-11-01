# Content moderation

## Overview

Content moderation gives users private control over what they see, provides a
clear way to flag posts, and gives authorized moderators a queue for
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
- Authorized **6529 Dev Team** group members can open **WatchTower** at `/content-moderation` from
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
review**, **Reviewed · No action taken**, **Reviewed · Content removed**, and
**Resolved · Post deleted**.
Only the reporter sees this personal report state. Internal moderator notes,
AI details, moderator identity, and other reporters are never exposed.

Clicking or tapping a post's reporter-only status control
opens a dedicated report-status view rather than reopening the action form. An
open report shows that it is awaiting review and offers **Withdraw report**.
Resolved reports show **Report reviewed** with **No action taken**, **Content
removed**, or **Post deleted** and no stale Report, Hide, or Block checkboxes.
A successful withdrawal closes the dialog and leaves the post hidden. Withdrawal is
auditable, does not affect other reporters, and does not become available again
after resolution. The same profile cannot report the unchanged post again
after a resolved outcome, while other profiles may still report it
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
Personal report history is scoped to the signed-in profile. Switching profiles,
signing out, or entering a proxy session clears the previous profile's cached
reports and cancels its outstanding report requests.

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
block already provides those states. Direct message remains available for an
existing conversation; starting a new one asks you to unblock first. Unblock
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

Blocking always wins over the blocker's direct-message setting for new
conversations. A blocked profile can never start a new direct message,
one-to-one or group, that includes the blocker, even under **Everyone** or when
the blocker follows them. It sees the same "doesn't accept new direct messages"
notice as the **Nobody** setting, so the block is never disclosed. The blocker
is asked to unblock a profile before starting a new conversation with it.

Existing conversations stay available. Blocking is a directional,
privacy-preserving mute for them: messages continue to be delivered, so the
blocked profile receives no error or explicit indication that a block exists.

For the blocker, an existing one-to-one conversation is treated as
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

Members of the **6529 Dev Team** group can review open reports in **WatchTower** at
`/content-moderation`, which defaults to **Needs review**. All tabs share the
site's bordered page frame and consistent content padding:

- **Needs review**: `/content-moderation/needs-review` (older `/content-moderation/open-reports` links also open this queue)
- **Checks**: `/content-moderation/checks`
- **Resolved reports**: `/content-moderation/resolved-reports`
- **Encrypted reports**: `/content-moderation/encrypted-reports`
- **Suspended profiles**: `/content-moderation/suspended-profiles`
- **Block activity**: `/content-moderation/block-activity`

Selecting a tab updates the URL without reloading the page. Direct links and
refresh open the selected tab, and browser Back and Forward restore previous
tab selections. Arrow keys, Home, and End move focus between tabs; Enter or
Space activates the focused tab. Unknown tab URLs show the not-found page.
On narrow screens, a labelled selector switches between the same views.

**Needs review** contains one row per case requiring manual attention. Reports
and check revisions about the same post share a row, including multiple user
reports. A standalone check awaiting human review also creates a case. Automated
evaluations still running are excluded until they finish or enter failure
recovery. Rejected new-post
submissions without a published post remain separate cases; public fields group
by their subject across revisions. Each row identifies User report, Automated
check, or both, shows its outstanding requirements, report reason or
**Automated outcome**, and links directly to **Review case**. An automated
Allowed or Rejected outcome records the evaluator's assessment; it does not
mean the post still exists or that manual review is complete.

**Review case** opens a review workspace with the complete Needs review case
list on the left and the selected case on the right on desktop. The selected
row has a visible highlight and **Selected** label. Select another case on the
left to switch details without returning to the queue. Opening a case does not
restrict the left list to that case. The right side keeps **User reports for
this case**, reporter notes, direct report review links and any remaining check
revisions scoped to the selected case. Report and check lists have their own
pagination. A report-only case stays in the left list after its check is marked
reviewed, until the report is resolved. On desktop, use the visible left list
to switch cases. On mobile, the selected detail occupies the view and **Back to
list** returns to the Needs review queue. Check-history details also keep this
back action on mobile; desktop details do not show a redundant back button.

The compact filter bar has one **Needs review only** toggle and **Filter
checks**. The toggle applies immediately: on selects review status Needs review,
and off removes that status restriction. Other applied filters remain in place.
With no other filters, Needs review shows the complete unique-case queue; other
filter combinations browse individual check history, whose rows are not the
unique-case attention count.

**Filter checks** opens or closes the advanced controls only when selected.
Changing a field prepares an edit and shows **Unapplied changes**; the list and
toggle update when you choose **Apply filters**. Only the applied review status
controls the toggle. Changing the quick toggle keeps other unfinished edits
pending, updates the review-status field, and preserves whether the panel is
open or closed. Collapsing the panel preserves edits. **Clear filters** removes
both applied filters and unfinished edits without closing the panel.

The Needs review badge and Items needing review summary show the same unique
case count, which also controls the sidebar attention dot. The dot appears for
any manual review case, including check-only cases with no user reports. It
refreshes every minute while the app is active and after your moderation
actions. Opening WatchTower does not clear it. A case remains until all of its
open reports and pending checks are handled; Mark reviewed alone does not close
reports. The dot disappears when no cases remain. This is an in-app indicator.

The case list has cursor pagination. A failed load shows Retry and preserves
already loaded cases. An empty message appears only after a successful empty
response. **Checks** retains the full check history and **Resolved reports**
retains closed reports.

The summary shows items needing review, quarantined posts, rejected checks
today, and evaluator failures today. These totals cover all items independently
of filters; today uses UTC.

**Checks** covers REP categories, About text, group names, and posts. Filter by
content type, outcome, policy, trigger, review status, UTC date range, or an
exact profile or subject ID. Filtered views and selected checks have direct
links. For REP categories, use the opaque **Subject ID** shown in the check's
**Context** section; category text is never used as a URL filter.
**Public-facing text** is the stricter policy for REP, About, and group
names; **Wave safety** is the permissive policy for posts and reports.

Select **Review check** to open saved evidence, scope and current state,
evaluation history, decision history, and review actions. Desktop shows the
detail next to the list; mobile shows a full detail view with a section
selector and **Back to checks**. Saved evidence is inert text. External
references are collapsed and require an explicit click; opening them can
reveal your IP address to the host. A media URL in an evaluation does not imply
that the evaluator inspected the media itself.

The action panel offers only actions valid for that item and requires a reason:

- A REP category can be allowed or blocked for future exact category use,
  re-evaluated, or have its override revoked. Existing ratings do not change.
- Rejected About text, group names, and posts can receive **Approve exact
  resubmission**. This creates a single-use permit valid for seven days for
  the same author, content, and context. It publishes nothing from WatchTower;
  the author must submit again. Posting permissions and other safety checks
  still apply.
- A current About field or group name can be suppressed or restored for the
  reviewed revision. This changes presentation without overwriting the
  author's stored text.
- Published posts support visibility decisions and author posting controls.
- Deleted reported posts show a red **Deleted** pill on the queue card, the
  review workspace's left-hand case row and the detail panel, with **Resolve
  reports — post deleted** while open reports remain. Enter a reason and confirm
  to close
  all open reports for that post and move them to Resolved reports with the
  **Post deleted** outcome. The open-report count and navigation indicator
  refresh after saving. Saved evidence, reporter history, and decision history
  remain available. Resolution does not restore the post or change author
  posting access.
- **Re-evaluate** records a new evaluator result without undoing an explicit
  human decision. **Mark reviewed** adds a reason to the decision history;
  it does not resolve open reports for the post.

An item that changed during review requires **Load latest version** before
another decision. A failed request can be retried safely with the same
decision key. Expired evidence is labelled, its decision history remains
available, and actions that require missing evidence are unavailable.

Encrypted reports lists reports of severe or illegal harm from end-to-end
encrypted chats, newest first, with **Load more** for older ones. Each row
shows the category, when it was reported, whether the sender was verified, and
**On hold** or the date it is deleted (180 days after the report unless held).
The list shows no message content. **Review evidence** opens one report:

- The one message the reporter chose to share, as they decrypted it, shown as
  plain text with the names of any attachments (attachment contents are not
  part of a report). A notice states that this is not the chat: 6529 can't
  read anything else in the conversation, and the other people in it can't
  see the report.
- **Signature verified** when the sender's device signed this exact message
  and the sender was in the chat, otherwise **Signature not verified**, to be
  treated as unconfirmed.
- The category, report time, sender and reporter profile ids, the reporter's
  note and the retention date.
- **Place on hold** keeps the report past its retention until **Release hold**.

Every list, opened report and hold change is recorded in an access log on the
server. **Back to encrypted reports** returns to the list without reloading
it.

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
category** to make clear that it is not the moderator decision. Select
**Review evidence and decide** to open the report's saved revision in Checks,
review the applicable effect, select a decision, enter a reason, and confirm.
Live-post cards and published-post check details provide a separate **Open
original post** link to that exact post in its saved Wave context. This link
is independent of links inside saved content. Deleted posts hide that action.
Where evidence remains available, the detail explains **Original post deleted.
Saved evidence retained.** Expired or unavailable evidence is not described as
retained. If a live post's saved Wave or post ID is missing or invalid, a clear
link-unavailable message replaces the link.

Saved-text previews include a post's retained title and textual parts, including
titleless posts, rather than claiming there is no preview when saved post text
is available. The preview is a short extract; the evidence section retains the
saved input. Expired evidence remains unavailable.

For live posts:

- **Allow** keeps or restores the post to visible and closes its reports;
- **Quarantine** hides it globally while its reports stay open; and
- **Remove** hides it globally and closes its reports as removed.

Author suspension is a separate, confirmation-backed action. **Suspend Profile**
prevents future creates and edits without changing existing posts. Suspended
profiles can be found in the central Suspended profiles view and opened in
Checks for review and reinstatement without first locating a report. Moderators
also see **Suspend Profile** or **Reinstate Profile** in another profile's action
menu; these open the same review page. That global moderation
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

The WatchTower link is shown only when the server confirms that the signed-in
profile belongs to the **6529 Dev Team** group. Sign in with a wallet linked to
that profile and use a direct profile session; proxy sessions cannot use
WatchTower. A red indicator appears while any case needs manual review;
the client refreshes this lightweight state periodically while active, without
a WebSocket. The backend checks every moderator request; hiding the link is not
the authorization boundary. A user who opens `/content-moderation` without
access, including through a direct tab link, sees the group and sign-in
requirements. The page stays open so the user can switch profiles, leave proxy
mode, or choose **Go home**. If the permission check fails, **Couldn't check your
WatchTower access. Try again.** appears with **Retry permission check**. Private
review data stays hidden during the failure and retry until the server confirms
access. A failed check does not mean that the profile lacks membership.
Switching identity, entering proxy mode, signing out, or losing server access
clears private review data. Private evidence is excluded from session replay.
Private review data and personal Reports stay hidden until the current sign-in
token identifies a direct profile session, including while proxy details load.

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

## Moderation localization follow-up

The private `/content-moderation/checks` surface and WatchTower access and
recovery messages currently use the `en-US` source in `en-GB`, `fr-FR`, `es-ES`
and `de-DE`. Dates and numbers still follow the selected locale. Frontend
maintainers own the follow-up: translate these messages and verify expanded
labels on mobile before declaring those locale dictionaries complete. Provider,
model, policy-version and unknown
future audit identifiers remain exact server values for diagnosis; known review
actions and operations have translated message keys.

## Related pages

- [Waves](waves/README.md)
- [Wave participation](waves/flow-wave-participation.md)
- [Wave navigation and posting](waves/troubleshooting-wave-navigation-and-posting.md)
- [Profile preferences](notifications/feature-profile-preferences.md)
- [Backend feature specification](https://github.com/6529-Collections/6529seize-backend/blob/main/docs/content-moderation.md)
