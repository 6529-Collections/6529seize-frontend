# Profile Brain Tab Wave Sidebar

## Overview

The `Brain` tab shows two profile-specific wave lists:

- `Created Waves`: accessible waves and subwaves created by the profile
- `Recently Active In`: accessible waves and subwaves where the profile posted
  most recently, whether or not the profile created them

The same wave can appear in both lists. Direct-message waves are excluded.

## Location in the Site

- Route: `/{user}/brain`
- Desktop: right column beside the Brain feed
- Small screens: horizontal strip above the Brain feed

## Entry Points

- Open `/{user}/brain`.
- On small screens, select `More` beside the first created wave to open the
  created-waves modal.

## User Journey

1. Open `/{user}/brain`.
2. `Created Waves` and `Recently Active In` load independently.
3. If no accessible created waves are found, the `Created Waves` section is
   omitted. Otherwise, desktop initially shows up to five created waves. Select
   `Show more` to reveal every loaded created wave; select `Load more` to
   request the next page when one is available. `Show less` restores the
   compact view.
4. Desktop shows the first page of recent activity. Select `Load more` to
   append the next page.
5. On desktop, scroll anywhere inside the right sidebar to move through both
   lists without moving the Brain feed. The sidebar remains one scroll area.
   Keyboard users can focus the region and use navigation keys to scroll it;
   focused controls remain visible after content updates.
6. Small screens show the first created-wave pill and recent-activity pills in
   a horizontally scrollable strip.
7. If more created results are loaded or another created page is available,
   select `More` to open the created-waves modal. The modal uses the same
   ordering and supports `Load more` until every created result is reachable.
8. Select a wave row or pill to open `/waves/{waveId}`.

When the final cursor page finishes loading from a focused `Load more` control,
focus moves to the visible `All waves loaded.` status instead of falling back to
the document.

## Common Scenarios

- Each row shows the wave picture when available and a wave icon fallback
  otherwise. Long names truncate, and private waves show a lock.
- Both sections are ordered by the viewed profile's latest qualifying post in
  each wave. A qualifying post includes the wave description, replies, and
  supported wave-drop types authored by that profile.
- Rows label that profile-specific value as `Last post`. Created waves with no
  qualifying authored post show `No posts by this profile` after waves with
  activity.
- The secondary count is labeled `total wave posts`. It is the retained CHAT
  post count across all authors in the wave, not the viewed profile's count.
- The modal says how many waves are currently loaded while another cursor page
  is available. It does not present a partial page count as the total.
- The modal title uses the profile handle when available, or a shortened wallet
  address otherwise.

## Edge Cases

- Each list has its own loading and error state. A successfully empty
  `Created Waves` result omits that section on desktop and small screens;
  `Recently Active In` keeps its own empty message. One failed or empty list
  does not hide a successful list.
- Created and recent lists intentionally allow overlap.
- Results include accessible root waves and subwaves, including private waves
  the current viewer may access. Inaccessible and direct-message waves are
  omitted.
- Changing the authenticated viewer recalculates both lists so private-wave
  visibility from the preceding viewer is not reused.
- The compact created view remains limited to five visible rows, but cursor
  pagination keeps all results reachable.
- On desktop, the sidebar becomes independently scrollable only when its
  content is taller than the available viewport. Short, loading, empty, and
  error states keep their natural height.

## Failure and Recovery

- If an initial section request fails, that section shows an inline retry
  control while the other section remains usable.
- If a later page fails, already loaded rows remain visible and `Retry loading
  more` retries that cursor page.
- If the profile route itself cannot be resolved, users see the shared
  not-found screen:
  [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)

## Limitations / Notes

- Initial pages request up to 20 created waves and 5 recent waves.
- Each section makes one profile-activity request per cursor page. Rows do not
  make per-wave activity requests.
- The full modal lists created waves only; recently active waves remain in the
  sidebar or mobile strip.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile Brain Tab](feature-brain-tab.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Waves Index](../../waves/README.md)
