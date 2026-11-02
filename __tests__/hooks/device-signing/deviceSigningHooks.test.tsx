import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { useLocalDeviceKeys } from "@/hooks/device-signing/useLocalDeviceKeys";
import { useMinuteClock } from "@/hooks/device-signing/useMinuteClock";
import { useSignedMessagesAccount } from "@/hooks/device-signing/useSignedMessagesAccount";
import { act, renderHook, waitFor } from "@testing-library/react";

const ADDRESS = "0xAbCd000000000000000000000000000000000001";

let mockEnabled = true;
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => mockEnabled,
}));

let mockSupported = true;
jest.mock("@/lib/device-signing/login-grant", () => ({
  canUseDeviceSigning: async () => mockSupported,
}));

let mockAuth: Record<string, unknown>;
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockAuth,
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: ADDRESS }),
}));

const mockRecord: { grant: ApiDeviceGrant | null } = { grant: null };
let mockChangeListener: (() => void) | null = null;
jest.mock("@/lib/device-signing/device-key-store", () => ({
  readDeviceKey: async () => ({
    publicKeyHex: `0x${"aa".repeat(32)}`,
    grant: mockRecord.grant,
  }),
  listLocalDevicePublicKeys: async () => [`0x${"aa".repeat(32)}`],
  subscribeToDeviceGrantChanges: (listener: () => void) => {
    mockChangeListener = listener;
    return () => {
      mockChangeListener = null;
    };
  },
}));

describe("device signing hooks", () => {
  beforeEach(() => {
    mockEnabled = true;
    mockSupported = true;
    mockAuth = { activeProfileProxy: null, isAuthenticated: true };
    mockRecord.grant = null;
  });

  it("returns the lowercase wallet only when signed messages apply", async () => {
    const { result } = renderHook(() => useSignedMessagesAccount());
    await waitFor(() => expect(result.current).toBe(ADDRESS.toLowerCase()));

    mockAuth = { activeProfileProxy: { id: "proxy" }, isAuthenticated: true };
    const proxy = renderHook(() => useSignedMessagesAccount());
    await act(async () => undefined);
    expect(proxy.result.current).toBeNull();
  });

  it("stays off without Ed25519 support or with the flag off", async () => {
    mockSupported = false;
    const unsupported = renderHook(() => useSignedMessagesAccount());
    await act(async () => undefined);
    expect(unsupported.result.current).toBeNull();

    mockSupported = true;
    mockEnabled = false;
    const disabled = renderHook(() => useSignedMessagesAccount());
    await act(async () => undefined);
    expect(disabled.result.current).toBeNull();
  });

  it("loads this browser's keys and follows grant changes", async () => {
    const { result } = renderHook(() => useLocalDeviceKeys(ADDRESS));
    expect(result.current.loaded).toBe(false);
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.grant).toBeNull();
    expect(result.current.publicKeys).toEqual([`0x${"aa".repeat(32)}`]);

    mockRecord.grant = { id: "grant" } as ApiDeviceGrant;
    act(() => mockChangeListener?.());
    await waitFor(() => expect(result.current.grant).toEqual({ id: "grant" }));
  });

  it("reports nothing loaded without a wallet", () => {
    const { result } = renderHook(() => useLocalDeviceKeys(null));
    expect(result.current).toEqual({
      loaded: false,
      grant: null,
      publicKeys: [],
    });
  });

  it("rounds the clock down to the minute", () => {
    jest.useFakeTimers({ now: Date.UTC(2026, 9, 12, 12, 0, 42) });
    try {
      const { result } = renderHook(() => useMinuteClock());
      expect(result.current).toBe(Date.UTC(2026, 9, 12, 12, 0));
      act(() => {
        jest.advanceTimersByTime(60_000);
      });
      expect(result.current).toBe(Date.UTC(2026, 9, 12, 12, 1));
    } finally {
      jest.useRealTimers();
    }
  });
});
