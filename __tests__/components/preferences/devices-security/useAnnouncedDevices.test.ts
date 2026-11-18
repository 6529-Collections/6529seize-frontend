import { renderHook } from "@testing-library/react";
import type { SecurityDevice } from "@/components/preferences/devices-security/classifyDevices";
import { useAnnouncedDevices } from "@/components/preferences/devices-security/useAnnouncedDevices";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiDeviceSecurityNotice } from "@/generated/models/ApiDeviceSecurityNotice";
import type { E2eeDeviceInfo } from "@/lib/e2ee/types";

const OWN_KEY = `0x${"aa".repeat(32)}`;
const PHONE_KEY = `0x${"bb".repeat(32)}`;
const LAPTOP_KEY = `0x${"cc".repeat(32)}`;

let mockNotices: ApiDeviceSecurityNotice[] | null | undefined;
jest.mock("@/hooks/device-signing/useDeviceSecurityNotices", () => ({
  useDeviceSecurityNotices: () => ({
    notices: mockNotices,
    removeNotice: jest.fn(),
  }),
}));
let mockNewDevices: E2eeDeviceInfo[] = [];
let mockLegacyEnabled: boolean | undefined;
jest.mock("@/components/e2ee/devices/useE2eeNewDevices", () => ({
  useE2eeNewDevices: (_profile: unknown, _devices: unknown, enabled: boolean) => {
    mockLegacyEnabled = enabled;
    return { newDevices: mockNewDevices, acknowledge: jest.fn() };
  },
}));
jest.mock("@/hooks/e2ee/useE2ee", () => ({
  useE2ee: () => ({
    devices: [],
    profileId: "profile-1",
    status: "ready",
    localDeviceKey: OWN_KEY,
  }),
}));

const notice = (
  patch: Partial<ApiDeviceSecurityNotice>
): ApiDeviceSecurityNotice =>
  ({
    device_label: "6529 app on iPhone",
    signing_grant_id: null,
    signing_device_key: null,
    encrypted_dm_device_key: null,
    ...patch,
  }) as ApiDeviceSecurityNotice;

const device = (
  encryptedKey: string | null,
  grantId: string | null = null
): SecurityDevice =>
  ({
    encryptedDevice: encryptedKey === null ? null : { deviceKey: encryptedKey },
    grant: grantId === null ? null : ({ id: grantId } as ApiDeviceGrant),
  }) as SecurityDevice;

describe("useAnnouncedDevices", () => {
  beforeEach(() => {
    mockNotices = [];
    mockNewDevices = [];
  });

  it("marks the devices the server's pending notices name", () => {
    mockNotices = [
      notice({ encrypted_dm_device_key: PHONE_KEY.toUpperCase() }),
      notice({ signing_grant_id: "grant-laptop" }),
      notice({ encrypted_dm_device_key: OWN_KEY }),
    ];
    const { result } = renderHook(() => useAnnouncedDevices());
    const isNew = result.current;
    expect(isNew(device(PHONE_KEY))).toBe(true);
    expect(isNew(device(null, "grant-laptop"))).toBe(true);
    // This browser's own notice isn't news to it.
    expect(isNew(device(OWN_KEY))).toBe(false);
    expect(isNew(device(LAPTOP_KEY, "grant-other"))).toBe(false);
    // The server answers, so this browser's own list isn't consulted.
    expect(mockLegacyEnabled).toBe(false);
  });

  it("falls back to this browser's own list where the server has no notices", () => {
    mockNotices = null;
    mockNewDevices = [{ deviceKey: LAPTOP_KEY } as E2eeDeviceInfo];
    const { result } = renderHook(() => useAnnouncedDevices());
    expect(mockLegacyEnabled).toBe(true);
    expect(result.current(device(LAPTOP_KEY))).toBe(true);
    expect(result.current(device(PHONE_KEY))).toBe(false);
  });
});
