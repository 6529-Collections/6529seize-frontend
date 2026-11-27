import {
  AUCTION_STATE,
  EDITION_STATUS,
  editionView,
  oneOfOneView,
  type EditionInput,
  type OneOfOneInput,
} from "@/lib/stream/state";

const ZERO = "0x0000000000000000000000000000000000000000" as const;
const ALICE = "0x00000000000000000000000000000000000a11ce" as const;
const BOB = "0x0000000000000000000000000000000000000b0b" as const;
const NOW = 1_800_000_000;

function one(overrides: Partial<OneOfOneInput> = {}): OneOfOneInput {
  return {
    state: AUCTION_STATE.ACTIVE,
    bidder: ZERO,
    bid: 0n,
    endTime: BigInt(NOW + 3_600),
    pausedAt: 0n,
    restartedAt: 0n,
    now: NOW,
    extensionWindow: 900,
    restartDelay: 900,
    independent: false,
    contractPaused: false,
    pendingDelivery: ZERO,
    refusableAt: 0n,
    viewer: undefined,
    ...overrides,
  };
}

describe("oneOfOneView", () => {
  it("shows a sale that has not started", () => {
    const view = oneOfOneView(one({ state: AUCTION_STATE.NONE }));
    expect(view.screen).toBe("not_started");
    expect(view.canBid).toBe(false);
  });

  it("is live with time left and lets anyone bid", () => {
    const view = oneOfOneView(one());
    expect(view.screen).toBe("live");
    expect(view.canBid).toBe(true);
    expect(view.secondsLeft).toBe(3_600);
    expect(view.hasBid).toBe(false);
  });

  it("enters the closing minutes inside the extension window", () => {
    const view = oneOfOneView(one({ endTime: BigInt(NOW + 600) }));
    expect(view.screen).toBe("closing");
    expect(view.canBid).toBe(true);
  });

  it("knows when the viewer holds the top bid", () => {
    const view = oneOfOneView(one({ bidder: ALICE, bid: 5n, viewer: ALICE }));
    expect(view.viewerLeads).toBe(true);
    expect(oneOfOneView(one({ bidder: ALICE, bid: 5n, viewer: BOB })).viewerLeads).toBe(false);
  });

  it("treats an ACTIVE read past its end as ended and settleable", () => {
    const view = oneOfOneView(one({ endTime: BigInt(NOW - 1) }));
    expect(view.screen).toBe("ended");
    expect(view.canSettle).toBe(true);
    expect(view.canBid).toBe(false);
  });

  it("lets anyone settle an ended sale", () => {
    const view = oneOfOneView(one({ state: AUCTION_STATE.ENDED, endTime: BigInt(NOW - 10) }));
    expect(view.screen).toBe("ended");
    expect(view.canSettle).toBe(true);
    expect(view.canSettleOrRefund).toBe(false);
  });

  it("offers settle-or-refund on an Independent Stream sale after its refusal time", () => {
    const view = oneOfOneView(
      one({
        state: AUCTION_STATE.ENDED,
        independent: true,
        refusableAt: BigInt(NOW - 1),
        endTime: BigInt(NOW - 200_000),
      })
    );
    expect(view.canSettleOrRefund).toBe(true);
  });

  it("shows a sold work", () => {
    const view = oneOfOneView(
      one({ state: AUCTION_STATE.SETTLED, bidder: ALICE, bid: 10n, endTime: BigInt(NOW - 10) })
    );
    expect(view.screen).toBe("sold");
  });

  it("sends an unsold curated work to the museum, never restartable", () => {
    const view = oneOfOneView(one({ state: AUCTION_STATE.SETTLED, endTime: BigInt(NOW - 5_000) }));
    expect(view.screen).toBe("unsold_museum");
    expect(view.canRestart).toBe(false);
  });

  it("waits out the restart delay for an unsold Independent Stream work", () => {
    const view = oneOfOneView(
      one({ state: AUCTION_STATE.SETTLED, independent: true, endTime: BigInt(NOW - 300) })
    );
    expect(view.screen).toBe("unsold_waiting");
    expect(view.canRestart).toBe(false);
    expect(view.restartAt).toBe(NOW - 300 + 900);
  });

  it("lets anyone offer an unsold Independent Stream work again after the delay", () => {
    const view = oneOfOneView(
      one({ state: AUCTION_STATE.SETTLED, independent: true, endTime: BigInt(NOW - 901) })
    );
    expect(view.screen).toBe("unsold_restartable");
    expect(view.canRestart).toBe(true);
  });

  it("shows a paused sale and lets only the top bidder withdraw", () => {
    const paused = one({ state: AUCTION_STATE.PAUSED, bidder: ALICE, bid: 1n, pausedAt: BigInt(NOW - 60) });
    expect(oneOfOneView({ ...paused, viewer: ALICE })).toMatchObject({
      screen: "paused",
      canWithdrawBid: true,
      canBid: false,
    });
    expect(oneOfOneView({ ...paused, viewer: BOB }).canWithdrawBid).toBe(false);
  });

  it("shows a cancelled sale", () => {
    expect(oneOfOneView(one({ state: AUCTION_STATE.CANCELLED })).screen).toBe("cancelled");
  });

  it("offers the pending delivery only to its recipient", () => {
    const sold = one({
      state: AUCTION_STATE.SETTLED,
      bidder: ALICE,
      bid: 1n,
      pendingDelivery: ALICE,
      endTime: BigInt(NOW - 10),
    });
    expect(oneOfOneView({ ...sold, viewer: ALICE }).canClaimDelivery).toBe(true);
    expect(oneOfOneView({ ...sold, viewer: BOB }).canClaimDelivery).toBe(false);
  });

  it("disables every action while the auction contract is paused", () => {
    const view = oneOfOneView(one({ contractPaused: true }));
    expect(view.halted).toBe(true);
    expect(view.canBid).toBe(false);
    const ended = oneOfOneView(one({ state: AUCTION_STATE.ENDED, contractPaused: true }));
    expect(ended.canSettle).toBe(false);
  });
});

function edition(overrides: Partial<EditionInput> = {}): EditionInput {
  return {
    status: EDITION_STATUS.OPEN,
    bidCount: 0,
    endTime: BigInt(NOW + 4_500),
    biddingOpen: true,
    oneOfOneState: AUCTION_STATE.ACTIVE,
    now: NOW,
    softWindow: 300,
    contractPaused: false,
    abandonable: false,
    masterOpenForEditions: false,
    ...overrides,
  };
}

describe("editionView", () => {
  it("is not shown when there is no sale and none can be opened", () => {
    expect(editionView(edition({ status: EDITION_STATUS.NONE })).screen).toBe("not_open");
  });

  it("lets anyone open a sale beside a running edition master", () => {
    const view = editionView(edition({ status: EDITION_STATUS.NONE, masterOpenForEditions: true }));
    expect(view.screen).toBe("openable");
    expect(view.canOpen).toBe(true);
  });

  it("takes bids while open", () => {
    const view = editionView(edition());
    expect(view.screen).toBe("open");
    expect(view.canBid).toBe(true);
  });

  it("enters the last minutes inside the soft-close window", () => {
    expect(editionView(edition({ endTime: BigInt(NOW + 120) })).screen).toBe("closing");
  });

  it("closes when bidding is no longer open, and waits for the 1/1 to settle", () => {
    const view = editionView(edition({ biddingOpen: false, endTime: BigInt(NOW - 1) }));
    expect(view.screen).toBe("closed");
    expect(view.canSettle).toBe(false);
  });

  it("settles once the 1/1 it was opened beside is settled", () => {
    const view = editionView(
      edition({ status: EDITION_STATUS.CLOSED, oneOfOneState: AUCTION_STATE.SETTLED })
    );
    expect(view.canSettle).toBe(true);
  });

  it("settles after a cancelled 1/1", () => {
    const view = editionView(
      edition({ status: EDITION_STATUS.CLOSED, oneOfOneState: AUCTION_STATE.CANCELLED })
    );
    expect(view.canSettle).toBe(true);
  });

  it("continues a settlement that is under way", () => {
    const view = editionView(edition({ status: EDITION_STATUS.SETTLING }));
    expect(view.screen).toBe("settling");
    expect(view.canSettle).toBe(true);
  });

  it("opens claims after settlement and on a voided sale", () => {
    expect(editionView(edition({ status: EDITION_STATUS.SETTLED }))).toMatchObject({
      screen: "settled",
      canClaim: true,
    });
    expect(editionView(edition({ status: EDITION_STATUS.VOID }))).toMatchObject({
      screen: "void",
      canClaim: true,
    });
  });

  it("offers abandon when the contract says it is abandonable", () => {
    expect(editionView(edition({ status: EDITION_STATUS.CLOSED, abandonable: true })).canAbandon).toBe(true);
  });

  it("disables actions while the edition auction is paused", () => {
    const view = editionView(edition({ contractPaused: true }));
    expect(view.canBid).toBe(false);
    expect(view.halted).toBe(true);
  });
});
