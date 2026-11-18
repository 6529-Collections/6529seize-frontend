import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useSecurityDevices } from "@/components/preferences/devices-security/useSecurityDevices";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import {
  contextFor,
  createFakeE2eeEngine,
  device,
  E2eeTestProvider,
} from "../../e2ee/fakeE2eeEngine";

// Real React Query and the real useE2ee (through the E2EE context the
// provider supplies), so the engine-less and device-limit paths see what
// the app gives them: no engine store, and a cache that is still fresh.

const NOW = Date.UTC(2026, 10, 9, 15, 0);
const DAY = 24 * 60 * 60 * 1000;
const ADDRESS = "0x1111111111111111111111111111111111111111";
const PROFILE = "profile-1";
const OWN_SIGNING_KEY = `0x${"aa".repeat(32)}`;
const OWN_DEVICE_KEY = `0x${"bb".repeat(32)}`;

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    activeProfileProxy: null,
    isAuthenticated: true,
    connectedProfile: { id: "profile-1" },
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0x1111111111111111111111111111111111111111",
  }),
}));
jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: () => true }));
jest.mock("@/hooks/device-signing/useMinuteClock", () => ({
  useMinuteClock: () => Date.UTC(2026, 10, 9, 15, 0),
}));
jest.mock("@/hooks/device-signing/useLocalDeviceKeys", () => ({
  useLocalDeviceKeys: () => ({
    loaded: true,
    failed: false,
    grant: null,
    publicKeys: [`0x${"aa".repeat(32)}`],
  }),
}));
let mockGrants: ApiDeviceGrant[] = [];
const mockRevokeGrant = jest.fn(async () => true);
jest.mock("@/hooks/device-signing/useDeviceGrants", () => ({
  useDeviceGrants: () => ({
    data: mockGrants,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useRevokeDeviceGrant: () => ({ revoke: mockRevokeGrant, isRevoking: false }),
}));
const mockRemoveLocal = jest.fn(async () => undefined);
jest.mock("@/components/e2ee/useRemoveE2eeLocalData", () => ({
  useRemoveE2eeLocalData: () => mockRemoveLocal,
}));
let mockStoredKey: string | null = null;
jest.mock("@/lib/e2ee/stored-device-key", () => ({
  readStoredE2eeDeviceKey: async () => mockStoredKey,
}));
let mockMe: ApiE2eeDevice[] = [];
const mockFetch = jest.fn(async () => ({
  profile_id: "profile-1",
  devices: mockMe,
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => mockFetch(...(args as [])),
  commonApiPost: jest.fn(),
}));

const grant = (id: string, deviceKey: string): ApiDeviceGrant =>
  ({
    id,
    wallet: ADDRESS,
    key_type: "ed25519",
    device_key: deviceKey,
    scopes: ["post"],
    device_label: "Chrome on Mac",
    domain: "6529.io",
    issued_at: NOW - DAY,
    created_at: NOW - DAY,
    expires_at: NOW + 100 * DAY,
    revoked_at: null,
    last_used_at: null,
  }) as ApiDeviceGrant;

const apiDevice = (
  key: string,
  grantId: string,
  revokedAt: number | null = null
): ApiE2eeDevice =>
  ({
    device_key: key,
    profile_id: PROFILE,
    grant: { expires_at: (NOW + 100 * DAY) / 1000 },
    grant_id: grantId,
    label: "Chrome on Mac",
    platform: "web",
    created_at: NOW - DAY,
    last_seen_at: null,
    revoked_at: revokedAt,
    revocation: null,
    grant_message: "combined",
  }) as ApiE2eeDevice;

function setUp(
  engine: ReturnType<typeof createFakeE2eeEngine> | null,
  seed?: ApiE2eeDevice[]
) {
  // The app's queries stay fresh for a while: a cached list isn't refetched
  // just because the query becomes enabled.
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: 10_000, retry: false } },
  });
  if (seed) {
    client.setQueryData(
      [QueryKey.E2EE_PROFILE_DEVICES, PROFILE, ADDRESS.toLowerCase()],
      seed
    );
  }
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <E2eeTestProvider value={contextFor(engine, { profileId: PROFILE })}>
        {children}
      </E2eeTestProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useSecurityDevices(), { wrapper });
}

describe("useSecurityDevices with the real E2EE context and React Query", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoredKey = null;
  });

  it("finds this browser's device in storage when no engine runs, and removes its data", async () => {
    // No engine (for example another tab runs it): the context has no
    // store, so useE2ee gives no local device key.
    mockGrants = [grant("own", OWN_SIGNING_KEY)];
    mockMe = [apiDevice(OWN_DEVICE_KEY, "own")];
    mockStoredKey = OWN_DEVICE_KEY;
    const { result } = setUp(null);
    await waitFor(() =>
      expect(result.current.thisDevice?.encryptedDms?.status).toBe("active")
    );
    await act(() => result.current.revoke(result.current.thisDevice!));
    expect(mockRevokeGrant).toHaveBeenCalled();
    expect(mockRemoveLocal).toHaveBeenCalledTimes(1);
  });

  it("keeps this browser's data when the stored device is a different one", async () => {
    mockGrants = [grant("own", OWN_SIGNING_KEY)];
    mockMe = [apiDevice(OWN_DEVICE_KEY, "own")];
    mockStoredKey = `0x${"cc".repeat(32)}`;
    const { result } = setUp(null);
    await waitFor(() =>
      expect(result.current.thisDevice?.encryptedDms?.status).toBe("active")
    );
    await act(() => result.current.revoke(result.current.thisDevice!));
    expect(mockRevokeGrant).toHaveBeenCalled();
    expect(mockRemoveLocal).not.toHaveBeenCalled();
  });

  it("refetches a still-fresh cached list after an unsigned revoke at the device limit", async () => {
    const phoneKey = `0x${"dd".repeat(32)}`;
    mockGrants = [grant("phone", `0x${"ee".repeat(32)}`)];
    const engine = createFakeE2eeEngine({
      status: "device-limit",
      devices: [
        device({
          deviceKey: phoneKey,
          label: "Chrome on Mac",
          authorProofGrantId: "phone",
          linkedAuthorProof: true,
        }),
      ],
    });
    // Cached before the engine listed its devices, and still fresh.
    const { result } = setUp(engine, [apiDevice(phoneKey, "phone")]);
    const [phone] = result.current.otherDevices;
    expect(phone?.encryptedDms?.status).toBe("active");
    mockMe = [apiDevice(phoneKey, "phone", NOW)];
    await act(() => result.current.revoke(phone!));
    expect(mockRevokeGrant).toHaveBeenCalled();
    await waitFor(() =>
      expect(result.current.otherDevices[0]?.encryptedDms?.status).toBe(
        "revoked"
      )
    );
    expect(mockFetch).toHaveBeenCalled();
  });
});
