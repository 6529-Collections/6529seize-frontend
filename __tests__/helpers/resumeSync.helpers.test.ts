import { shouldResyncOnResume } from "@/helpers/resumeSync.helpers";

describe("shouldResyncOnResume", () => {
  const lastSyncAt = 100_000;

  it("skips a focus soon after the last sync", () => {
    expect(
      shouldResyncOnResume({
        now: lastSyncAt + 59_999,
        hiddenSince: null,
        lastSyncAt,
      })
    ).toBe(false);
  });

  it("resyncs a minute after the last sync", () => {
    expect(
      shouldResyncOnResume({
        now: lastSyncAt + 60_000,
        hiddenSince: null,
        lastSyncAt,
      })
    ).toBe(true);
  });

  it("resyncs after the tab was hidden 30 seconds, however recent the last sync", () => {
    const now = lastSyncAt + 31_000;
    expect(
      shouldResyncOnResume({ now, hiddenSince: now - 30_000, lastSyncAt })
    ).toBe(true);
    expect(
      shouldResyncOnResume({ now, hiddenSince: now - 29_999, lastSyncAt })
    ).toBe(false);
  });
});
