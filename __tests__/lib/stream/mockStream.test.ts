/** @jest-environment node */
import {
  CANONICAL_FEE_SHARE,
  FEDERATED_FEE_SHARE,
} from "@/lib/stream/constants";
import type { TxResult } from "@/lib/stream/dataSource";
import { parseEthToWei } from "@/lib/stream/eth";
import { createMockStream, MOCK_ACCOUNTS, MOCK_EPOCH } from "@/lib/stream/mock";
import type { Address, StreamWork, WorkKey } from "@/lib/stream/types";

const eth = (text: string): bigint => {
  const wei = parseEthToWei(text);
  if (wei === null) {
    throw new Error(text);
  }
  return wei;
};

const A = MOCK_ACCOUNTS.collectorA;
const B = MOCK_ACCOUNTS.collectorB;

function expectOk<T>(result: TxResult<T>): T {
  if (!result.ok) {
    throw new Error(
      `tx failed: ${result.error.code} ${JSON.stringify(result.error.args)}`
    );
  }
  return result.value;
}

function expectRevert(result: TxResult<unknown>, code: string): void {
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe(code);
  }
}

/** A fresh seeded world on a frozen wall clock: only `advance` moves time. */
function world() {
  return createMockStream({ wallNow: () => 0 });
}

async function workTitled(
  stream: ReturnType<typeof world>,
  title: string
): Promise<StreamWork> {
  for (const summary of await stream.dataSource.listWorks()) {
    if (summary.title === title) {
      const found = await stream.dataSource.getWork(summary.key);
      if (found && found.standard === "ERC721") {
        return found;
      }
    }
  }
  throw new Error(`no work ${title}`);
}

async function auctionOf(stream: ReturnType<typeof world>, key: WorkKey) {
  const auction = await stream.dataSource.auctionForWork(key);
  if (!auction) {
    throw new Error(`no auction for ${key}`);
  }
  return auction;
}

describe("the seeded scenarios", () => {
  it("is deterministic and ends at the simulated epoch", async () => {
    const first = world();
    const second = world();
    expect(first.dataSource.now()).toBe(MOCK_EPOCH);
    expect(await first.dataSource.listWorks()).toEqual(
      await second.dataSource.listWorks()
    );
  });

  it("covers every state the UI must show", async () => {
    const stream = world();
    const feed = await stream.dataSource.homeFeed();
    expect(feed.live.length).toBeGreaterThanOrEqual(3);
    expect(feed.endingSoon.length).toBeGreaterThanOrEqual(1);
    expect(feed.upcoming.map((item) => item.title)).toEqual(["Low Water"]);
    expect(feed.recentResults.length).toBeGreaterThanOrEqual(3);
    expect(feed.editionsLive.length).toBeGreaterThanOrEqual(2);

    const phases = (await stream.dataSource.listEditionAuctions()).map(
      (a) => a.phase
    );
    expect(phases).toEqual(
      expect.arrayContaining([
        "open",
        "disputed",
        "closed",
        "settled",
        "void",
        "opening",
      ])
    );

    const variants = new Set(
      (await stream.dataSource.listWorks()).map((w) => w.variant)
    );
    expect([...variants].sort()).toEqual([
      "federated-1155",
      "federated-721",
      "federated-pair-edition",
      "federated-pair-master",
      "stream-1of1",
      "stream-edition",
    ]);
  });

  it("serves a finalized on-chain work inline and an off-chain work by locator", async () => {
    const stream = world();
    const onChain = await workTitled(stream, "Salt Meridian");
    expect(onChain.storage).toBe("on-chain");
    expect(onChain.record?.finalized).toBe(true);
    expect(
      onChain.metadata.image?.startsWith("data:image/svg+xml;base64,")
    ).toBe(true);
    expect(onChain.metadata.license).toBe("CC0-1.0");
    expect(onChain.license?.irrevocable).toBe(true);
    expect(onChain.metadata.attributes.map((a) => a.trait_type)).toContain(
      "Dispute statement"
    );

    const offChain = await workTitled(stream, "Copper Rain");
    expect(offChain.storage).toBe("off-chain");
    expect(offChain.metadata.media_url?.startsWith("ipfs://bafkrei")).toBe(
      true
    );
    expect(offChain.metadata.animation_url).toBe(offChain.metadata.media_url);
    const primary = offChain.media[0];
    expect(primary?.kind).toBe("html");
    expect(primary?.locators.map((locator) => locator.kind)).toEqual([
      "ARWEAVE",
      "IPFS",
    ]);
    expect(primary?.locators[0]?.uri).toMatch(/^ar:\/\/[A-Za-z0-9_-]{43}$/);
    // `ipfs://` and a base32 CIDv1: 66 characters in all (WS-18).
    expect(primary?.locators[1]?.uri).toHaveLength(66);
    expect(offChain.parties.map((party) => party.role)).toEqual([
      "ARTIST",
      "COLLABORATOR",
    ]);
  });
});

describe("the 1/1 English auction", () => {
  it("enforces 5% or 0.001 ETH, extends in the last 15 minutes and credits the outbid", async () => {
    const stream = world();
    const work = await workTitled(stream, "Quiet Engine");
    const creditOf = async (account: Address) => {
      const items = (await stream.dataSource.accountOverview(account))
        .claimable;
      const credit = items.find((item) => item.kind === "auction-credit");
      return credit?.kind === "auction-credit" ? credit.amount : 0n;
    };
    const creditBefore = await creditOf(A);
    let auction = await auctionOf(stream, work.key);
    expect(auction.highBid).toBe(eth("0.2"));
    expect(auction.minimumNextBid).toBe(eth("0.21"));
    const english = stream.actions.sale("ENGLISH_AUCTION");
    expectRevert(
      await english.bid(B, auction.saleId, eth("0.209")),
      "BidTooLow"
    );

    stream.dev.advance(auction.endTime - stream.dataSource.now() - 60);
    expectOk(await english.bid(B, auction.saleId, eth("0.21")));
    auction = await auctionOf(stream, work.key);
    expect(auction.endTime).toBe(stream.dataSource.now() + 15 * 60);
    expect(auction.bids.at(-1)?.extended).toBe(true);

    expect((await creditOf(A)) - creditBefore).toBe(eth("0.2"));
  });

  it("uses 0.001 ETH as the floor on small bids", async () => {
    const stream = world();
    const work = await workTitled(stream, "Copper Rain");
    const auction = await auctionOf(stream, work.key);
    expect(auction.highBid).toBe(eth("0.1"));
    expect(auction.minimumNextBid).toBe(eth("0.105"));
    const stream2 = world();
    const unbid = await workTitled(stream2, "Night Tide");
    expect((await auctionOf(stream2, unbid.key)).minimumNextBid).toBe(1n);
  });

  it("sends an unbid canonical work to the 6529 Network Museum", async () => {
    const stream = world();
    const work = await workTitled(stream, "Night Tide");
    const auction = await auctionOf(stream, work.key);
    expect(auction.state).toBe("ENDED");
    expect(auction.highBidder).toBeNull();
    expectOk(
      await stream.actions.sale("ENGLISH_AUCTION").settle(A, auction.saleId)
    );
    const settled = await stream.dataSource.getWork(work.key);
    expect(settled?.owner).toBe(stream.dataSource.source().contracts.museum);
    expect(
      (await stream.dataSource.museumHoldings()).map((h) => h.work)
    ).toContain(work.key);
  });

  it("returns an unbid federated work to its artist, not the museum", async () => {
    const stream = world();
    const work = await workTitled(stream, "Ferry Light");
    const auction = await auctionOf(stream, work.key);
    expect(auction.settlement?.outcome).toBe("artist");
    const artist = await stream.dataSource.getArtist(work.artistId);
    expect(work.owner).toBe(artist?.authority);
  });

  it("pays 75/25 on a canonical sale and 90/10 on a federated one", async () => {
    const stream = world();
    const canonical = await auctionOf(
      stream,
      (await workTitled(stream, "Salt Meridian")).key
    );
    expect(canonical.terms.feeShare).toBe(CANONICAL_FEE_SHARE);
    expect(canonical.settlement?.price).toBe(eth("1.2"));
    expect(canonical.settlement?.fee).toBe(eth("0.3"));
    expect(canonical.settlement?.sellerProceeds).toBe(eth("0.9"));
    const federated = await auctionOf(
      stream,
      (await workTitled(stream, "Two Rooms")).key
    );
    expect(federated.terms.feeShare).toBe(FEDERATED_FEE_SHARE);
    expect(federated.settlement?.fee).toBe(eth("0.015"));
  });

  it("leaves a pending delivery for a wallet that refuses the token, claimable to another address", async () => {
    const stream = world();
    const work = await workTitled(stream, "Ember Index");
    const auction = await auctionOf(stream, work.key);
    expect(auction.pendingDelivery).toBe(B);
    const english = stream.actions.sale("ENGLISH_AUCTION");
    expectRevert(
      await english.claimDelivery(A, auction.saleId, A),
      "NoPendingDelivery"
    );
    const safe = "0x00000000000000000000000000000000000000d1" as Address;
    expectOk(await english.claimDelivery(B, auction.saleId, safe));
    expect((await stream.dataSource.getWork(work.key))?.owner).toBe(safe);
  });
});

describe("disputes", () => {
  it("pauses bidding, lets the high bidder withdraw, and voids the editions on an upheld cancel", async () => {
    const stream = world();
    const work = await workTitled(stream, "Glass Orchard");
    const auction = await auctionOf(stream, work.key);
    expect(auction.state).toBe("PAUSED");
    expect(work.dispute.paused).toBe(true);
    const english = stream.actions.sale("ENGLISH_AUCTION");
    expectRevert(
      await english.bid(A, auction.saleId, eth("1")),
      "InvalidAuctionState"
    );
    expectRevert(await english.withdrawBid(A, auction.saleId), "NotHighBidder");
    expectOk(await english.withdrawBid(B, auction.saleId));

    const edition = work.linked.edition ?? "";
    const editions = stream.actions.sale("UNIFORM_AUCTION");
    const disputed = await stream.dataSource.getEditionAuction(edition);
    expect([
      disputed?.phase,
      disputed?.biddingOpen,
      disputed?.withdrawalsOpen,
    ]).toEqual(["disputed", true, true]);
    expectOk(await editions.bid(A, edition, 120, 1));
    const [mine] = await stream.dataSource.editionBids(edition, B);
    expectOk(await editions.withdraw(B, edition, mine?.bidId ?? 0));

    expectRevert(stream.dev.resolveDispute(work.key, true), "UnpauseTooEarly");
    stream.dev.advance(9 * 3_600);
    expectOk(stream.dev.resolveDispute(work.key, true));
    expect((await stream.dataSource.getWork(work.key))?.burned).toBe(true);
    expect((await stream.dataSource.getEditionAuction(edition))?.phase).toBe(
      "void"
    );
    expectOk(await editions.settle(A, edition));
    const claim = (await stream.dataSource.editionBids(edition, A))[0];
    expect(claim?.refund).toBe(claim?.escrow);
  });

  it("resumes a rejected dispute for at least 24 hours", async () => {
    const stream = world();
    const work = await workTitled(stream, "Glass Orchard");
    stream.dev.advance(9 * 3_600);
    expectOk(stream.dev.resolveDispute(work.key, false));
    const auction = await auctionOf(stream, work.key);
    expect(auction.state).toBe("ACTIVE");
    expect(auction.endTime - stream.dataSource.now()).toBeGreaterThanOrEqual(
      86_400
    );
  });

  it("stays paused through its seventh day, then resumes by itself", async () => {
    const stream = world();
    const work = await workTitled(stream, "Glass Orchard");
    const expiresAt = (await auctionOf(stream, work.key)).pause.expiresAt ?? 0;
    stream.dev.advance(expiresAt - stream.dataSource.now());
    expect((await auctionOf(stream, work.key)).state).toBe("PAUSED");
    stream.dev.advance(1);
    const resumed = await auctionOf(stream, work.key);
    expect(resumed.state).toBe("ACTIVE");
    expect(resumed.endTime).toBeGreaterThanOrEqual(expiresAt + 86_400);
  });
});

describe("the uniform-price edition auction", () => {
  it("shows the owner's example as closed: 80 at 0.0511, settles and pays 75/25", async () => {
    const stream = world();
    const work = await workTitled(stream, "Open Ledger");
    const edition = work.linked.edition ?? "";
    const auction = await stream.dataSource.getEditionAuction(edition);
    expect(auction?.phase).toBe("closed");
    expect([auction?.status, auction?.biddingOpen]).toEqual(["CLOSED", false]);
    expect(auction?.clearing.count).toBe(80);
    expect(auction?.clearing.price).toBe(eth("0.0511"));
    expect(auction?.clearing.revenue).toBe(eth("4.088"));
    expect(auction?.clearing.networkShare).toBe(eth("1.022"));
    const editions = stream.actions.sale("UNIFORM_AUCTION");
    expectOk(await editions.settle(A, edition));
    const bids = await stream.dataSource.editionBids(edition);
    let minted = 0;
    for (const bid of bids) {
      const result = expectOk(
        await editions.claim(bid.bidder, edition, bid.bidId, bid.bidder)
      );
      minted += result.editions;
      expect(result.refund).toBe(
        bid.escrow - BigInt(result.editions) * eth("0.0511")
      );
    }
    expect(minted).toBe(80);
    expect((await stream.dataSource.getWork(edition))?.editionSupply).toBe(80);
    const seller = await stream.dataSource.splitWallet(work.economics.seller);
    expect(seller?.received).toBeGreaterThanOrEqual(eth("3.066"));
  });

  it("fills a capped cut step in queue order, with the raise hole swept", async () => {
    const stream = world();
    const work = await workTitled(stream, "Fold Study 7");
    const edition = work.linked.edition ?? "";
    const auction = await stream.dataSource.getEditionAuction(edition);
    expect(auction?.terms.cap).toBe(25);
    expect([
      auction?.clearing.count,
      auction?.clearing.step,
      auction?.clearing.rationed,
    ]).toEqual([25, 130, true]);
    const statuses = (await stream.dataSource.editionBids(edition)).map(
      (bid) => [bid.qty, bid.status, bid.won]
    );
    expect(statuses).toEqual([
      [12, "in", 12],
      [8, "in", 8],
      [6, "partly", 2],
      [10, "out", 0],
      [3, "in", 3],
    ]);
    const out = (await stream.dataSource.editionBids(edition, B)).find(
      (bid) => bid.status === "out"
    );
    expect(out?.raiseToGetIn).not.toBeNull();
    const book = await stream.dataSource.stepTotals(edition);
    expect(
      book.map((row) => [
        row.step,
        row.units,
        row.cumulative,
        row.status,
        row.won,
      ])
    ).toEqual([
      [130, 28, 39, "part", 14],
      [132, 8, 11, "in", 8],
      [133, 3, 3, "in", 3],
    ]);
    const candidates = await stream.dataSource.candidates(edition);
    expect(
      candidates.map((row) => [row.count, row.step, row.chosen, row.best])
    ).toEqual([
      [3, 133, false, false],
      [11, 132, false, false],
      [25, 130, true, true],
    ]);
  });

  it("closes 15 minutes after the 1/1 and extends by 5 minutes on a late bid, within the backstop", async () => {
    const stream = world();
    const work = await workTitled(stream, "Quiet Engine");
    const edition = work.linked.edition ?? "";
    const oneOfOne = await auctionOf(stream, work.key);
    let auction = await stream.dataSource.getEditionAuction(edition);
    expect(auction?.times.editionEnd).toBe(oneOfOne.endTime + 15 * 60);
    stream.dev.advance(
      (auction?.times.editionEnd ?? 0) - stream.dataSource.now() - 60
    );
    expectOk(
      await stream.actions.sale("UNIFORM_AUCTION").bid(A, edition, 90, 1)
    );
    auction = await stream.dataSource.getEditionAuction(edition);
    expect(auction?.times.editionEnd).toBe(stream.dataSource.now() + 5 * 60);
    expect(auction?.phase).toBe("extended");
    expect(auction?.times.backstop).toBe(
      (auction?.times.baseEnd ?? 0) + 86_400
    );
  });

  it("opens permissionlessly, then mints nothing when nobody bids", async () => {
    const stream = world();
    const work = await workTitled(stream, "Copper Rain");
    const edition = work.linked.edition ?? "";
    const editions = stream.actions.sale("UNIFORM_AUCTION");
    expect((await stream.dataSource.getEditionAuction(edition))?.phase).toBe(
      "opening"
    );
    expectRevert(await editions.bid(A, edition, 100, 1), "BiddingClosed");
    expectOk(await editions.open(B, edition));
    expect((await stream.dataSource.getEditionAuction(edition))?.phase).toBe(
      "open"
    );
    const oneOfOne = await auctionOf(stream, work.key);
    stream.dev.advance(oneOfOne.endTime - stream.dataSource.now() + 16 * 60);
    expect((await stream.dataSource.getEditionAuction(edition))?.phase).toBe(
      "noBids"
    );
    expectRevert(await editions.settle(A, edition), "SettlementNotReady");
    expectOk(
      await stream.actions.sale("ENGLISH_AUCTION").settle(A, oneOfOne.saleId)
    );
    expectOk(await editions.settle(A, edition));
    expect(
      (await stream.dataSource.getEditionAuction(edition))?.clearing.count
    ).toBe(0);
  });

  it("quotes a what-if bid and the lowest bid that gets in", async () => {
    const stream = world();
    const work = await workTitled(stream, "Quiet Engine");
    const edition = work.linked.edition ?? "";
    const lowest = await stream.dataSource.lowestWinningStep(edition, 1);
    expect(lowest).not.toBeNull();
    const quote = await stream.dataSource.quoteEditionBid(
      edition,
      lowest ?? 0,
      1
    );
    expect(quote?.won).toBe(1);
    const below = await stream.dataSource.quoteEditionBid(
      edition,
      (lowest ?? 1) - 1,
      1
    );
    expect(below?.won).toBe(0);
  });

  it("refuses withdrawals unless the 1/1 is paused for a dispute", async () => {
    const stream = world();
    const work = await workTitled(stream, "Quiet Engine");
    const edition = work.linked.edition ?? "";
    const [mine] = await stream.dataSource.editionBids(edition, A);
    expectRevert(
      await stream.actions
        .sale("UNIFORM_AUCTION")
        .withdraw(A, edition, mine?.bidId ?? 0),
      "WithdrawalsClosed"
    );
  });
});

describe("claims and payouts", () => {
  it("pulls split payouts per payee share", async () => {
    const stream = world();
    const work = await workTitled(stream, "Salt Meridian");
    const wallet = await stream.dataSource.splitWallet(work.economics.seller);
    const payee = wallet?.payees[0];
    expect(payee?.releasable).toBeGreaterThan(0n);
    const released = expectOk(
      await stream.actions.releaseSplit(
        A,
        work.economics.seller,
        payee?.index ?? 0
      )
    );
    expect(released).toBe(payee?.releasable);
    expectRevert(
      await stream.actions.releaseSplit(
        A,
        work.economics.seller,
        payee?.index ?? 0
      ),
      "NothingToRelease"
    );
  });

  it("claims outbid credits once", async () => {
    const stream = world();
    const english = stream.actions.sale("ENGLISH_AUCTION");
    const before = (await stream.dataSource.accountOverview(B)).claimable;
    expect(before.some((item) => item.kind === "auction-credit")).toBe(true);
    expectOk(await english.claimCredits(B, B));
    expectRevert(await english.claimCredits(B, B), "NothingToClaim");
  });

  it("rolls a failed transaction back completely", async () => {
    const stream = world();
    const work = await workTitled(stream, "Quiet Engine");
    const auction = await auctionOf(stream, work.key);
    const balance = stream.dev
      .accounts()
      .find((account) => account.address === A)?.balance;
    expectRevert(
      await stream.actions
        .sale("ENGLISH_AUCTION")
        .bid(A, auction.saleId, eth("1000")),
      "InsufficientBalance"
    );
    expect(
      stream.dev.accounts().find((account) => account.address === A)?.balance
    ).toBe(balance);
  });
});

describe("6529 Stream Federated (v1.1 design)", () => {
  it("hides delisted contracts from the directory and refuses their sales", async () => {
    const stream = world();
    const listed = await stream.dataSource.federatedDirectory();
    expect(listed.every((entry) => entry.status === "ACTIVE")).toBe(true);
    const all = await stream.dataSource.federatedDirectory({
      includeDelisted: true,
    });
    const delisted = all.find((entry) => entry.status === "DELISTED");
    expect(delisted?.delisting?.statement?.kind).toBe("DELISTING");
    const work = delisted?.works[0] ?? "";
    // Tokens and ownership are untouched: the work stays in the adapter's custody until settled.
    expect((await stream.dataSource.getWork(work))?.owner).toBe(
      stream.dataSource.source().contracts.englishAuction
    );
    const auction = await auctionOf(stream, work);
    // MARKET-5: the sale ends unsold and the bid is credited back; the token goes to the artist.
    expectOk(
      await stream.actions.sale("ENGLISH_AUCTION").settle(A, auction.saleId)
    );
    expect((await auctionOf(stream, work)).settlement?.outcome).toBe("artist");
  });

  it("deploys a linked pair through the factory and sells a master with its edition auction", async () => {
    const stream = world();
    const artist = stream.dev
      .accounts()
      .find((account) => account.role === "federatedArtist");
    const from = artist?.address ?? A;
    const deployed = expectOk(
      await stream.actions.deployFederated(from, {
        form: "PAIR",
        name: "Test Pair",
        symbol: "TP",
        editionName: "Test Pair Editions",
        editionSymbol: "TPE",
        defaultLicense: "LicenseRef-All-Rights-Reserved",
      })
    );
    expect(deployed.contracts).toHaveLength(2);
    const [master, editions] = await Promise.all(
      deployed.contracts.map((address) =>
        stream.dataSource.getFederatedContract(address)
      )
    );
    expect(master?.partner).toBe(editions?.address);
    expect(master?.feeShare).toBe(FEDERATED_FEE_SHARE);
    expect(master?.saleKinds).toEqual(["ENGLISH_AUCTION"]);
    expectRevert(
      await stream.actions.mintViaAuction(B, master?.address ?? A, "Not mine"),
      "NotWorkArtist"
    );
    const key = expectOk(
      await stream.actions.mintViaAuction(
        from,
        master?.address ?? A,
        "First Room"
      )
    );
    const work = await stream.dataSource.getWork(key);
    expect(work?.variant).toBe("federated-pair-master");
    expect(work?.license?.spdxId).toBe("LicenseRef-All-Rights-Reserved");
    const edition = await stream.dataSource.getWork(work?.linked.edition ?? "");
    expect(edition?.variant).toBe("federated-pair-edition");
    expect(
      (await stream.dataSource.getEditionAuction(edition?.key ?? ""))?.phase
    ).toBe("open");
  });

  it("creates an artist identity on first deploy when the deployer has none", async () => {
    const stream = world();
    const stranger = "0x00000000000000000000000000000000000000e1" as Address;
    const result = expectOk(
      await stream.actions.deployFederated(stranger, {
        form: "ERC1155",
        name: "New Studio",
        symbol: "NEW",
        defaultLicense: "CC-BY-4.0",
      })
    );
    expect((await stream.dataSource.artistOf(stranger))?.artistId).toBe(
      result.artistId
    );
  });

  it("dispatches sales by kind and keeps unknown kinds renderable", async () => {
    const stream = world();
    const work = await workTitled(stream, "Quiet Engine");
    const sale = await stream.dataSource.getSale(
      work.sale ?? { kind: "x", adapter: A, saleId: "0" }
    );
    expect(sale.kind).toBe("ENGLISH_AUCTION");
    const unknown = await stream.dataSource.getSale({
      kind: "FIXED_PRICE",
      adapter: A,
      saleId: "1",
    });
    expect(unknown.kind).toBe("unsupported");
  });
});
