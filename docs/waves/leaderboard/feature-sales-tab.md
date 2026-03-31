# Wave Sales Tab

## Overview

`Sales` shows marketplace preview cards for winning curation submissions that
expose sale links. The tab is available only in curation-wave thread surfaces
and lets users review recent sale links without opening each winner from
`Leaderboard` or `Winners` first.

## Location in the Site

- Curation wave thread routes: `/waves/{waveId}`
- Curation-wave direct-message routes: `/messages?wave={waveId}`
- Desktop and mobile wave tab rows when `Sales` is available

## Entry Points

- Open a curation wave.
- Select `Sales` from the wave tab row.
- Scroll through cards and open the marketplace link you want.

## User Journey

1. Open a curation wave and switch to `Sales`.
2. While decision data is loading, the tab shows `Loading sales...`.
3. When links are available, the tab shows a compact card grid:
   - newest decision rounds first
   - winners inside each round in place order
   - one card per winner when that drop has at least one non-empty NFT link
4. Select a card to open the marketplace destination behind that preview.
5. Scroll to the bottom to load older decision rounds automatically.
6. Keep browsing loaded cards while older rounds continue loading.

## Common Scenarios

- Review recent winning submissions through marketplace cards instead of winner
  rows.
- Open supported marketplace cards with preview media, price, and title when
  that metadata resolves successfully.
- Keep using loaded cards while the tab fetches older rounds and shows a bottom
  loading bar.
- See the same marketplace URL more than once when multiple winning drops point
  to that same destination.

## Edge Cases

- Winners without a usable NFT link are skipped.
- If loaded rounds have no usable sale links but older rounds still exist, the
  tab can remain visually empty while paging continues.
- If no usable sale links are found after paging is exhausted, the tab shows
  `No sales yet.`
- `Sales` is removed immediately when the current wave is no longer recognized
  as a curation wave.

## Failure and Recovery

- If decision loading fails, the tab shows `Failed to load sales` and appends
  the returned error text when available.
- Refresh the current wave route and reopen `Sales`.
- If a preview cannot resolve marketplace metadata, the card falls back to a
  `Preview unavailable` state; open the underlying link directly from that card.

## Limitations / Notes

- `Sales` is populated from winning decision data, not from every submission in
  the leaderboard.
- Only the first non-empty NFT link on each winning drop is used to build a
  sales card.
- Tab selection is UI state and is not encoded in a URL tab parameter.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Wave Content Tabs](../chat/feature-content-tabs.md)
- [Wave Winners Tab](feature-winners-tab.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../../README.md)
