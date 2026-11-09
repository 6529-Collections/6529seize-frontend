import { act, renderHook } from "@testing-library/react";
import {
  DeviceActionUnavailableError,
  useSecurityDevices,
} from "@/components/preferences/devices-security/useSecurityDevices";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import type { E2eeDeviceInfo } from "@/lib/e2ee/types";

const NOW = Date.UTC(2026, 10, 9, 15, 0);
const DAY = 24 * 60 * 60 * 1000;
const ADDRESS = "0x1111111111111111111111111111111111111111";
const OWN_KEY = `0x${"aa".repeat(32)}`;

let mockAuth: Record<string, unknown>;
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: ADDRESS }),
}));
let mockE2eeEnabled = true;
jest.mock("@/config/e2eeEnv", () => ({
  isE2eeEnabled: () => mockE2eeEnabled,
}));
jest.mock("@/hooks/device-signing/useMinuteClock", () => ({
  useMinuteClock: () => NOW,
}));
let mockLocalKeys: { failed: boolean; publicKeys: string[] };
jest.mock("@/hooks/device-signing/useLocalDeviceKeys", () => ({
  useLocalDeviceKeys: () => ({ loaded: true, grant: null, ...mockLocalKeys }),
}));
let mockGrants: ApiDeviceGrant[];
const mockGrantsRefetch = jest.fn();
const mockRevokeGrant = jest.fn();
jest.mock("@/hooks/device-signing/useDeviceGrants", () => ({
  useDeviceGrants: () => ({
    data: mockGrants,
    isLoading: false,
    isError: false,
    refetch: mockGrantsRefetch,
  }),
  useRevokeDeviceGrant: () => ({ revoke: mockRevokeGrant, isRevoking: false }),
}));
let mockE2ee: Record<string, unknown>;
jest.mock("@/hooks/e2ee/useE2ee", () => ({ useE2ee: () => mockE2ee }));
let mockApiQuery: Record<string, unknown>;
let mockApiQueryEnabled: boolean | undefined;
jest.mock("@tanstack/react-query", () => ({
  useQuery: (options: { enabled?: boolean }) => {
    mockApiQueryEnabled = options.enabled;
    return mockApiQuery;
  },
}));
const mockApiPost = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: (...args: unknown[]) => mockApiPost(...args),
}));

const grant = (id: string, patch: Partial<ApiDeviceGrant> = {}) =>
  ({
    id,
    wallet: ADDRESS,
    key_type: "ed25519",
    device_key: `0x${id.padStart(64, "0")}`,
    scopes: ["post"],
    device_label: "Chrome on Mac",
    domain: "6529.io",
    issued_at: NOW - DAY,
    created_at: NOW - DAY,
    expires_at: NOW + 100 * DAY,
    revoked_at: null,
    last_used_at: null,
    ...patch,
  }) as ApiDeviceGrant;

const engineDevice = (
  deviceKey: string,
  patch: Partial<E2eeDeviceInfo> = {}
): E2eeDeviceInfo => ({
  deviceKey,
  label: "Brave on Windows",
  platform: "web",
  createdAt: NOW - DAY,
  lastSeenAt: null,
  expiresAt: NOW + 100 * DAY,
  revokedAt: null,
  isThisDevice: false,
  verified: true,
  ...patch,
});

const apiDevice = (key: string, patch: Partial<ApiE2eeDevice> = {}) =>
  ({
    device_key: key,
    profile_id: "profile-1",
    grant: { expires_at: (NOW + 100 * DAY) / 1000 },
    grant_id: "unrelated",
    label: "6529 app on iPhone",
    platform: "phone",
    created_at: NOW - DAY,
    last_seen_at: null,
    revoked_at: null,
    revocation: null,
    grant_message: null,
    ...patch,
  }) as ApiE2eeDevice;

const engine = {
  revokeDevice: jest.fn(async () => undefined),
  renameThisDevice: jest.fn(async () => undefined),
};

describe("useSecurityDevices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = {
      activeProfileProxy: null,
      isAuthenticated: true,
      connectedProfile: { id: "profile-1" },
    };
    mockE2eeEnabled = true;
    mockLocalKeys = { failed: false, publicKeys: [] };
    mockGrants = [];
    mockApiQuery = { data: undefined, isSuccess: false, isLoading: false, isError: false, refetch: jest.fn() };
    mockE2ee = { engine: null, status: "idle", devices: [] };
    mockRevokeGrant.mockResolvedValue(true);
  });

  it("uses the engine's devices once it runs, and skips the API list", () => {
    mockE2ee = {
      engine,
      status: "ready",
      devices: [engineDevice("e1", { isThisDevice: true })],
    };
    const { result } = renderHook(() => useSecurityDevices());
    expect(mockApiQueryEnabled).toBe(false);
    expect(result.current.thisDevice?.id).toBe("e1");
  });

  it("falls back to the API list while the engine can't run, without claiming this device", () => {
    mockE2ee = { engine: null, status: "unsupported", devices: [] };
    mockApiQuery = { ...mockApiQuery, isSuccess: true, data: [apiDevice("0xabc")] };
    const { result } = renderHook(() => useSecurityDevices());
    expect(mockApiQueryEnabled).toBe(true);
    expect(result.current.thisDevice).toBeNull();
    expect(result.current.otherDevices.map(({ id }) => id)).toEqual(["0xabc"]);
  });

  it("finds this browser by its signing key", () => {
    mockGrants = [grant("a", { device_key: OWN_KEY })];
    mockLocalKeys = { failed: false, publicKeys: [OWN_KEY] };
    mockE2eeEnabled = false;
    const { result } = renderHook(() => useSecurityDevices());
    expect(result.current.thisDevice?.id).toBe("a");
  });

  describe("revoking", () => {
    it("allows nothing until it knows which grants are combined", () => {
      mockGrants = [grant("a")];
      const { result } = renderHook(() => useSecurityDevices());
      const [device] = result.current.otherDevices;
      expect(result.current.canRevoke(device!)).toBe(false);
    });

    it("revokes an encrypted-DMs device through the engine, ending its grant too", async () => {
      mockGrants = [grant("a")];
      mockE2ee = {
        engine,
        status: "ready",
        devices: [engineDevice("e1", { authorProofGrantId: "a", linkedAuthorProof: true })],
      };
      const { result } = renderHook(() => useSecurityDevices());
      const [device] = result.current.otherDevices;
      expect(result.current.canRevoke(device!)).toBe(true);
      await act(() => result.current.revoke(device!));
      expect(engine.revokeDevice).toHaveBeenCalledWith("e1");
      expect(mockRevokeGrant).not.toHaveBeenCalled();
      expect(mockGrantsRefetch).toHaveBeenCalled();
    });

    it("revokes a signed-posts-only grant through the API", async () => {
      mockGrants = [grant("a")];
      mockE2eeEnabled = false;
      const { result } = renderHook(() => useSecurityDevices());
      const [device] = result.current.otherDevices;
      await act(() => result.current.revoke(device!));
      expect(mockRevokeGrant).toHaveBeenCalledWith(mockGrants[0]);
    });

    it("fails a grant revoke the API refused", async () => {
      mockGrants = [grant("a")];
      mockE2eeEnabled = false;
      mockRevokeGrant.mockResolvedValue(false);
      const { result } = renderHook(() => useSecurityDevices());
      const [device] = result.current.otherDevices;
      await expect(result.current.revoke(device!)).rejects.toThrow();
    });

    it("can't revoke an encrypted-only device without the engine", async () => {
      mockApiQuery = { ...mockApiQuery, isSuccess: true, data: [apiDevice("0xabc")] };
      const { result } = renderHook(() => useSecurityDevices());
      const [device] = result.current.otherDevices;
      expect(result.current.canRevoke(device!)).toBe(false);
      await expect(result.current.revoke(device!)).rejects.toBeInstanceOf(
        DeviceActionUnavailableError
      );
    });
  });

  describe("renaming this device", () => {
    it("renames through the engine when it runs", async () => {
      mockE2ee = {
        engine,
        status: "ready",
        devices: [engineDevice("e1", { isThisDevice: true })],
      };
      const { result } = renderHook(() => useSecurityDevices());
      await act(() => result.current.renameThisDevice("Work laptop"));
      expect(engine.renameThisDevice).toHaveBeenCalledWith("Work laptop");
    });

    it("renames a signed-posts-only grant through the API", async () => {
      mockE2eeEnabled = false;
      mockGrants = [grant("a", { device_key: OWN_KEY })];
      mockLocalKeys = { failed: false, publicKeys: [OWN_KEY] };
      const { result } = renderHook(() => useSecurityDevices());
      await act(() => result.current.renameThisDevice("Work laptop"));
      expect(mockApiPost).toHaveBeenCalledWith({
        endpoint: "device-grants/a/label",
        body: { label: "Work laptop" },
      });
    });
  });

  it("reports a proxy session and unreadable local keys", () => {
    mockAuth = { ...mockAuth, activeProfileProxy: { id: "proxy" } };
    mockLocalKeys = { failed: true, publicKeys: [] };
    const { result } = renderHook(() => useSecurityDevices());
    expect(result.current.proxy).toBe(true);
    expect(result.current.localKeysUnreadable).toBe(true);
  });
});
