# Encrypted DM history performance validation

## Reproduction

Run `E2EE_PERFORMANCE_BENCHMARK=1 6529 run test:no-coverage __tests__/lib/e2ee/history.benchmark.test.ts --runInBand`.
It writes `test-results/e2ee-history-benchmark.json`. The first fixture adds
100,000 already processed records to a real enrolled MLS device while retaining
its real checkpoint/cursor. The second sends 1,000 distinct imported originals
through real OpenMLS, takes a receiver offline, then catches it up.

The baseline uses main revision `71d11181b17779fe20203bf0329924c880c34977` with
the same benchmark file and dependencies. Results below are single diagnostic
Node runs using an emulated IndexedDB, not browser/device percentiles. Fixture
creation is excluded. The heap includes the emulated database and fixture
objects and is not an isolated active-cache memory measurement.

| Measurement | Baseline | Paged history |
| --- | ---: | ---: |
| Engine readiness with saved 100,000-record fixture | 27,233 ms | 3.1 ms |
| Read newest messages after readiness | 56 ms | 391 ms |
| Combined readiness and newest-page read | 27,289 ms | 394 ms |
| Active returned records | 100,002 | 100 |
| Additional MLS log requests when browsing saved records | 0 | 0 |
| Importer, 1,000 real MLS imports | 648 ms | 640 ms |
| Receiver, 1,000 real MLS imports | 320 ms | 328 ms |
| Receiver saved imports in complete backup | 1,000 | 1,000 |
| Receiver active returned records | 1,001 | 100 |

The small catch-up fixture does not show a cryptographic speedup. Ordered MLS
work remains necessary. Indexed duplicate lookup, summaries, bounded snapshots
and frame-batched notifications remove history-dependent surrounding work.

## One-time native upgrade

Two isolated local Chromium runs migrated 100,000 v1 records in 90.0 seconds
and 130.5 seconds under different concurrent machine load. Both retained all
100,000 records, checkpoint version 42, correct unread counts and a 100-record
newest page. These runs do not establish an improvement in migration speed.
The first upgrade remains a material one-time preparation cost; warm reopening
is measured separately. The staging migration case therefore has an explicit
five-minute preparation budget, while ordinary opening assertions retain their
normal timeout. A separate native run verified the negative-infinity composite
start key used by complete search/backup traversal.

## Functional coverage

Storage tests cover profile isolation, stable ordering of equal-sequence
notices, pending records, paging in both directions, import deletion/reimport,
unread/mention counts, preserved v1 device/checkpoint/history records, and a
maximum two-page browsing window.

Real-MLS integration tests exercise edits, reactions, replies and reply hints,
search, report previews, deletion, complete backup and idempotent restore after
the target has left the active page. Existing engine recovery, synchronization,
trust, revocation and backup tests remain required.

## Browser and staging coverage

The local encrypted sandbox pack runs desktop and mobile. The existing opt-in
`e2ee-staging` pack retains its real user/device/text/image/group/revocation
journeys. It additionally seeds 100,000 processed records, including 9,000
historical photo references, in a throwaway staging identity. Its v1 fixture
retains the real device key and sealed MLS checkpoint. It records the first
schema upgrade separately from subsequent opening/input latency, plus DOM rows,
placeholders, heap and blob requests, checks
that log cursors do not regress, and browses older history. A separate real
staging transport uses the same engine and OpenMLS to send 250 imported
originals and reconnect an offline receiver. Tokens and throwaway wallet keys
stay in test memory and are never artifacts.

Staging run identifiers, browser measurements and screenshots will be recorded
after the reviewed change is deployed. Production is outside this workstream.
