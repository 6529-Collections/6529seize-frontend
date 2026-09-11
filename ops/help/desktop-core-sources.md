# Desktop Core corpus maintenance

The frontend publishes `desktop.*` records through the existing help index.
The backend recognizes the `desktop-core` tag for bounded detailed answers.
Core controls are explained by their native menu labels, never linked as public
`/core` routes. `canonical_path` remains the real Apps route; source links are
suppressed for these procedural answers.

## Evidence baseline

Verified against `6529-Collections/6529-core` main at `5d8a06e5ea66835f09ec89db40d4db714759462b`.
Each record includes immutable GitHub `source_refs` for the relevant controls and
worker behavior, plus a user-facing guide in `ops/docs/desktop/`.
These references are provenance; the bot consumes facts, not source files.

## Maintenance contract

When Core changes RPC setup, worker schedules/actions, TDH recovery, wallet
handling, IPFS, or menu labels, update the relevant records and guides from
Core source in the same release set. Recheck action effects, busy states, and
restart behavior; distinguish local data from on-chain state and current
behavior from future consensus phases. Refresh the pinned references after
verification. Do not claim arbitrary installed versions expose every control.

Run both `help-index:sync` and `agent-files:sync`, then the agent-file sync tests.
Exercise representative onboarding, RPC, TDH mismatch, reconciliation, reset,
NFT recovery, wallet, IPFS, and contextual follow-up queries against the backend
retriever. Generic website TDH, external wallets, mobile, and ordinary desktop
web layout questions must retain their existing destinations. The backend
Desktop fixture is a test-only corpus snapshot, not a runtime knowledge source.

## Rollout

Deploy the companion backend `helpBotReplyLoop` routing/renderer change first,
then publish this frontend corpus. The new backend fails closed for unavailable
Core procedures. An older backend can misroute these new records into generic
wallet answers or truncate recovery explanations; avoid frontend-first rollout.
