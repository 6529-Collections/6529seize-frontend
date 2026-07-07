import { buildJoinJourneyProgress } from "@/app/join/journeyProgress";
import { TIMELINE_ITEM_SPECS, TIMELINE_ORDER } from "@/app/join/page.content";

describe("Join 6529 journey progress", () => {
  it("keeps the timeline order derived from the rendered item specs", () => {
    expect(TIMELINE_ORDER).toEqual(TIMELINE_ITEM_SPECS.map((item) => item.id));
  });

  it("keeps progress hidden and neutral before a wallet is connected", () => {
    const progress = buildJoinJourneyProgress("loggedOut");

    expect(progress.visible).toBe(false);
    expect(progress.completed).toBe(0);
    expect(progress.currentStepId).toBe("wallet");
    expect(progress.percent).toBe(0);
    expect(progress.statuses.wallet).toBe("current");
    expect(progress.statuses.profile).toBe("pending");
  });

  it("marks profile as current after wallet connection", () => {
    const progress = buildJoinJourneyProgress("inProgress");

    expect(progress.visible).toBe(true);
    expect(progress.completed).toBe(1);
    expect(progress.currentStepId).toBe("profile");
    expect(progress.statuses.wallet).toBe("complete");
    expect(progress.statuses.profile).toBe("current");
    expect(progress.statuses.waves).toBe("pending");
  });

  it("marks the starter path complete for logged-in members", () => {
    const progress = buildJoinJourneyProgress("loggedIn");

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
});
