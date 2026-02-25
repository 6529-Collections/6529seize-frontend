# Wave Drop ENS Link Previews

## Overview

Wave drop markdown renders ENS targets as dedicated ENS cards instead of the
generic metadata preview card. Depending on the target, users see either an
`ENS Name` card or an `ENS Reverse Record` card with available ENS profile and
ownership details.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer

## Entry Points

- Open a drop that contains an ENS target such as:
  - a `.eth` name
  - a `.addr.reverse` name
  - an Ethereum address (`0x...`)
  - an ENS app URL (`app.ens.domains/...`)
  - an Etherscan address URL (`etherscan.io/address/...`)
- Paste one of those targets into drop markdown and view the published drop.
- Re-enable link previews for a drop if previews were hidden.

## User Journey

1. Open a thread with a drop containing an ENS target.
2. The drop renders an ENS preview frame with loading placeholders.
3. The card resolves into a name-style or address-style ENS card.
4. Review available details such as name/address mapping, profile records,
   ownership signals, and external links.
5. Use adjacent drop link actions to copy/open the target without leaving the
   thread unless desired.

## Common Scenarios

- ENS name targets show a name card with available avatar, resolved address,
  text records (for example website, email, Twitter, Telegram, GitHub,
  description), and ownership rows.
- ENS names entered in mixed-case, Unicode, or punycode forms are normalized
  before resolution; when the readable display name differs from the canonical
  normalized label, both can appear in the card header.
- Address targets show a reverse-record card with the primary name (if set) and
  a visible forward-resolution verification status.
- If a name includes ENS contenthash data, users see protocol details and an
  `Open content` action when a gateway URL is available.
- Repeated previews of the same target typically resolve faster due to short-lived
  preview caching.

## Edge Cases

- ENS targets with sparse records still render a minimal card with whichever
  fields are available.
- Targets that do not match supported ENS patterns use non-ENS link handling.
- Invalid or non-resolvable ENS values can fall back to a plain clickable link
  instead of a dedicated ENS card.
- If link previews are hidden for a drop, ENS targets remain plain links until
  previews are shown again.

## Failure and Recovery

- While ENS data is loading, users see a skeleton card.
- If ENS resolution fails or validation rejects the target, rendering falls back
  to a standard link so users can still open the original destination.
- Adjacent open/copy actions remain available even when rich ENS content is not.
- Users can retry by reopening the thread or reloading the page.

## Limitations / Notes

- ENS cards only activate for supported ENS/address target formats.
- Data quality depends on public ENS records and upstream resolver/network
  responses.
- ENS preview data is sourced from Ethereum mainnet ENS records.
- ENS cards are informational; they do not allow editing ENS records from the
  drop UI.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Pepe.wtf Link Previews](feature-pepe-link-previews.md)
- [Wave Drop Twitter/X Link Previews](feature-twitter-link-previews.md)
- [Wave Drop YouTube Link Previews](feature-youtube-link-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
