# 6529 Stream data layer

The `/stream` section reads through `StreamDataSource` and writes through
`StreamActions` (`dataSource.ts`). Today both are the in-memory mock under
`mock/`. When the rc.2 contracts are on Sepolia (r4), a chain implementation
replaces the mock in one place, `createBrowserStream` in
`components/stream/data/StreamProvider.tsx`, and no page changes.

The section is behind a host flag (`config/streamProduct.ts`): on for local
development and `staging.6529.io`, off in production.

## Layout

| Path                                         | What it holds                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `types.ts`                                   | Read models, each named after the contract view, struct or event that backs it         |
| `dataSource.ts`                              | `StreamDataSource`, `StreamActions`, `TxResult`, and the mock-only `StreamDevControls` |
| `constants.ts`                               | Launch values: splits, royalty, auction config, edition-auction terms                  |
| `ladder.ts`                                  | The E192 price ladder (D138): `stepPrice`, `ladderPrices`, `nearestStep`               |
| `clearing.ts`                                | Uniform-price clearing, the brute-force definition, the FIFO cut-step sweep            |
| `editionBook.ts`                             | The bid book (live units, queue positions, departures) and what-if reads               |
| `editionViews.ts`                            | Order-book rows and the "why this many" candidates, shared by mock and chain           |
| `editionTiming.ts`                           | Edition close, soft close and backstop, and the UX phase                               |
| `englishAuction.ts`                          | 1/1 rules: minimum bid, anti-snipe, resume, splits, royalty                            |
| `eth.ts`, `media.ts`, `gas.ts`, `workKey.ts` | Wei text, media kinds and locators, labelled gas figures, work keys and routes         |
| `route.server.ts`                            | The flag guard and `noindex` metadata for section pages                                |
| `mock/`                                      | The simulation: engine, sale adapters, federated factory, scenarios, art               |

Work keys: a 6529 Stream token is its bare ID (`"12"`); any other token is
`<contract>-<tokenId>`. `/stream/editions/12` is the 6529 Stream Editions
edition of master 12.

## Swapping the mock for the chain

Implement `StreamDataSource` and `StreamActions` with viem reads and wagmi
writes. `now()` is the latest block's timestamp; `subscribe` fires on new
blocks and on the events below; `version()` increments with them. Set `dev` to
`null`: the dev panel then hides itself. Contract names follow `6529-works`
`src/interfaces/`.

### Reads

| Method                                       | Contract view or event                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source`                                     | The deployment record `deployments/11155111/<instance>.json`                                                                                                                                                                                                                                                                     |
| `homeFeed`                                   | `SaleStarted`, `BidPlaced`, `SaleSettled` (indexed), `IEnglishAuction.auction`; startable items from `curationQueue`                                                                                                                                                                                                             |
| `listWorks`, `getWork`                       | `IStream.work`, `coreOf`, `tokenURI` (decoded per docs/integrators/reading-a-work.md), `primarySaleSettled`, `editionOf`, `ownerOf`; `IWorkRecords.isOpen`, `record`, `mediaOf`, `locators`, `preferredLocator`, `licenseOf`, `seedOf`; `IEditions.edition`, `masterOf`, `uri`; `IFederationRegistry.entry` for federated tokens |
| `provenance`                                 | `WorkMinted`, `SaleStarted`, `BidPlaced`, `SaleSettled`, `Transfer`, `RecordOpened`, `WorkFinalized`, `WorkOnChainComplete`, `LocatorAdded`, `EditionCreated`, `AuctionPaused`, `AuctionResumed`, `AuctionCancelled`, `DeliveryPending`, `DeliveryClaimed`, `StatementAppended`                                                  |
| `listArtists`, `getArtist`, `artistOf`       | `IArtistRegistry.artist`, `activeAuthorityOf`, `pendingChange`, `standingOf`, `artistIdOf`; `ArtistRegistered`, `ChangeStaged`, `ChangeExecuted`, `FederatedContractListed`                                                                                                                                                      |
| `getSale`                                    | Dispatches on the adapter's `saleKind()` (see "Sale methods")                                                                                                                                                                                                                                                                    |
| `getOneOfOneAuction`, `auctionForWork`       | `IEnglishAuction.auction`, `minimumBid`, `lockedTerms`, `pendingDelivery`, `config`; `saleIdOf(token, tokenId)`; bid history from `BidPlaced`                                                                                                                                                                                    |
| `listEditionAuctions`, `getEditionAuction`   | `IUniformEditionAuction.auction`, `endTimes` (with `biddingOpen`, `withdrawalsOpen`), `clearing`, `settlement`; `AuctionOpened`, `AuctionCleared`, `AuctionSettled`, `AuctionVoided`                                                                                                                                             |
| `stepTotals`, `candidates`                   | `stepTotals(saleId)` (low step and units) and `ladder`; rows built with `editionViews.ts` from those totals and `clear`                                                                                                                                                                                                          |
| `editionBids`                                | `BidPlaced`, `BidRaised`, `BidWithdrawn`, `BidClaimed` per bidder, then `bidOf` and `bidOutcome(saleId, bidId)` (units won, refund, units ahead)                                                                                                                                                                                 |
| `quoteEditionBid`, `lowestWinningStep`       | `quote(saleId, step, quantity)` (won, pushed out, pulled in), `lowestWinningStep(saleId, quantity)` (at least one copy)                                                                                                                                                                                                          |
| `lowestStepFullyIn`                          | Client-side: `editionBook.ts` on the step totals and `departures`, checked against the golden vectors                                                                                                                                                                                                                            |
| `ladder`                                     | `ladder(saleId)` / `stepPrice(saleId, step)` over the auction's locked terms                                                                                                                                                                                                                                                     |
| `editionBalances`                            | ERC-1155 `balanceOf` / `TransferSingle` on 6529 Stream Editions and federated 1155s                                                                                                                                                                                                                                              |
| `splitWallet`                                | `ISplitWallet.payees`, `observed(ETH)`, `released`, `releasable`                                                                                                                                                                                                                                                                 |
| `accountOverview`                            | The reads above for one account, plus `IEnglishAuction.claimable(account, ETH)`                                                                                                                                                                                                                                                  |
| `museumHoldings`                             | `EconomicsResolver.museum()` and `Transfer` events to it                                                                                                                                                                                                                                                                         |
| `curationQueue`                              | `PackageRegistered`, `PackageRevoked`, `PackageAccepted`, `ItemConsumed`; `packageOf`, `acceptedAs`; item details from the published package files                                                                                                                                                                               |
| `disputes`                                   | `AuctionPaused`, `AuctionResumed`, `AuctionCancelled`; `StatementLog.latestDisputeOutcome`, `StatementAppended`                                                                                                                                                                                                                  |
| `federatedDirectory`, `getFederatedContract` | `IFederationRegistry.Registered`, `StatusSet`, `ArtistDelistingSet`, `entry`, `isActive` (v1.1: no contracts yet)                                                                                                                                                                                                                |

### Writes

| Action                                                                                     | Contract call                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sale("ENGLISH_AUCTION").bid`                                                              | `IEnglishAuction.bid(saleId, recipient, payment)`                                                                                                                                                                                                |
| `.settle`, `.claimDelivery`, `.withdrawBid`                                                | `settle(saleId)`, `claimDelivery(saleId, to)`, `withdrawBid(saleId)`                                                                                                                                                                             |
| `.claimCredits`                                                                            | `ISaleAdapter.claim(ETH, to)`                                                                                                                                                                                                                    |
| `sale("UNIFORM_EDITION_AUCTION").open` / `bid` / `raise` / `withdraw` / `settle` / `claim` | `IUniformEditionAuction.open(token, id, data)`, `bid(saleId, step, quantity)`, `raise(saleId, bidId, newStep)`, `withdrawBid(saleId, bidId, to)`, `settle(saleId, settlementOrder(saleId))` until it returns true, `claimBid(saleId, bidId, to)` |
| `startAuction`                                                                             | `IEnglishAuction.start(stream, abi.encode(StreamMintRequest))`                                                                                                                                                                                   |
| `createEdition`                                                                            | `IEditions.createEdition`                                                                                                                                                                                                                        |
| `releaseSplit`                                                                             | `ISplitWallet.release(ETH, index)`                                                                                                                                                                                                               |
| `deployFederated`, `mintViaAuction`, `openFederatedEditionAuction`                         | The v1.1 federation factory and the shared adapters (no contracts yet)                                                                                                                                                                           |

The edition-auction shapes follow the frozen `IUniformEditionAuction` (ADR
0005, lane L0): statuses `NONE`, `OPEN`, `CLOSED` (derived), `SETTLING`,
`SETTLED`, `VOID`; the margin as `marginShare` out of 100,000; and the
contract's custom errors (`BiddingClosed`, `WithdrawalsClosed`,
`SettlementNotReady`, `UnknownBid`, ...). The chain source maps a work key to
`saleIdOf(token, id)`.

Every write returns `TxResult`: the hash and a labelled gas figure, or the
contract's custom error (`BidTooLow`, `InvalidAuctionState`, ...).
`components/stream/ui/GasNote.tsx` turns errors into words.

## Sale methods

Every contract starts with the two auctions; governance can admit another
adapter later. To add one (for example fixed price):

1. add its label to `KnownSaleKind` and its view to `SaleViewByKind` (`types.ts`);
2. add its writes to `SaleActionsByKind` (`dataSource.ts`);
3. add one mock adapter under `mock/sales/` and register it in `mock/sales/registry.ts`;
4. add one panel to `components/stream/sales/salePanels.tsx`.

An unknown kind read from a contract renders as "unsupported", not as an error.

## The mock

`createMockStream()` builds an independent world on a simulated clock that
starts four days before `MOCK_EPOCH` and replays the seed in time order through
the same functions the actions use. Writes are atomic: a revert restores the
state. The dev panel speeds up, pauses or jumps the clock, switches accounts and
resets the world.

Rules it enforces: the 24-hour English auction from zero, 5% or 0.001 ETH
increments, the 15-minute anti-snipe, pull credits, pending delivery, the
75/25 and 90/10 splits, the 6.529% royalty, CC0 by default; the edition auction
on the 336-step ladder with the 10% breadth rule, the optional cap with FIFO and
the departure sweep, firm bids, the 5-minute soft close with the 24-hour
backstop, the close 15 minutes after the 1/1, no editions without bids; an
unbid canonical 1/1 to the museum, an unbid federated 1/1 to its artist; the
dispute pause, withdrawal, upheld cancel (burn and void) and rejected resume;
federated deploy, delisting (MARKET-5 on settle) and the directory.

Seeded scenarios (fictional artists, generated art):

| Work                                     | State                                                                                   |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Salt Meridian                            | Sold; finalized and fully on-chain; a statement-only dispute outcome; a resale royalty  |
| Lantern Field                            | No bids: in the museum                                                                  |
| Ember Index                              | Sold; delivery pending (the winner's wallet refuses); editions settled with claims open |
| Withdrawn Light                          | Dispute upheld: burned; its edition auction void with refunds                           |
| Glass Orchard                            | Paused for a dispute: withdrawals open on both auctions                                 |
| Open Ledger                              | The owner's example: editions closed at 80 for 0.0511 ETH, waiting to settle            |
| Night Tide                               | Ended with no bids: settling sends it to the museum                                     |
| Fold Study 7                             | Ending in minutes after an anti-snipe extension; capped editions with a raise hole      |
| Quiet Engine                             | Live, partly on-chain, with an open edition auction                                     |
| Copper Rain                              | Live HTML work on Arweave and IPFS; edition auction not yet opened                      |
| Low Water, Salt Lines, Quarry Song       | Curation: ready to start, waiting for the move, waiting for signatures                  |
| Halden Studio, Reik Multiples, Ohm Rooms | Federated 721, 1155 and linked pair, with different licenses                            |
| Mara Vell Official                       | A delisted federated contract (impersonation)                                           |

## Localization

Copy is the `stream.*` route namespace (`i18n/messages/stream-*.ts`), en-US
only for now: other locales fall back to en-US until the owner approves the copy
and translations follow. Numbers, dates and ETH amounts use `@/i18n/format`.

## Tests

`__tests__/lib/stream/`: clearing and FIFO parity with the D138 reference model
(`fixtures/d138-reference-vectors.json`, generated by `model/ref.py`), the
auction rules and clocks, and the seeded engine end to end.
