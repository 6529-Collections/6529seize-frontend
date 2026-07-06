import type { ApiOwnerBalanceMemes } from "@/generated/models/ApiOwnerBalanceMemes";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";

import {
  TIMELINE_ITEM_SPECS,
  TIMELINE_ORDER,
  type TimelineStepId,
} from "@/app/join/page.content";
import {
  buildTimelineProgress,
  hasActiveMemeSubscription,
  hasMemeCardBalance,
} from "@/app/join/journeyProgress";

const emptyCompletion: Readonly<Record<TimelineStepId, boolean>> = {
  collect: false,
  message: false,
  profile: false,
  subscribe: false,
  wallet: false,
  waves: false,
};

const memeBalance = (
  overrides: Partial<Pick<ApiOwnerBalanceMemes, "balance" | "sets" | "unique">>
): ApiOwnerBalanceMemes => ({
  balance: 0,
  boosted_tdh: 0,
  consolidation_key: "wallet",
  created_at: new Date(0),
  rank: 0,
  season: 1,
  sets: 0,
  unique: 0,
  updated_at: new Date(0),
  ...overrides,
});

const subscription = (
  overrides: Partial<Pick<NFTSubscription, "subscribed" | "subscribed_count">>
): NFTSubscription => ({
  consolidation_key: "wallet",
  contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
  subscribed: false,
  subscribed_count: 0,
  token_id: 1,
  ...overrides,
});

describe("Join 6529 journey progress", () => {
  it("keeps the timeline order derived from the rendered item specs", () => {
    expect(TIMELINE_ORDER).toEqual(TIMELINE_ITEM_SPECS.map((item) => item.id));
  });

  it("marks the first incomplete step as current", () => {
    const progress = buildTimelineProgress({
      completed: {
        ...emptyCompletion,
        profile: true,
        wallet: true,
        waves: true,
      },
      visible: true,
    });

    expect(progress.completed).toBe(3);
    expect(progress.percent).toBe(50);
    expect(progress.statuses.wallet).toBe("complete");
    expect(progress.statuses.message).toBe("current");
    expect(progress.statuses.collect).toBe("pending");
  });

  it("detects Meme Card ownership across balance fields", () => {
    expect(hasMemeCardBalance([])).toBe(false);
    expect(hasMemeCardBalance([memeBalance({ balance: 1 })])).toBe(true);
    expect(hasMemeCardBalance([memeBalance({ unique: 1 })])).toBe(true);
    expect(hasMemeCardBalance([memeBalance({ sets: 1 })])).toBe(true);
  });

  it("detects active Meme Card subscriptions", () => {
    expect(hasActiveMemeSubscription([])).toBe(false);
    expect(
      hasActiveMemeSubscription([subscription({ subscribed: true })])
    ).toBe(true);
    expect(
      hasActiveMemeSubscription([subscription({ subscribed_count: 1 })])
    ).toBe(true);
  });
});
