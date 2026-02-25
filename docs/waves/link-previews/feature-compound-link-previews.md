# Wave Drop Compound Link Previews

## Overview

Wave drop markdown renders supported Compound links as dedicated Compound cards
instead of generic metadata previews. Cards can represent market, account, or
transaction targets.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer

## Entry Points

- Open or publish a drop containing a supported Compound-family URL:
  - `https://app.compound.finance/markets/{...}`
  - `https://app.compound.finance/account?address=0x...`
  - `https://etherscan.io/address/0x...` (recognized Compound markets)
  - `https://etherscan.io/tx/0x...` (recognized transaction hash format)
- Re-enable previews when previews are hidden for the drop.

## User Journey

1. Open a thread with a supported Compound link.
2. The link renders a Compound loading preview state.
3. The card resolves into market, account, or transaction view.
4. Review rates/position/summary details and use external actions (Compound or
   Etherscan) when available.

## Common Scenarios

- Market cards show v2 or v3 metrics (for example APY, utilization, TVL, and
  collateral context).
- Account cards show visible positions, risk signals, and rewards context.
- Transaction cards show status and decoded summary fields when available.

## Edge Cases

- Only recognized Compound market/account/transaction URL patterns render
  dedicated cards.
- Unsupported Compound-family paths fall back to generic or plain-link handling.
- If previews are hidden for a drop, Compound links stay plain until previews
  are shown again.

## Failure and Recovery

- If Compound data cannot be loaded or parsed, rendering falls back to generic
  preview or plain-link behavior so the link remains usable.
- Users can retry by reloading the thread.

## Limitations / Notes

- Displayed values are informational snapshots and can drift from live market
  state.
- Dedicated cards rely on recognized URLs and publicly reachable data.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop NFT Marketplace Link Previews](feature-nft-marketplace-link-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
