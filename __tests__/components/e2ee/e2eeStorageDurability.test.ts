import {
  E2EE_CLEAR_ON_EXIT_MIN_DEVICES,
  E2EE_CLEAR_ON_EXIT_UNSEEN_MS,
  E2EE_CLEAR_ON_EXIT_WINDOW_MS,
  type E2eeDeviceTrace,
  looksLikeClearOnExitBrowser,
  requestE2eePersistentStorage,
} from "@/components/e2ee/gate/e2eeStorageDurability";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 31, 12);
const LABEL = "Chrome on Windows";

/** A device this browser registered `daysAgo` and last used `seenDaysAgo`. */
const visit = (
  daysAgo: number,
  seenDaysAgo: number | null = daysAgo,
  label = LABEL
): E2eeDeviceTrace => ({
  label,
  created_at: NOW - daysAgo * DAY,
  last_seen_at: seenDaysAgo === null ? null : NOW - seenDaysAgo * DAY,
});

const looksWiped = (devices: E2eeDeviceTrace[], label = LABEL) =>
  looksLikeClearOnExitBrowser({ devices, label, now: NOW });

describe("looksLikeClearOnExitBrowser", () => {
  it("uses the documented thresholds", () => {
    expect(E2EE_CLEAR_ON_EXIT_WINDOW_MS).toBe(30 * DAY);
    expect(E2EE_CLEAR_ON_EXIT_MIN_DEVICES).toBe(2);
    expect(E2EE_CLEAR_ON_EXIT_UNSEEN_MS).toBe(DAY);
  });

  it("flags two recent, abandoned devices with this browser's name", () => {
    expect(looksWiped([visit(3), visit(10)])).toBe(true);
    // Never seen after registering: the registration time counts.
    expect(looksWiped([visit(2, null), visit(5, null)])).toBe(true);
    // Names match regardless of case and surrounding spaces.
    expect(
      looksWiped([visit(2, 2, " chrome on windows "), visit(9)], LABEL)
    ).toBe(true);
  });

  it("does not flag a single earlier device", () => {
    expect(looksWiped([visit(3)])).toBe(false);
  });

  it("ignores devices used within the last day", () => {
    expect(looksWiped([visit(3, 0.5), visit(10)])).toBe(false);
    expect(looksWiped([visit(3, 0), visit(10, 0)])).toBe(false);
  });

  it("ignores devices registered more than 30 days ago", () => {
    expect(looksWiped([visit(31), visit(45)])).toBe(false);
    expect(looksWiped([visit(31), visit(4)])).toBe(false);
  });

  it("ignores devices of other browsers or apps", () => {
    expect(
      looksWiped([visit(3, 3, "Firefox on Windows"), visit(10, 10, "Chrome")])
    ).toBe(false);
    expect(
      looksWiped([visit(3, 3, "6529 app on iPhone"), visit(10)], LABEL)
    ).toBe(false);
  });

  it("does not flag a profile without devices or without a name to match", () => {
    expect(looksWiped([])).toBe(false);
    expect(looksWiped([visit(3, 3, ""), visit(9, 9, "")], "  ")).toBe(false);
  });
});

describe("requestE2eePersistentStorage", () => {
  it("asks synchronously, then records persisted()", async () => {
    const calls: string[] = [];
    const storage = {
      persist: jest.fn(() => {
        calls.push("persist");
        return Promise.resolve(true);
      }),
      persisted: jest.fn(() => {
        calls.push("persisted");
        return Promise.resolve(true);
      }),
    };
    const result = requestE2eePersistentStorage(storage);
    // persist() runs before the first await, i.e. inside the gesture.
    expect(calls).toEqual(["persist"]);
    await expect(result).resolves.toBe("persisted");
    expect(calls).toEqual(["persist", "persisted"]);
  });

  it("reports storage the browser did not agree to keep", async () => {
    await expect(
      requestE2eePersistentStorage({
        persist: () => Promise.resolve(false),
        persisted: () => Promise.resolve(false),
      })
    ).resolves.toBe("not-persisted");
  });

  it("trusts persisted() over persist()'s answer", async () => {
    await expect(
      requestE2eePersistentStorage({
        persist: () => Promise.resolve(false),
        persisted: () => Promise.resolve(true),
      })
    ).resolves.toBe("persisted");
  });

  it("treats a missing or failing Storage API as unsupported", async () => {
    await expect(requestE2eePersistentStorage(undefined)).resolves.toBe(
      "unsupported"
    );
    await expect(
      requestE2eePersistentStorage({ persisted: () => Promise.resolve(true) })
    ).resolves.toBe("unsupported");
    await expect(
      requestE2eePersistentStorage({
        persist: () => Promise.reject(new Error("denied")),
        persisted: () => Promise.resolve(false),
      })
    ).resolves.toBe("unsupported");
    await expect(
      requestE2eePersistentStorage({
        persist: () => {
          throw new Error("sync failure");
        },
        persisted: () => Promise.resolve(false),
      })
    ).resolves.toBe("unsupported");
  });
});
