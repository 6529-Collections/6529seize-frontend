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
- A followed subwave should remain reachable through its parent container. If a followed subwave cannot be reached from the current root-wave source, the backend or a future frontend fallback should provide the parent container explicitly.

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

## Unread And Activity

- Root waves and subwaves carry independent unread counts.
- Collapsed parent rows may show a hidden-subwave unread indicator when loaded child rows have unread drops.
- Subwaves are sorted by latest activity within an expanded parent.
- Pinned and following root sections are activity-first; discovery sections are quality-first.

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
