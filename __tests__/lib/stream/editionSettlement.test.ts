/** @jest-environment node */
import type { TxResult } from "@/lib/stream/dataSource";
import { parseEthToWei } from "@/lib/stream/eth";
import { createMockStream, MOCK_ACCOUNTS } from "@/lib/stream/mock";
import { OTHER_BIDDERS } from "@/lib/stream/mock/scenarioKit";
import type { Address, StreamWork } from "@/lib/stream/types";

const eth = (text: string): bigint => parseEthToWei(text) ?? 0n;

const A = MOCK_ACCOUNTS.collectorA;
const B = MOCK_ACCOUNTS.collectorB;

function expectOk<T>(result: TxResult<T>): T {
  if (!result.ok) {
    throw new Error(`tx failed: ${result.error.code}`);
  }
  return result.value;
}

function expectRevert(result: TxResult<unknown>, code: string): void {
  expect(result.ok ? "ok" : result.error.code).toBe(code);
}

function world() {
  return createMockStream({ wallNow: () => 0 });
}

async function masterTitled(
  stream: ReturnType<typeof world>,
  title: string
): Promise<StreamWork & { readonly edition: string }> {
  for (const summary of await stream.dataSource.listWorks()) {
    const work =
      summary.title === title
        ? await stream.dataSource.getWork(summary.key)
        : null;
    if (work?.standard === "ERC721" && work.linked.edition !== null) {
      return { ...work, edition: work.linked.edition };
    }
  }
  throw new Error(`no master ${title}`);
}

describe("chunked edition settlement (rc.2)", () => {
  it("leaves a wide book SETTLING with words left, refusing bids and claims until anyone continues", async () => {
    const stream = world();
    const editions = stream.actions.sale("UNIFORM_AUCTION");
    const { edition, key } = await masterTitled(stream, "Tide Table");

    // Editions sell whether or not the 1/1 drew bids: this one went to the museum.
    const oneOfOne = await stream.dataSource.auctionForWork(key);
    expect(oneOfOne?.settlement?.outcome).toBe("museum");

    const settling = await stream.dataSource.getEditionAuction(edition);
    expect([settling?.status, settling?.phase, settling?.biddingOpen]).toEqual([
      "SETTLING",
      "settling",
      false,
    ]);
    expect(settling?.settlement).toEqual({
      cleared: false,
      wordsLeft: 2,
      cutUnits: 0,
      cutoff: 0,
      departuresSwept: 0,
      departures: 0,
    });
    expect([settling?.clearing.count, settling?.clearing.price]).toEqual([
      164,
      eth("0.0196"),
    ]);

    const [mine] = await stream.dataSource.editionBids(edition, A);
    expectRevert(await editions.bid(A, edition, 120, 1), "BiddingClosed");
    expectRevert(
      await editions.claim(A, edition, mine?.bidId ?? 0, A),
      "InvalidAuctionState"
    );
    expectRevert(
      await editions.withdraw(A, edition, mine?.bidId ?? 0),
      "InvalidAuctionState"
    );

    const scanned = (await stream.dataSource.editionActivity(edition)).filter(
      (event) => event.kind === "scanned"
    );
    expect(scanned).toEqual([
      expect.objectContaining({ wordsLeft: 2, source: "SettlementScanned" }),
    ]);

    // Anyone continues: here collector B, who has no bids to claim.
    const order = await stream.dataSource.settlementOrderFor(edition, B);
    expect(order).toEqual([]);
    expect(expectOk(await editions.settle(B, edition, order))).toEqual({
      settled: true,
    });
    const settled = await stream.dataSource.getEditionAuction(edition);
    expect([settled?.status, settled?.phase]).toEqual(["SETTLED", "settled"]);
    expect(settled?.settlement?.wordsLeft).toBe(0);
    expect(
      (await stream.dataSource.editionActivity(edition))
        .slice(-2)
        .map((event) => event.kind)
    ).toEqual(["cleared", "settled"]);

    const claimed: { editions: number; refund: bigint }[] = [];
    for (const bid of await stream.dataSource.editionBids(edition, A)) {
      claimed.push(expectOk(await editions.claim(A, edition, bid.bidId, A)));
    }
    expect(claimed).toEqual([
      { editions: 4, refund: eth("0.048") },
      { editions: 0, refund: eth("0.000525") },
    ]);
    const holders = await stream.dataSource.editionHolders(edition);
    expect(holders).toEqual([{ account: A, balance: 4 }]);
    // Settling a SETTLED sale changes nothing and reports it settled.
    expect(expectOk(await editions.settle(B, edition, []))).toEqual({
      settled: true,
    });
  });

  it("settles a typical sale in one call: the owner's example", async () => {
    const stream = world();
    const { edition } = await masterTitled(stream, "Open Ledger");
    const result = expectOk(
      await stream.actions.sale("UNIFORM_AUCTION").settle(B, edition, [])
    );
    expect(result).toEqual({ settled: true });
    const events = await stream.dataSource.editionActivity(edition);
    expect(events.map((event) => event.kind)).not.toContain("scanned");
    expect(events.at(-2)).toEqual(
      expect.objectContaining({
        kind: "cleared",
        count: 80,
        price: eth("0.0511"),
        revenue: eth("4.088"),
        networkFee: eth("1.022"),
      })
    );
  });

  it("sweeps a capped sale's raise hole in the finishing call", async () => {
    const stream = world();
    const { edition, key } = await masterTitled(stream, "Fold Study 7");
    const oneOfOne = await stream.dataSource.auctionForWork(key);
    const auction = await stream.dataSource.getEditionAuction(edition);
    expect([
      auction?.clearing.rationed,
      auction?.clearing.cutUnits,
      auction?.clearing.cutoff,
    ]).toEqual([true, 14, 22]);
    stream.dev.advance(
      (auction?.times.endTime ?? 0) - stream.dataSource.now() + 1
    );
    expectOk(
      await stream.actions
        .sale("ENGLISH_AUCTION")
        .settle(A, oneOfOne?.saleId ?? "")
    );
    expectOk(await stream.actions.createEdition(A, key));
    const order = await stream.dataSource.settlementOrderFor(edition, A);
    expect(order).toEqual([0]);
    expect(
      expectOk(
        await stream.actions.sale("UNIFORM_AUCTION").settle(A, edition, order)
      )
    ).toEqual({ settled: true });
    const settled = await stream.dataSource.getEditionAuction(edition);
    expect(settled?.settlement).toEqual({
      cleared: true,
      wordsLeft: 0,
      cutUnits: 14,
      cutoff: 22,
      departuresSwept: 1,
      departures: 1,
    });
  });

  it("sweeps per settler: a partial slice keeps its own progress, another settler starts afresh", async () => {
    const stream = world();
    const editions = stream.actions.sale("UNIFORM_AUCTION");
    // A standalone federated 1155 with a cap of 10: six bids of 2 at one step,
    // then the first two raise a step, leaving two holes at the cut step.
    const artist = "0x00000000000000000000000000000000000000f5" as Address;
    const [contract] = expectOk(
      await stream.actions.deployFederated(artist, {
        form: "ERC1155",
        name: "Sweep Study",
        symbol: "SWEEP",
        defaultLicense: "CC0-1.0",
      })
    ).contracts;
    const edition = expectOk(
      await stream.actions.openFederatedEditionAuction(
        artist,
        contract ?? A,
        "Sweep Study",
        10
      )
    );
    // Six funded bidders (the seed funds OTHER_BIDDERS).
    const bidders = OTHER_BIDDERS.slice(0, 6);
    const bidIds: number[] = [];
    for (const bidder of bidders) {
      bidIds.push(expectOk(await editions.bid(bidder, edition, 100, 2)).bidId);
    }
    for (const index of [0, 1]) {
      expectOk(
        await editions.raise(
          bidders[index] ?? A,
          edition,
          bidIds[index] ?? 0,
          101
        )
      );
    }
    const live = await stream.dataSource.getEditionAuction(edition);
    expect([
      live?.clearing.count,
      live?.clearing.step,
      live?.clearing.rationed,
      live?.clearing.cutUnits,
    ]).toEqual([10, 100, true, 6]);
    stream.dev.advance(
      (live?.times.endTime ?? 0) - stream.dataSource.now() + 1
    );

    const full = await stream.dataSource.settlementOrderFor(edition, A);
    expect(full).toEqual([0, 1]);
    // An order out of position order cannot sweep.
    expectRevert(
      await editions.settle(A, edition, [1, 0]),
      "InvalidSettlementOrder"
    );
    // A clears and sweeps only its first departure.
    expect(expectOk(await editions.settle(A, edition, [0]))).toEqual({
      settled: false,
    });
    expect(await stream.dataSource.sweepOf(edition, A)).toEqual({
      swept: 1,
      nextPosition: 1,
      cutoff: 8,
    });
    expect(await stream.dataSource.settlementOrderFor(edition, A)).toEqual([1]);
    const pending = await stream.dataSource.getEditionAuction(edition);
    expect([pending?.status, pending?.settlement?.departuresSwept]).toEqual([
      "SETTLING",
      0,
    ]);
    // B has no progress: its order is the whole sweep, and it finishes first.
    expect(await stream.dataSource.sweepOf(edition, B)).toEqual({
      swept: 0,
      nextPosition: 0,
      cutoff: 0,
    });
    const orderB = await stream.dataSource.settlementOrderFor(edition, B);
    expect(orderB).toEqual(full);
    expect(expectOk(await editions.settle(B, edition, orderB))).toEqual({
      settled: true,
    });
    const settled = await stream.dataSource.getEditionAuction(edition);
    expect(settled?.status).toBe("SETTLED");
    expect(settled?.settlement).toEqual(
      expect.objectContaining({ cutUnits: 6, cutoff: 10, departuresSwept: 2 })
    );
    expect(settled?.settlement?.cutoff).toBe(live?.clearing.cutoff);
    // A's rest is moot now: settling a SETTLED sale returns true.
    expect(expectOk(await editions.settle(A, edition, [1]))).toEqual({
      settled: true,
    });
    expect(await stream.dataSource.settlementOrderFor(edition, A)).toEqual([]);
  });
});

describe("edition auction reads added for the bidding panel", () => {
  it("logs bids with the end they leave, and marks soft-close extensions", async () => {
    const stream = world();
    const { edition } = await masterTitled(stream, "Quiet Engine");
    const auction = await stream.dataSource.getEditionAuction(edition);
    const editions = stream.actions.sale("UNIFORM_AUCTION");
    expectOk(await editions.bid(A, edition, 100, 1));
    stream.dev.advance(
      (auction?.times.endTime ?? 0) - stream.dataSource.now() - 60
    );
    expectOk(await editions.bid(B, edition, 100, 2));
    const bids = (await stream.dataSource.editionActivity(edition)).filter(
      (event) => event.kind === "bid"
    );
    expect(bids.slice(-2).map((event) => event.extended)).toEqual([
      false,
      true,
    ]);
    expect(bids.at(-1)).toEqual(
      expect.objectContaining({
        bidder: B,
        quantity: 2,
        endTime: stream.dataSource.now() + 5 * 60,
      })
    );
  });

  it("quotes a raise exactly as the raise then clears", async () => {
    const stream = world();
    const { edition } = await masterTitled(stream, "Fold Study 7");
    const out = (await stream.dataSource.editionBids(edition, B)).find(
      (bid) => bid.status === "out"
    );
    const target = out?.raiseToGetIn ?? null;
    expect(target).not.toBeNull();
    const quote = await stream.dataSource.quoteEditionRaise(
      edition,
      out?.bidId ?? 0,
      target ?? 0
    );
    expect(quote?.unitsWon).toBe(out?.quantity);
    expectOk(
      await stream.actions
        .sale("UNIFORM_AUCTION")
        .raise(B, edition, out?.bidId ?? 0, target ?? 0)
    );
    const after = await stream.dataSource.getEditionAuction(edition);
    expect([after?.clearing.count, after?.clearing.step]).toEqual([
      quote?.result.count,
      quote?.result.step,
    ]);
    const raised = (await stream.dataSource.editionActivity(edition)).at(-1);
    expect(raised).toEqual(
      expect.objectContaining({ kind: "raised", paid: quote?.escrow })
    );
    expect(
      await stream.dataSource.quoteEditionRaise(edition, out?.bidId ?? 0, 0)
    ).toBeNull();
  });

  it("records dispute withdrawals and the void after a cancel", async () => {
    const stream = world();
    const glass = await masterTitled(stream, "Glass Orchard");
    const [mine] = await stream.dataSource.editionBids(glass.edition, A);
    expectOk(
      await stream.actions
        .sale("UNIFORM_AUCTION")
        .withdraw(A, glass.edition, mine?.bidId ?? 0)
    );
    expect(
      (await stream.dataSource.editionActivity(glass.edition)).at(-1)
    ).toEqual(
      expect.objectContaining({
        kind: "withdrawn",
        bidder: A,
        amount: mine?.escrow,
      })
    );
    // Its master is burned, so it is listed by its edition auction.
    let voidedEdition = "";
    for (const auction of await stream.dataSource.listEditionAuctions()) {
      const master = await stream.dataSource.getWork(auction.master ?? "");
      if (master?.title === "Withdrawn Light") {
        voidedEdition = auction.edition;
      }
    }
    const voided = await stream.dataSource.getEditionAuction(voidedEdition);
    expect([voided?.status, voided?.settlement]).toEqual(["VOID", null]);
    expect(
      (await stream.dataSource.editionActivity(voidedEdition)).map(
        (event) => event.kind
      )
    ).toContain("voided");
  });

  it("simulates other bidders near the price (mock only)", async () => {
    const stream = world();
    const { edition } = await masterTitled(stream, "Quiet Engine");
    const before = await stream.dataSource.getEditionAuction(edition);
    expectOk(stream.dev.simulateEditionBids(edition, 10));
    const after = await stream.dataSource.getEditionAuction(edition);
    expect((after?.bidCount ?? 0) - (before?.bidCount ?? 0)).toBe(10);
    expect(await stream.dataSource.editionHolders(edition)).toEqual([]);
  });
});
