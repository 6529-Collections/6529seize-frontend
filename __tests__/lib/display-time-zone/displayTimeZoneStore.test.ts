import {
  DISPLAY_TIME_ZONE_OVERRIDE_STORAGE_KEY,
  DISPLAY_TIME_ZONE_STORAGE_KEY,
  getDisplayTimeZoneSnapshot,
  resetDisplayTimeZoneSnapshotForTests,
  setDisplayTimeZoneOverride,
  setDisplayTimeZonePreference,
  subscribeToDisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZoneStore";

beforeEach(() => {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  resetDisplayTimeZoneSnapshotForTests();
});

describe("display time zone store", () => {
  it("defaults to the device zone with the switch off", () => {
    expect(getDisplayTimeZoneSnapshot()).toEqual({
      preference: "local",
      override: null,
    });
  });

  it("reads a saved setting and drops corrupt values", () => {
    globalThis.localStorage.setItem(DISPLAY_TIME_ZONE_STORAGE_KEY, "UTC");
    expect(getDisplayTimeZoneSnapshot().preference).toBe("UTC");

    resetDisplayTimeZoneSnapshotForTests();
    globalThis.localStorage.setItem(DISPLAY_TIME_ZONE_STORAGE_KEY, "Nowhere/x");
    expect(getDisplayTimeZoneSnapshot().preference).toBe("local");
  });

  it("saves the setting on this device and turns the switch off", () => {
    setDisplayTimeZoneOverride("UTC");
    expect(getDisplayTimeZoneSnapshot().override).toBe("UTC");

    setDisplayTimeZonePreference("Europe/Berlin");

    expect(globalThis.localStorage.getItem(DISPLAY_TIME_ZONE_STORAGE_KEY)).toBe(
      "Europe/Berlin"
    );
    expect(
      globalThis.sessionStorage.getItem(DISPLAY_TIME_ZONE_OVERRIDE_STORAGE_KEY)
    ).toBeNull();
    expect(getDisplayTimeZoneSnapshot()).toEqual({
      preference: "Europe/Berlin",
      override: null,
    });
  });

  it("keeps the switch in session storage for this tab only", () => {
    setDisplayTimeZoneOverride("UTC");
    expect(
      globalThis.sessionStorage.getItem(DISPLAY_TIME_ZONE_OVERRIDE_STORAGE_KEY)
    ).toBe("UTC");
    expect(
      globalThis.localStorage.getItem(DISPLAY_TIME_ZONE_STORAGE_KEY)
    ).toBeNull();

    setDisplayTimeZoneOverride(null);
    expect(getDisplayTimeZoneSnapshot().override).toBeNull();
    expect(
      globalThis.sessionStorage.getItem(DISPLAY_TIME_ZONE_OVERRIDE_STORAGE_KEY)
    ).toBeNull();
  });

  it("treats a switch equal to the setting as off", () => {
    setDisplayTimeZonePreference("UTC");
    setDisplayTimeZoneOverride("UTC");
    expect(getDisplayTimeZoneSnapshot().override).toBeNull();
  });

  it("notifies subscribers on changes and on other tabs' settings", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToDisplayTimeZone(listener);

    setDisplayTimeZoneOverride("UTC");
    expect(listener).toHaveBeenCalledTimes(1);

    globalThis.localStorage.setItem(
      DISPLAY_TIME_ZONE_STORAGE_KEY,
      "Asia/Tokyo"
    );
    globalThis.dispatchEvent(
      new StorageEvent("storage", { key: DISPLAY_TIME_ZONE_STORAGE_KEY })
    );
    expect(listener).toHaveBeenCalledTimes(2);
    expect(getDisplayTimeZoneSnapshot().preference).toBe("Asia/Tokyo");

    unsubscribe();
    setDisplayTimeZoneOverride(null);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("keeps working when storage throws", () => {
    const getItem = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const setItem = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    try {
      expect(getDisplayTimeZoneSnapshot().preference).toBe("local");
      setDisplayTimeZonePreference("UTC");
      expect(getDisplayTimeZoneSnapshot().preference).toBe("UTC");
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});
