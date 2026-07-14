import { buildJoinJourneyProgress } from "@/app/join/journeyProgress";
import { TIMELINE_ITEM_SPECS, TIMELINE_ORDER } from "@/app/join/page.content";

const NO_OPTIONAL_FACTS = {
  hasCollected: false,
  hasParticipated: false,
} as const;

describe("Join 6529 journey progress", () => {
  it("keeps the timeline order derived from the rendered item specs", () => {
    expect(TIMELINE_ORDER).toEqual(TIMELINE_ITEM_SPECS.map((item) => item.id));
  });

  it("keeps progress hidden and neutral before a wallet is connected", () => {
    const progress = buildJoinJourneyProgress("loggedOut", NO_OPTIONAL_FACTS);

    expect(progress.visible).toBe(false);
    expect(progress.completed).toBe(0);
    expect(progress.currentStepId).toBe("wallet");
    expect(progress.percent).toBe(0);
    expect(progress.statuses.wallet).toBe("current");
    expect(progress.statuses.profile).toBe("pending");
  });

  it("marks profile as current after wallet connection", () => {
    const progress = buildJoinJourneyProgress("inProgress", NO_OPTIONAL_FACTS);

    expect(progress.visible).toBe(true);
    expect(progress.completed).toBe(1);
    expect(progress.currentStepId).toBe("profile");
    expect(progress.statuses.wallet).toBe("complete");
    expect(progress.statuses.profile).toBe("current");
    expect(progress.statuses.waves).toBe("pending");
  });

  it("marks the starter path complete for logged-in members", () => {
    const progress = buildJoinJourneyProgress("loggedIn", NO_OPTIONAL_FACTS);

    expect(progress.visible).toBe(true);
    expect(progress.completed).toBe(3);
    expect(progress.currentStepId).toBeNull();
    expect(progress.percent).toBe(60);
    expect(progress.statuses.wallet).toBe("complete");
    expect(progress.statuses.profile).toBe("complete");
    expect(progress.statuses.waves).toBe("complete");
    expect(progress.statuses.message).toBe("pending");
    expect(progress.statuses.collect).toBe("pending");
  });

  it("marks participation complete when public drop activity exists", () => {
    const progress = buildJoinJourneyProgress("loggedIn", {
      hasCollected: false,
      hasParticipated: true,
    });

    expect(progress.completed).toBe(4);
    expect(progress.percent).toBe(80);
    expect(progress.statuses.message).toBe("complete");
    expect(progress.statuses.collect).toBe("pending");
  });

  it("marks collection complete when a supported NFT balance exists", () => {
    const progress = buildJoinJourneyProgress("loggedIn", {
      hasCollected: true,
      hasParticipated: false,
    });

    expect(progress.completed).toBe(4);
    expect(progress.percent).toBe(80);
    expect(progress.statuses.message).toBe("pending");
    expect(progress.statuses.collect).toBe("complete");
  });

  it("marks all five steps complete when both optional facts exist", () => {
    const progress = buildJoinJourneyProgress("loggedIn", {
      hasCollected: true,
      hasParticipated: true,
    });

    expect(progress.completed).toBe(5);
    expect(progress.percent).toBe(100);
    expect(progress.statuses.message).toBe("complete");
    expect(progress.statuses.collect).toBe("complete");
  });
});
