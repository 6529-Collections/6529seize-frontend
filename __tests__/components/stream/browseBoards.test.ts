/** @jest-environment node */
import {
  productOf,
  readArtistBoard,
  readArtistsIndex,
} from "@/components/stream/artists/artistBoard";
import { readCurationBoard } from "@/components/stream/curation/curationBoard";
import {
  ENDING_SOON_SECONDS,
  endingSoon,
  readHomeBoard,
} from "@/components/stream/home/homeBoard";
import { readDashboard } from "@/components/stream/me/dashboardBoard";
import { readMuseumBoard } from "@/components/stream/museum/museumBoard";
import { CANONICAL_FEE_SHARE } from "@/lib/stream/constants";
import type { TxResult } from "@/lib/stream/dataSource";
import { parseEthToWei } from "@/lib/stream/eth";
import { createMockStream, MOCK_ACCOUNTS } from "@/lib/stream/mock";
import type { Address } from "@/lib/stream/types";

const A = MOCK_ACCOUNTS.collectorA;
const B = MOCK_ACCOUNTS.collectorB;

const eth = (text: string): bigint => parseEthToWei(text) ?? -1n;

/** A fresh seeded world on a frozen wall clock: only `advance` moves time. */
function world() {
  return createMockStream({ wallNow: () => 0 });
}

function expectOk<T>(result: TxResult<T>): T {
  if (!result.ok) {
    throw new Error(`tx failed: ${result.error.code}`);
  }
  return result.value;
}

function account(stream: ReturnType<typeof world>, role: string): Address {
  const found = stream.dev.accounts().find((entry) => entry.role === role);
  if (!found) {
    throw new Error(`no ${role} account`);
  }
  return found.address;
}

describe("the home board", () => {
  it("puts live works first, soonest close first, with both auctions", async () => {
    const stream = world();
    const board = await readHomeBoard(stream.dataSource);
    const titles = board.live.map((entry) => entry.work.title);
    expect(titles[0]).toBe("Fold Study 7");
    expect(titles).toEqual(
      expect.arrayContaining(["Quiet Engine", "Copper Rain", "Glass Orchard"])
    );
    // Federated works stay on their own pages.
    expect(
      board.live.every((entry) => entry.work.program === "canonical")
    ).toBe(true);
    const fold = board.live[0];
    expect(fold?.oneOfOne?.state).toBe("ACTIVE");
    expect(fold?.edition?.clearing.count).toBeGreaterThan(0);
    // A work paused for a dispute still shows: its editions take bids.
    const glass = board.live.find(
      (entry) => entry.work.title === "Glass Orchard"
    );
    expect(glass?.oneOfOne?.state).toBe("PAUSED");
    expect(glass?.edition?.phase).toBe("disputed");
  });

  it("lists closes within the hour, and settled results newest first", async () => {
    const stream = world();
    const now = stream.dataSource.now();
    const board = await readHomeBoard(stream.dataSource);
    const soon = endingSoon(board.live, now);
    expect(
      soon.map((close) => [close.sales.work.title, close.auction])
    ).toEqual([
      ["Fold Study 7", "oneOfOne"],
      ["Fold Study 7", "edition"],
    ]);
    expect(
      soon.every((close) => close.closesAt - now <= ENDING_SOON_SECONDS)
    ).toBe(true);
    const outcomes = Object.fromEntries(
      board.results.map((entry) => [
        entry.work.title,
        entry.oneOfOne?.settlement?.outcome,
      ])
    );
    expect(outcomes).toMatchObject({
      "Salt Meridian": "collector",
      "Lantern Field": "museum",
      "Withdrawn Light": "burned",
      "Open Ledger": "collector",
    });
    const atTimes = board.results.map(
      (entry) => entry.oneOfOne?.settlement?.at ?? 0
    );
    expect([...atTimes].sort((left, right) => right - left)).toEqual(atTimes);
  });
});

describe("the artist board", () => {
  it("totals settled sales per product with the 75/25 split", async () => {
    const stream = world();
    const index = await readArtistsIndex(stream.dataSource);
    const mara = index.find((row) => row.artist.displayName === "Mara Vell");
    if (!mara) {
      throw new Error("no Mara Vell");
    }
    const board = await readArtistBoard(
      stream.dataSource,
      mara.artist.artistId
    );
    const sold = board.works.filter((work) => work.money.raised > 0n);
    expect(sold.map((work) => work.sales.work.title).sort()).toEqual([
      "Ember Index",
      "Ember Index",
      "Salt Meridian",
    ]);
    const all = board.totals.all.money;
    expect(all.raised).toBe(
      board.totals.stream.money.raised + board.totals.editions.money.raised
    );
    expect(board.totals.stream.money.raised).toBe(eth("1.6"));
    expect(all.network).toBe(
      (all.raised * BigInt(CANONICAL_FEE_SHARE)) / 100_000n
    );
    expect(all.artistSide + all.network).toBe(all.raised);
    // Her split wallets: her own, and the one she shares on Copper Rain.
    expect(board.wallets.map((wallet) => wallet.payeeNames)).toEqual(
      expect.arrayContaining([["Mara Vell"], ["Mara Vell", "Ines Quarry"]])
    );
  });

  it("groups federated works under their own product", async () => {
    const stream = world();
    const index = await readArtistsIndex(stream.dataSource);
    const juno = index.find((row) => row.artist.displayName === "Juno Halden");
    expect(juno?.totals.federated.works).toBeGreaterThan(0);
    expect(juno?.totals.stream.works).toBe(0);
    expect(productOf("federated-pair-edition")).toBe("federated");
  });
});

describe("the dashboard", () => {
  it("shows a collector's live bids, claims and owned works", async () => {
    const stream = world();
    const dashboard = await readDashboard(stream.dataSource, A);
    const bids = dashboard.bids.map((row) => [
      row.work.title,
      row.kind,
      row.kind === "oneOfOne" ? row.bid.leading : row.bid.status,
    ]);
    expect(bids).toEqual(
      expect.arrayContaining([
        ["Fold Study 7", "oneOfOne", true],
        ["Quiet Engine", "oneOfOne", true],
      ])
    );
    const editionStatuses = new Set(
      dashboard.bids.flatMap((row) =>
        row.kind === "edition" ? [row.bid.status] : []
      )
    );
    expect(editionStatuses.size).toBeGreaterThan(0);
    // An out or partly-in bid offers the raise that gets every unit in.
    for (const row of dashboard.bids) {
      if (
        row.kind === "edition" &&
        row.bid.status !== "in" &&
        row.auction.biddingOpen
      ) {
        expect(row.raisePrice).not.toBeNull();
      }
    }
    expect(dashboard.claims.map((claim) => claim.item.kind)).toContain(
      "auction-credit"
    );
    expect(dashboard.holdings.map((holding) => holding.work.title)).toContain(
      "Salt Meridian"
    );
  });

  it("lists a pending delivery and settled edition claims", async () => {
    const stream = world();
    const dashboard = await readDashboard(stream.dataSource, B);
    const kinds = dashboard.claims.map((claim) => [
      claim.item.kind,
      claim.work?.title ?? null,
    ]);
    expect(kinds).toEqual(
      expect.arrayContaining([
        ["pending-delivery", "Ember Index"],
        ["edition-bid", "Withdrawn Light"],
      ])
    );
  });

  it("releases an artist's payout and moves royalties into the split wallet", async () => {
    const stream = world();
    const artist = account(stream, "artist");
    const before = await readDashboard(stream.dataSource, artist);
    const seller = before.wallets.find(
      (row) => row.kind === "seller" && row.releasable > 0n
    );
    const royalty = before.wallets.find((row) => row.kind === "royalty");
    if (!seller || !royalty) {
      throw new Error("expected a seller wallet and a royalty wallet");
    }
    expect(royalty.releasable).toBe(
      (eth("0.07835") * BigInt(royalty.share)) / 100_000n
    );
    expectOk(
      await stream.actions.releaseSplit(
        artist,
        royalty.wallet.address,
        royalty.payeeIndex
      )
    );
    const moved = await readDashboard(stream.dataSource, artist);
    const sameSeller = moved.wallets.find(
      (row) =>
        row.kind === "seller" &&
        row.wallet.address ===
          royalty.wallet.payees[royalty.payeeIndex]?.account
    );
    expect(sameSeller?.wallet.received).toBeGreaterThan(0n);
    expectOk(
      await stream.actions.releaseSplit(
        artist,
        seller.wallet.address,
        seller.payeeIndex
      )
    );
    const after = await readDashboard(stream.dataSource, artist);
    expect(
      after.wallets.find(
        (row) =>
          row.kind === "seller" && row.wallet.address === seller.wallet.address
      )?.releasable
    ).toBe(0n);
  });

  it("is empty for an account with no activity", async () => {
    const stream = world();
    const dashboard = await readDashboard(
      stream.dataSource,
      account(stream, "guardian")
    );
    expect(dashboard.bids).toEqual([]);
    expect(dashboard.claims).toEqual([]);
    expect(dashboard.holdings).toEqual([]);
    expect(dashboard.wallets).toEqual([]);
  });
});

describe("the museum board", () => {
  it("holds unbid 6529 Stream works and lists the ones on the way", async () => {
    const stream = world();
    const board = await readMuseumBoard(stream.dataSource);
    expect(board.address).toBe(stream.dataSource.source().contracts.museum);
    expect(
      board.holdings.map((row) => [row.work?.title, row.holding.reason])
    ).toEqual([["Lantern Field", "no-bids"]]);
    expect(board.incoming.map((row) => row.work.title)).toEqual(["Night Tide"]);
    const night = board.incoming[0];
    expectOk(
      await stream.actions
        .sale("ENGLISH_AUCTION")
        .settle(A, night?.auction.saleId ?? "")
    );
    const after = await readMuseumBoard(stream.dataSource);
    expect(after.incoming).toEqual([]);
    expect(after.holdings.map((row) => row.work?.title)).toEqual([
      "Night Tide",
      "Lantern Field",
    ]);
  });

  it("keeps an unbid federated work out of the museum", async () => {
    const stream = world();
    const board = await readMuseumBoard(stream.dataSource);
    expect(
      board.holdings.every((row) => row.work?.program === "canonical")
    ).toBe(true);
  });
});

describe("the curation board", () => {
  it("shows every item state and the attested vote record", async () => {
    const stream = world();
    const board = await readCurationBoard(stream.dataSource);
    expect(board.rows.map((row) => [row.item.title, row.state])).toEqual([
      ["Low Water", "ready"],
      ["Salt Lines", "move"],
      ["Quarry Song", "signatures"],
      ["Harbor Glass", "revoked"],
    ]);
    expect(board.packages.map((pkg) => pkg.status)).toEqual([
      "REGISTERED",
      "REGISTERED",
      "REVOKED",
    ]);
    expect(
      board.packages.every(
        (pkg) => pkg.voteRecord?.kind === "CURATION_EVIDENCE"
      )
    ).toBe(true);
  });

  it("starts a ready item and links the minted work", async () => {
    const stream = world();
    const before = await readCurationBoard(stream.dataSource);
    const ready = before.rows.find((row) => row.state === "ready");
    const key = expectOk(
      await stream.actions.startAuction(A, ready?.item.itemHash ?? "0x")
    );
    const after = await readCurationBoard(stream.dataSource);
    const started = after.rows.find(
      (row) => row.item.itemHash === ready?.item.itemHash
    );
    expect(started?.state).toBe("started");
    expect(started?.work).toBe(key);
  });
});
