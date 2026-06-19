# Wave and Subwave Interaction Model

This note records the frontend contract for root waves and subwaves. The goal is to keep known-wave workflows activity-first while avoiding accidental cascades between a parent wave and its children.

## Core Rules

- A root wave is the navigation container for its subwaves in the left sidebar.
- A subwave is its own destination for joins, mutes, Wave REP, score, unread state, drops, votes, boosts, and reactions.
- Parent state does not silently cascade to subwaves unless the backend explicitly returns that state for each subwave.
- Subwave state does not silently promote to the parent, except that the parent row can show aggregate hints such as hidden unread subwave activity.

## Following

- Joining a root wave joins only that root wave.
- Joining a subwave joins only that subwave.
- Leaving a root wave must not leave joined subwaves.
- Leaving a subwave must not leave the root wave.
- A followed subwave should remain reachable through its parent container. If a
  followed subwave cannot be reached from the current root-wave source, the
  backend or a future frontend fallback should provide the parent container
  explicitly.
- Showing a parent row as the container for a followed subwave must not imply
  the parent itself is joined. The parent row should keep the parent join state,
  mute state, pin state, picture, REP, and score returned for the parent.

## Pinning

- Pinning is root-wave scoped in the current UI.
- Subwave rows do not render pin controls.
- A pinned root wave can be expanded to access its subwaves.
- If true subwave pinning is added later, it should be implemented as a first-class API and cache contract rather than a local-only shortcut.

## Muting

- Muting applies to the exact wave id acted on.
- Muting a root wave should not be displayed as muting every subwave unless each subwave is returned as muted.
- Muting a subwave should suppress that subwave's unread and notification presentation without hiding the parent container.

## Drops, Reactions, Votes, And Boosts

- Drop actions are drop-scoped and therefore belong to the wave or subwave that owns the drop.
- A reaction, vote, or boost on a subwave drop should update that drop and refresh relevant wave caches, but it should not create a synthetic parent reaction or vote.
- New drop activity in a subwave can make the collapsed parent show hidden subwave activity.
- A subwave post must not be copied into the parent wave stream. If users open
  the parent wave, they should see parent-owned drops; if they open the subwave,
  they should see subwave-owned drops.
- "Bubble up" means sidebar/discovery/navigation metadata only: for example,
  the parent container can be shown, marked with hidden subwave activity, or
  sorted by an aggregate latest-child-activity value when the API provides one.
  It does not mean duplicating the post, votes, boosts, reactions, unread count,
  or REP onto the parent wave.

## Post Activity Bubbling

Subwave posts should affect surfaces according to the viewer's relationship to
the parent and child:

| Viewer state | Parent row | Subwave row | Post/feed behavior |
| --- | --- | --- | --- |
| Follows parent only | Parent stays visible from parent follow. | Child appears only when the parent is expanded or otherwise loaded. | Subwave posts do not enter the parent feed or create parent-scoped actions. |
| Follows subwave only | Parent can appear as a container so the followed subwave is reachable. | Child should show the subwave's own unread/activity state once loaded. | Subwave posts belong to the subwave feed; parent state remains parent-specific. |
| Follows both | Parent can sort by parent or aggregate activity, depending on backend data. | Child shows its own unread/activity state. | Parent and child feeds remain separate. |
| Follows neither | Parent/subwave discovery is score/quality-driven. | Child appears only through parent expansion/discovery. | No followed-wave unread or notification state is implied. |

If the backend wants followed-subwave activity to move a parent container upward
in the activity-first sections, it should return an explicit aggregate activity
field or include the parent container in the followed/activity source. The
frontend should not infer parent activity by locally copying child drop state.

## Backend/API Contract For Followed Subwaves

The left sidebar can make a followed subwave move with its parent only when the
API returns enough parent-container metadata to do so.

- When a viewer follows a subwave, the followed/activity API should return the
  parent root wave as a container row even if the viewer does not follow the
  parent itself.
- That parent container should include the parent wave's own state:
  subscribed/joined, muted, pinned, picture, contributors, REP, score, direct
  message flag, and root-wave identifiers must remain parent-scoped.
- To let a subwave post move the parent container upward, the API should expose
  an explicit aggregate activity signal for the parent container, such as
  `latest_subwave_drop_timestamp`, `latest_child_activity_timestamp`, or a
  documented equivalent.
- That aggregate activity signal should be used only for container ordering and
  hidden-activity hints. It must not overwrite the parent wave's own latest drop
  timestamp unless the field name and contract explicitly say it is an
  aggregate.
- The API should expose enough child metadata for the followed subwave row to
  render after expansion: subwave id, parent id, followed state, muted state,
  unread counts, latest drop timestamp, picture/contributors, REP, and score.
- If a followed subwave has unread drops while the parent is collapsed, the API
  should either expose an aggregate hidden-subwave unread count/hint on the
  parent container or return the followed child early enough for the frontend to
  compute the hint after expansion.
- The frontend should sort activity-first parent containers using the explicit
  aggregate field when present. Without that field, it should preserve the
  backend order and should not locally promote the parent based on child posts.
- The frontend should never duplicate subwave drops into the parent feed to
  simulate bubbling.

## Unread And Activity

- Root waves and subwaves carry independent unread counts.
- Collapsed parent rows may show a hidden-subwave unread indicator when loaded child rows have unread drops.
- Subwaves are sorted by latest activity within an expanded parent.
- Pinned and following root sections are activity-first; discovery sections are quality-first.
- If a parent row is present only because a followed subwave needs a container,
  its section placement should be treated as container placement, not as proof
  that the parent is followed.

## Pictures, Avatars, And PFP Fallbacks

- Root waves and subwaves use the picture, contributor collage, and fallback
  rules returned for that exact wave id.
- A subwave with its own picture should show that picture in rows, headers, and
  detail surfaces.
- A subwave without a picture should use its own contributor/fallback data. It
  should not silently inherit the parent picture/PFP unless the API later
  returns an explicit inherited or composed picture contract.
- Parent rows should not adopt a child subwave picture because a child has new
  activity. The parent picture remains the parent picture.
- If we later want stronger visual family cues, add a first-class design such
  as parent-picture-with-subwave-badge or an explicit parent picture field on
  subwave responses.

## Sidebar Expansion

- The expand control is shown only on root rows with subwaves.
- The control points right when child rows are not visible.
- The control shows a loading state while child rows are being fetched.
- The control points down only when child rows are visible.
- Active subwaves request their parent children so the parent can open once the rows are available.
- Collapsed icon-only sidebar mode hides child rows and preserves the expanded state for the full sidebar.

## Mobile

- Mobile uses the subwave bar as the quick switcher between the parent and sibling subwaves.
- The current subwave should appear even when the sibling list is still loading.
- Full wave/subwave stats and REP controls belong in wave details, not in a crowded top header.
