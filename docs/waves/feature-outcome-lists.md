# Wave Outcome Lists

## Overview

Waves with an `Outcome` tab show one card per outcome type (Manual, Rep, NIC) and
load winner rows as needed.
The same outcomes are also surfaced in leaderboard rows as an `Outcome:` chip for
eligible drops.
The list supports progressive loading so users only fetch additional rows when they
ask for them.

## Location in the Site

- Wave detail and context pages with tabs, including `/waves/{waveId}`.
- Direct-message wave context routes like `/messages?wave={waveId}` when applicable.
- Mobile wave surfaces that expose the `Outcome` tab.
- Leaderboard lists and cards that include ranked drops, including top-three and
  standard rows in small/compact leaderboard views.

## Entry Points

- Open a wave that has outcomes available.
- Select the `Outcome` tab.
- Expand an outcome card.
- Click `View more` when it appears.

## User Journey

1. Open a wave and go to `Outcome`.
2. The outcome panel fetches and renders cards for each available outcome type.
3. While outcome rows are loading, cards show a loading placeholder for winner count and a loading row message.
4. Expand a card to view the first set of winner rows (up to three).
5. If more rows exist, use `View X more`:
   - The first click expands the currently loaded rows.
   - If more pages remain on the server, the card fetches the next page while showing `Loading...`.
6. If an outcome has no winners, the card shows `No winners yet`.
7. In leaderboard surfaces, each ranked drop requests outcome rewards for that
   row-level rank in the background.
8. If outcome rewards are not ready when the row first renders, the footer shows a
   small loading placeholder where the chip will appear.
9. Once rewards are resolved, an `Outcome:` button appears with relevant NIC, Rep,
   or manual reward icons.
10. Expanded rows render a winner card preview with the drop title and a media
   format badge when media metadata is present.

## Common Scenarios

- Initial outcomes load shows `Loading outcomes...` in the outcome tab when the wave-level list has not resolved yet.
- With no outcomes available in the wave, users see `No outcomes to show.`
- Manual outcome rows use `-` for empty or missing descriptions.
- Rep and NIC outcome totals remain visible while winners are fetched.
- If a page has more rows than fit the initial summary view, `View X more` appears and loads additional winners progressively.
- Leaderboard rows with rewards for the current rank show an `Outcome:` button that
  opens a tooltip listing NIC totals, Rep totals, and awarded manual outcomes.
- If a row has no reward entries for its rank, the outcome chip is omitted.
- Winner rows surface a small media-type indicator and thumbnail where the winner
  submission includes a preview image or supported non-image media.

## Edge Cases

- If a fetch for an outcome fails, users see a red inline error message inside that card.
- If a winner row fetch is still in progress while expanded, loading rows remain visible and do not block the whole page.
- For long waves, additional outcome cards load as you scroll in the Outcome tab.
- If the server returns an explicit error message, that text is shown in the card-level error state.
- If outcome reward lookup for a leaderboard row is delayed, only the loading
  placeholder is shown and the row remains clickable.
- If a winner submission has no preview image metadata, the row still renders with
  textual metadata and opens normally.

## Failure and Recovery

- If outcome loading fails before any outcomes are shown, users see the request error text and can retry by revisiting the `Outcome` tab or reloading the wave.
- If an outcome distribution fetch fails after a card is opened, users can retry by reopening the card and clicking `View more` again once network conditions recover.
- If no rows are available yet for a specific outcome, users see `No winners yet` rather than an empty space.
- If leaderboard reward lookup returns no matching rewards for a rank (or temporarily
  cannot be resolved), the outcome chip does not render; refreshing the view can
  re-trigger lookup.

## Limitations / Notes

- Outcome lists do not currently support custom sorting or filtering.
- `View more` is the only pagination control; there is no page-number input for outcomes.
- The count shown in the `View more` button reflects remaining rows from the server-reported total.
- Outcome chips in leaderboard rows are reward summaries only; if a rank has no
  rewards, no chip is shown and there is no alternate empty-state message.

## Related Pages

- [Wave Content Tabs](discovery/feature-content-tabs.md)
- [Top Voters Lists](leaderboard/feature-top-voters-lists.md)
- [Wave Chat Scroll Behavior](chat/feature-scroll-behavior.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Waves Index](README.md)
- [Docs Home](../README.md)
