import {
  getSignOutAllState,
  noteSignOutAllFinished,
  noteSignOutAllStarted,
} from "@/services/auth/sign-out-all-state";

describe("sign-out-all state", () => {
  it("stays running until every overlapping run has finished", () => {
    const before = getSignOutAllState().started;

    noteSignOutAllStarted();
    noteSignOutAllStarted();
    // The first run ends (for example in a provider that remounted).
    noteSignOutAllFinished();
    expect(getSignOutAllState()).toEqual({
      started: before + 2,
      running: true,
    });

    noteSignOutAllFinished();
    expect(getSignOutAllState()).toEqual({
      started: before + 2,
      running: false,
    });
  });

  it("never counts below zero", () => {
    noteSignOutAllFinished();
    noteSignOutAllStarted();
    expect(getSignOutAllState().running).toBe(true);
    noteSignOutAllFinished();
    expect(getSignOutAllState().running).toBe(false);
  });
});
