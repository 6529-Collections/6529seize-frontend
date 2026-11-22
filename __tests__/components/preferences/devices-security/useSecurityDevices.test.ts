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
let mockGrantsState = { isLoading: false, isError: false };
let mockGrantsAddress: string | null | undefined;
const mockGrantsRefetch = jest.fn();
const mockRevokeGrant = jest.fn();
jest.mock("@/hooks/device-signing/useDeviceGrants", () => ({
  useDeviceGrants: (address: string | null) => {
    mockGrantsAddress = address;
    return {
      data: mockGrants,
      ...mockGrantsState,
      refetch: mockGrantsRefetch,
    };
  },
  useRevokeDeviceGrant: () => ({ revoke: mockRevokeGrant, isRevoking: false }),
}));
let mockE2ee: Record<string, unknown>;
jest.mock("@/hooks/e2ee/useE2ee", () => ({ useE2ee: () => mockE2ee }));
const mockRemoveLocal = jest.fn(async (_key?: string) => true);
jest.mock("@/components/e2ee/useRemoveE2eeLocalData", () => ({
  useRemoveE2eeLocalData: () => mockRemoveLocal,
}));
let mockApiQuery: Record<string, unknown>;
let mockApiQueryEnabled: boolean | undefined;
// This browser's stored encrypted device (the one identity source).
let mockStoredKey: string | null = null;
jest.mock("@/lib/e2ee/stored-device-key", () => ({
  readStoredE2eeDeviceKey: async () => mockStoredKey,
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: (options: { enabled?: boolean; queryKey: readonly unknown[] }) => {
    if (options.queryKey[0] === "E2EE_STORED_DEVICE_KEY") {
      return { data: mockStoredKey, isSuccess: true, isError: false };
    }
    mockApiQueryEnabled = options.enabled;
    return mockApiQuery;
  },
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
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
  renameDevice: jest.fn(async () => undefined),
};

describe("useSecurityDevices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoredKey = null;
    mockAuth = {
      activeProfileProxy: null,
      isAuthenticated: true,
      connectedProfile: { id: "profile-1" },
    };
    mockE2eeEnabled = true;
    mockLocalKeys = { failed: false, publicKeys: [] };
    mockGrants = [];
    mockGrantsState = { isLoading: false, isError: false };
    mockGrantsAddress = undefined;
    mockApiQuery = {
      data: undefined,
      isSuccess: false,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
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
    mockApiQuery = {
      ...mockApiQuery,
      isSuccess: true,
      data: [apiDevice("0xabc")],
    };
    const { result } = renderHook(() => useSecurityDevices());
    expect(mockApiQueryEnabled).toBe(true);
    expect(result.current.thisDevice).toBeNull();
    expect(result.current.otherDevices.map(({ id }) => id)).toEqual(["0xabc"]);
  });

  it("keeps the API list until a running engine has loaded its own", () => {
    // Ready, but GET /e2ee/me hasn't filled the engine's list yet: without a
    // stand-in, a combined device would show as signed posts only.
    mockE2ee = { engine, status: "ready", devices: [] };
    mockGrants = [grant("g1")];
    mockApiQuery = {
      ...mockApiQuery,
      isSuccess: true,
      data: [apiDevice("0xabc", { grant_id: "g1", grant_message: "signed" })],
    };
    const { result } = renderHook(() => useSecurityDevices());
    expect(mockApiQueryEnabled).toBe(true);
    const [phone] = result.current.otherDevices;
    expect(phone?.signedPosts?.status).toBe("active");
    expect(phone?.encryptedDms?.status).toBe("active");
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
        devices: [
          engineDevice("e1", {
            authorProofGrantId: "a",
            linkedAuthorProof: true,
          }),
        ],
      };
      const { result } = renderHook(() => useSecurityDevices());
      const [device] = result.current.otherDevices;
      expect(result.current.canRevoke(device!)).toBe(true);
      await act(() => result.current.revoke(device!));
      expect(engine.revokeDevice).toHaveBeenCalledWith("e1");
      expect(mockRevokeGrant).not.toHaveBeenCalled();
      expect(mockGrantsRefetch).toHaveBeenCalled();
    });

    it("signs revocations only while the engine runs here", () => {
      mockE2ee = { engine, status: "ready", devices: [engineDevice("e1")] };
      expect(
        renderHook(() => useSecurityDevices()).result.current.signsRevocations
      ).toBe(true);
      mockE2ee = { engine: null, status: "locked", devices: [] };
      expect(
        renderHook(() => useSecurityDevices()).result.current.signsRevocations
      ).toBe(false);
    });

    it("deletes nothing here on an unsigned revoke of this browser, then offers removal", async () => {
      // The engine isn't running, so the server revokes this browser's
      // encrypted device unsigned: its chats stay until the user removes
      // them.
      mockE2ee = { engine: null, status: "locked", devices: [] };
      mockStoredKey = "0xabc";
      mockGrants = [grant("a", { device_key: OWN_KEY })];
      mockLocalKeys = { failed: false, publicKeys: [OWN_KEY] };
      mockApiQuery = {
        ...mockApiQuery,
        isSuccess: true,
        data: [apiDevice("0xabc", { grant_id: "a", grant_message: "signed" })],
      };
      const { result, rerender } = renderHook(() => useSecurityDevices());
      const device = result.current.thisDevice;
      expect(device?.encryptedDms?.status).toBe("active");
      expect(result.current.leftoverLocalData).toBeNull();
      await act(() => result.current.revoke(device!));
      expect(mockRevokeGrant).toHaveBeenCalledWith(mockGrants[0]);
      expect(mockRemoveLocal).not.toHaveBeenCalled();
      // Once the list shows it revoked, this browser offers its removal.
      mockApiQuery = {
        ...mockApiQuery,
        data: [
          apiDevice("0xabc", {
            grant_id: "a",
            grant_message: "signed",
            revoked_at: NOW,
          }),
        ],
      };
      rerender();
      expect(result.current.leftoverLocalData).toEqual({
        deviceKey: "0xabc",
        label: expect.any(String),
      });
      await act(() => result.current.removeLeftoverLocalData("0xabc"));
      expect(mockRemoveLocal).toHaveBeenCalledWith("0xabc");
    });

    it("keeps this browser's chats when an old grant of its signing key enrolled another device", async () => {
      // This browser's signing key is the grant's, but the grant's
      // encrypted device isn't this browser's current one: its data isn't
      // here, so nothing local is removed.
      mockE2ee = { engine: null, status: "locked", devices: [] };
      mockStoredKey = "0xdef";
      mockGrants = [grant("a", { device_key: OWN_KEY })];
      mockLocalKeys = { failed: false, publicKeys: [OWN_KEY] };
      mockApiQuery = {
        ...mockApiQuery,
        isSuccess: true,
        data: [apiDevice("0xabc", { grant_id: "a", grant_message: "signed" })],
      };
      const { result } = renderHook(() => useSecurityDevices());
      const device = result.current.thisDevice;
      expect(device?.encryptedDevice?.deviceKey).toBe("0xabc");
      await act(() => result.current.revoke(device!));
      expect(mockRevokeGrant).toHaveBeenCalledWith(mockGrants[0]);
      expect(mockRemoveLocal).not.toHaveBeenCalled();
    });

    it("shows fresh API data after an unsigned revoke at the device limit", async () => {
      // At the limit the engine lists devices but can't sign or reload:
      // its list would keep showing encrypted DMs as on.
      mockE2ee = {
        engine,
        status: "device-limit",
        devices: [
          engineDevice("e1", {
            authorProofGrantId: "a",
            linkedAuthorProof: true,
          }),
        ],
      };
      mockGrants = [grant("a")];
      const { result, rerender } = renderHook(() => useSecurityDevices());
      expect(mockApiQueryEnabled).toBe(false);
      const [device] = result.current.otherDevices;
      expect(device?.encryptedDms?.status).toBe("active");
      await act(() => result.current.revoke(device!));
      expect(engine.revokeDevice).not.toHaveBeenCalled();
      expect(mockRevokeGrant).toHaveBeenCalledWith(mockGrants[0]);
      mockApiQuery = {
        ...mockApiQuery,
        isSuccess: true,
        data: [
          apiDevice("e1", {
            grant_id: "a",
            grant_message: "signed",
            revoked_at: NOW,
          }),
        ],
      };
      rerender();
      expect(mockApiQueryEnabled).toBe(true);
      // The grant list refetches separately; here only the encrypted
      // device's state is checked.
      expect(result.current.otherDevices[0]?.encryptedDms?.status).toBe(
        "revoked"
      );
    });

    it("offers no removal for another device's revoked key", () => {
      mockE2ee = { engine: null, status: "locked", devices: [] };
      mockStoredKey = "0xdef";
      mockApiQuery = {
        ...mockApiQuery,
        isSuccess: true,
        data: [apiDevice("0xabc", { revoked_at: NOW })],
      };
      const { result } = renderHook(() => useSecurityDevices());
      expect(result.current.leftoverLocalData).toBeNull();
    });

    it("keeps the API list until the engine's list shows a device revoked unsigned as ended", async () => {
      const linked = { authorProofGrantId: "a", linkedAuthorProof: true };
      mockE2ee = {
        engine,
        status: "device-limit",
        devices: [engineDevice("e1", linked)],
      };
      mockGrants = [grant("a")];
      mockApiQuery = {
        ...mockApiQuery,
        isSuccess: true,
        data: [
          apiDevice("e1", {
            grant_id: "a",
            grant_message: "signed",
            revoked_at: NOW,
          }),
        ],
      };
      const { result, rerender } = renderHook(() => useSecurityDevices());
      await act(() => result.current.revoke(result.current.otherDevices[0]!));
      // The engine publishes a list read before the revoke: still active.
      mockE2ee = {
        ...mockE2ee,
        devices: [engineDevice("e1", linked)],
      };
      rerender();
      expect(mockApiQueryEnabled).toBe(true);
      expect(result.current.otherDevices[0]?.encryptedDms?.status).toBe(
        "revoked"
      );
      // Its list catches up: the engine's list is shown again.
      mockE2ee = {
        ...mockE2ee,
        devices: [engineDevice("e1", { ...linked, revokedAt: NOW })],
      };
      rerender();
      expect(mockApiQueryEnabled).toBe(false);
    });

    it("leaves local data alone when revoking another device's grant", async () => {
      mockE2ee = { engine: null, status: "locked", devices: [] };
      mockGrants = [grant("a")];
      mockApiQuery = {
        ...mockApiQuery,
        isSuccess: true,
        data: [apiDevice("0xabc", { grant_id: "a", grant_message: "signed" })],
      };
      const { result } = renderHook(() => useSecurityDevices());
      const [device] = result.current.otherDevices;
      await act(() => result.current.revoke(device!));
      expect(mockRevokeGrant).toHaveBeenCalled();
      expect(mockRemoveLocal).not.toHaveBeenCalled();
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
      mockApiQuery = {
        ...mockApiQuery,
        isSuccess: true,
        data: [apiDevice("0xabc")],
      };
      const { result } = renderHook(() => useSecurityDevices());
      const [device] = result.current.otherDevices;
      expect(result.current.canRevoke(device!)).toBe(false);
      await expect(result.current.revoke(device!)).rejects.toBeInstanceOf(
        DeviceActionUnavailableError
      );
    });
  });

  describe("approvals", () => {
    it("finds an own device this browser doesn't add to chats yet", () => {
      mockE2ee = {
        engine,
        status: "ready",
        devices: [
          engineDevice("e1", { needsApproval: true, wallet: ADDRESS }),
          engineDevice("e2", {
            label: "6529 app on iPhone",
            platform: "phone",
          }),
        ],
      };
      const { result } = renderHook(() => useSecurityDevices());
      const byId = (id: string) =>
        result.current.otherDevices.find((device) => device.id === id)!;
      expect(result.current.approvalFor(byId("e1"))?.deviceKey).toBe("e1");
      expect(result.current.approvalFor(byId("e2"))).toBeNull();
      expect(result.current.engine).toBe(engine);
    });

    it("finds none from the API list", () => {
      mockE2ee = { engine: null, status: "unsupported", devices: [] };
      mockApiQuery = {
        ...mockApiQuery,
        isSuccess: true,
        data: [apiDevice("0xabc")],
      };
      const { result } = renderHook(() => useSecurityDevices());
      const [device] = result.current.otherDevices;
      expect(result.current.approvalFor(device!)).toBeNull();
    });
  });

  describe("renaming", () => {
    it("renames any device through the engine, which reloads its list", async () => {
      mockE2ee = {
        engine,
        status: "ready",
        devices: [engineDevice("e1", { label: "Old name" })],
      };
      const { result } = renderHook(() => useSecurityDevices());
      const [device] = result.current.otherDevices;
      expect(result.current.canRename(device!)).toBe(true);
      await act(() => result.current.rename(device!, "Work laptop"));
      expect(engine.renameDevice).toHaveBeenCalledWith("e1", "Work laptop");
      expect(mockApiPost).not.toHaveBeenCalled();
    });

    it("renames through the API and shows the name until the engine's list catches up", async () => {
      mockE2ee = {
        engine,
        status: "device-limit",
        devices: [engineDevice("e1", { label: "Old name" })],
      };
      const { result, rerender } = renderHook(() => useSecurityDevices());
      await act(() =>
        result.current.rename(result.current.otherDevices[0]!, "Work laptop")
      );
      expect(engine.renameDevice).not.toHaveBeenCalled();
      expect(mockApiPost).toHaveBeenCalledWith({
        endpoint: "e2ee/devices/e1/label",
        body: { label: "Work laptop" },
      });
      expect(result.current.otherDevices[0]?.label).toBe("Work laptop");

      // A later sync brings a newer name; the engine's list wins again.
      mockE2ee = {
        ...mockE2ee,
        devices: [engineDevice("e1", { label: "Renamed elsewhere" })],
      };
      rerender();
      expect(result.current.otherDevices[0]?.label).toBe("Renamed elsewhere");
    });

    it("renames through the API and reloads the API list while the engine can't run", async () => {
      const refetch = jest.fn();
      mockApiQuery = {
        ...mockApiQuery,
        isSuccess: true,
        refetch,
        data: [apiDevice("0xabc")],
      };
      const { result } = renderHook(() => useSecurityDevices());
      await act(() =>
        result.current.rename(result.current.otherDevices[0]!, "Phone")
      );
      expect(mockApiPost).toHaveBeenCalledWith({
        endpoint: "e2ee/devices/0xabc/label",
        body: { label: "Phone" },
      });
      expect(refetch).toHaveBeenCalled();
    });

    it("renames a signed-posts-only grant through the API", async () => {
      mockE2eeEnabled = false;
      mockGrants = [grant("a", { device_key: OWN_KEY })];
      mockLocalKeys = { failed: false, publicKeys: [OWN_KEY] };
      const { result } = renderHook(() => useSecurityDevices());
      await act(() =>
        result.current.rename(result.current.thisDevice!, "Work laptop")
      );
      expect(mockApiPost).toHaveBeenCalledWith({
        endpoint: "device-grants/a/label",
        body: { label: "Work laptop" },
      });
      expect(mockGrantsRefetch).toHaveBeenCalled();
    });

    it("waits to rename until it knows which grants are combined", () => {
      mockGrants = [grant("a")];
      const { result } = renderHook(() => useSecurityDevices());
      expect(result.current.canRename(result.current.otherDevices[0]!)).toBe(
        false
      );
    });
  });

  describe("why Revoke is missing", () => {
    it.each([
      ["elsewhere", "elsewhere"],
      ["load-failed", "failed"],
      ["needs-enrollment", "needs-dms"],
      ["unsupported", "unsupported"],
      ["loading", "loading"],
    ])(
      "explains an encrypted-only device while the engine is %s",
      (status, blocker) => {
        mockE2ee = { engine: null, status, devices: [] };
        mockApiQuery = {
          ...mockApiQuery,
          isSuccess: true,
          data: [apiDevice("0xabc")],
        };
        const { result } = renderHook(() => useSecurityDevices());
        const [device] = result.current.otherDevices;
        expect(result.current.canRevoke(device!)).toBe(false);
        expect(result.current.revokeBlocker(device!)).toBe(blocker);
      }
    );

    it("can't sign a revocation at the device limit, and says so", () => {
      mockE2ee = {
        engine,
        status: "device-limit",
        devices: [engineDevice("e1")],
      };
      const { result } = renderHook(() => useSecurityDevices());
      const [device] = result.current.otherDevices;
      expect(result.current.canRevoke(device!)).toBe(false);
      expect(result.current.revokeBlocker(device!)).toBe("device-limit");
    });

    it("needs no explanation where Revoke is offered", () => {
      mockGrants = [grant("a")];
      mockE2eeEnabled = false;
      const { result } = renderHook(() => useSecurityDevices());
      expect(
        result.current.revokeBlocker(result.current.otherDevices[0]!)
      ).toBeNull();
    });
  });

  it("loads nothing for a proxy session", () => {
    mockAuth = { ...mockAuth, activeProfileProxy: { id: "proxy" } };
    const { result } = renderHook(() => useSecurityDevices());
    expect(result.current.proxy).toBe(true);
    expect(mockGrantsAddress).toBeNull();
    expect(mockApiQueryEnabled).toBe(false);
  });

  it("reports unreadable local keys, and nothing while they are readable", () => {
    mockLocalKeys = { failed: true, publicKeys: [] };
    const { result, rerender } = renderHook(() => useSecurityDevices());
    expect(result.current.localKeysUnreadable).toBe(true);
    mockLocalKeys = { failed: false, publicKeys: [OWN_KEY] };
    rerender();
    expect(result.current.localKeysUnreadable).toBe(false);
  });

  it("reports loading and a failure, and retries both lists", () => {
    mockGrantsState = { isLoading: true, isError: false };
    const { result, rerender } = renderHook(() => useSecurityDevices());
    expect(result.current.loading).toBe(true);

    const apiRefetch = jest.fn();
    mockGrantsState = { isLoading: false, isError: true };
    mockApiQuery = { ...mockApiQuery, refetch: apiRefetch };
    rerender();
    expect(result.current.loading).toBe(false);
    expect(result.current.failed).toBe(true);
    act(() => result.current.retry());
    expect(mockGrantsRefetch).toHaveBeenCalled();
    expect(apiRefetch).toHaveBeenCalled();
  });
});
