import { renderHook } from "@testing-library/react";
import { useE2eeNewDevices } from "@/components/e2ee/devices/useE2eeNewDevices";
import { writeKnownE2eeDevices } from "@/components/e2ee/e2eeLocalState";
import type { E2eeDeviceInfo } from "@/lib/e2ee/types";

const PROFILE_ID = "profile-1";
const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 9, 12, 0);

const device = (
  deviceKey: string,
  patch: Partial<E2eeDeviceInfo> = {}
): E2eeDeviceInfo => ({
  deviceKey,
  label: "Brave on Windows",
  platform: "web",
  createdAt: NOW - DAY_MS,
  lastSeenAt: NOW - DAY_MS,
  expiresAt: NOW + 180 * DAY_MS,
  revokedAt: null,
  isThisDevice: false,
  verified: true,
  ...patch,
});

describe("useE2eeNewDevices", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("never announces a device set up before this one", () => {
    const thisDevice = device("this", {
      isThisDevice: true,
      createdAt: NOW - DAY_MS,
    });
    // An earlier setup of this browser, found again after a storage wipe.
    const earlierSetup = device("earlier", { createdAt: NOW - 2 * DAY_MS });
    writeKnownE2eeDevices(PROFILE_ID, ["this"]);

    const { result } = renderHook(() =>
      useE2eeNewDevices(PROFILE_ID, [thisDevice, earlierSetup], true)
    );

    expect(result.current.newDevices).toEqual([]);
  });

  it("announces an unknown device set up after this one", () => {
    const thisDevice = device("this", {
      isThisDevice: true,
      createdAt: NOW - 2 * DAY_MS,
    });
    const phone = device("phone", {
      label: "6529 app on iPhone",
      platform: "phone",
      createdAt: NOW - DAY_MS,
    });
    writeKnownE2eeDevices(PROFILE_ID, ["this"]);

    const { result } = renderHook(() =>
      useE2eeNewDevices(PROFILE_ID, [thisDevice, phone], true)
    );

    expect(result.current.newDevices.map(({ deviceKey }) => deviceKey)).toEqual(
      ["phone"]
    );
  });

  it("keeps announcing unknown devices when this device is not in the list", () => {
    writeKnownE2eeDevices(PROFILE_ID, []);

    const { result } = renderHook(() =>
      useE2eeNewDevices(PROFILE_ID, [device("other")], true)
    );

    expect(result.current.newDevices.map(({ deviceKey }) => deviceKey)).toEqual(
      ["other"]
    );
  });

  it("records the first list silently", () => {
    const thisDevice = device("this", { isThisDevice: true });
    const later = device("later", { createdAt: NOW });

    const { result } = renderHook(() =>
      useE2eeNewDevices(PROFILE_ID, [thisDevice, later], true)
    );

    expect(result.current.newDevices).toEqual([]);
  });
});
