# Desktop Core corpus maintenance

The frontend publishes `desktop.*` records through the existing help index.
The backend recognizes the `desktop-core` tag for local support. `facts` retain
source-backed detail, while `brief_answer` provides a concise default and fallback
(maximum 900 characters). Keep warnings beside any destructive action even in the
short answer. Separate definitions, onboarding, initial triage, and later recovery
stages. Use symptom language such as “my node does not match 6529.io”.

`answer_links` contains up to three named public 6529.io destinations, validated
against static application routes. The backend appends these once in a final `More info` footer;
keep links out of prose facts. The official installer destination is
`https://6529.io/about/6529-apps` in every environment. Native menu paths are
instructions, not public `/core` links. Omit answer links for a recovery step when
no relevant public destination exists. Provenance `source_refs` are not reply links.

`desktop-dialogue` records use their short answer directly for normal turns, so
model rephrasing cannot erase acknowledged progress. Normal answers give a few
sentences or the next diagnostic question. Detailed
walkthroughs require an explicit request. Recalculation and reconciliation follow-ups
acknowledge reported progress; they must not imply an unreported action succeeded.

## Evidence baseline

Verified against `6529-Collections/6529-core` main at `5d8a06e5ea66835f09ec89db40d4db714759462b`.
Each record includes immutable GitHub `source_refs` for the relevant controls and
worker behavior, plus a user-facing guide in `ops/docs/desktop/`.
These references are provenance; the bot consumes facts, not source files.

## Verified runtime values

Rechecked on 2026-09-15 against Desktop main at
`09fac1226109ad3eebdc61619076fdc2c83a9515`. The following definitions are
unchanged from the pinned evidence baseline:

| Corpus fact | Desktop source definition |
| --- | --- |
| TDH runs daily at 00:15 UTC | [`scheduler.ts`](https://github.com/6529-Collections/6529-core/blob/09fac1226109ad3eebdc61619076fdc2c83a9515/electron-src/scheduled-tasks/scheduler.ts) uses `15 0 * * *` for TDH; [`scheduled-worker.ts`](https://github.com/6529-Collections/6529-core/blob/09fac1226109ad3eebdc61619076fdc2c83a9515/electron-src/scheduled-tasks/scheduled-worker.ts) sets `Etc/UTC`. |
| Earliest transaction block is 13360860 | [`shared/types.ts`](https://github.com/6529-Collections/6529-core/blob/09fac1226109ad3eebdc61619076fdc2c83a9515/shared/types.ts) defines `TRANSACTIONS_START_BLOCK = 13360860`. |

The frontend validator checks corpus structure, routes, and publication parity;
it does not fetch another repository or detect future Desktop behavior changes.
Pinned references preserve the evidence used to author an answer, rather than
proving it remains current for every future Desktop release. The maintenance
contract below remains required whenever those native definitions change.

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


### Calculated reconciliation ranges

`desktop-calculated` records carry a validated `reconciliation_min_block` and
numeric placeholders in `brief_answer`: `percentage`, `minimum_block`,
`checkpoint`, and `from_block`. The runtime computes block ranges, never the LLM.
Keep the minimum aligned with `TRANSACTIONS_START_BLOCK` and the native Reconcile
dialog when reviewing Desktop source changes. The user supplies the local
Transactions checkpoint from the latest `Latest block in DB` log; never substitute
a current Ethereum head or a TDH snapshot. The supported progression is 25%, 50%,
75%, then 100%, with reconciliation and TDH recalculation between steps.

The final `Range: …` sentence is visible conversation context and must remain in
calculated replies. It preserves the selected interval and percentage across
short replies without private device access. Calculated templates are excluded
from ordinary retrieval; update the backend before publishing these records.

The 100% reconciliation failure advances to transaction-reset guidance. Preserve
the distinction between reconciliation, Reset to Block, NFT reset, and wallet
recovery. Reset instructions must explain local history deletion/reimport, RPC
and time cost, and waiting for resync before recalculating TDH.
