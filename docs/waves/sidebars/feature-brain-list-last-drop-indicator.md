# Brain Wave List Last Drop Indicator

## Overview
The Brain and direct-message wave lists show a `Last drop:` label below each
wave name so users can quickly see when the latest content arrived. The label
uses the freshest timestamp known to the client from server snapshots and live
events, so it does not roll back to an older time after newer activity appears.

## Location in the Site
- Desktop Brain sidebar from the `Brain` tab on `/` and `/{user}`
- Brain and DM wave lists in layouts that reuse the same sidebar list

## Entry Points
- Open the Brain sidebar from the main navigation
- Open a profile or home route that renders the Brain sidebar
- Switch between pinned and DM wave lists in the Brain sidebar

## User Journey
1. The sidebar loads wave metadata and renders `Last drop: ... ago` for entries
   with timestamps.
2. When a new drop or refresh updates a wave timestamp, the label recalculates
   immediately to the newest value and keeps counting elapsed time.
3. As users move between views, each wave row keeps showing the latest known
   drop time for quick triage before opening the wave.

## Common Scenarios
- A new drop arrives while Brain is open: unread badges increase and `Last
  drop` updates immediately.
- Wave data refreshes with a newer timestamp while the row is already visible: the
  `Last drop` value updates right away, then continues to advance each minute.
- A pinned wave updates from another participant: the list entry shows the newer
  time without waiting for a full reload.
- DM waves receive new messages: DM list entries follow the same `Last drop`
  update behavior as other Brain wave entries.

## Edge Cases
- A live event arrives after a server snapshot: the label keeps the newer value
  and never regresses to an older timestamp.
- Server data has no timestamp but a live event has one: the label still appears
  from the live event value.
- Repeated renders with unchanged timestamps refresh elapsed time once per minute so
  users see the wording evolve (`5m ago`, `6m ago`) without leaving the page.
- Server refresh and live updates overlap: the label reflects whichever timestamp
  is newest.

## Failure and Recovery
- No timestamp is available from either source: the `Last drop` line is hidden
  until a timestamp becomes available.
- Live connection drops temporarily: the last known timestamp remains visible and
  resumes updating after reconnection.
- Server fetch fails: the previous value remains visible; a later successful
  refresh rehydrates current timestamps.

## Limitations / Notes
- If both server and live-event timestamps are missing, users only see activity
  indicators such as unread counts, not a `Last drop` time.
- The timestamp reflects the client-visible newest event and may differ slightly
  from server clock display in other surfaces.
- This page only describes Brain/DM sidebar list behavior.

## Related Pages
- [Waves Index](../README.md)
- [Brain Wave List Name Tooltips](feature-brain-list-name-tooltips.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Wave Drop Media Download](../drop-actions/feature-media-download.md)
- [Profiles Index](../../profiles/README.md)
