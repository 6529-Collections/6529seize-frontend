import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import {
  useAcknowledgeDeviceGrant,
  useDeviceGrants,
  useRevokeDeviceGrant,
} from "@/hooks/device-signing/useDeviceGrants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const mockSetToast = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: mockSetToast }),
}));

const mockFetchGrants = jest.fn();
const mockRevokeGrant = jest.fn();
const mockAcknowledgeGrant = jest.fn();
jest.mock("@/services/api/device-grants-api", () => ({
  acknowledgeDeviceGrant: (...args: unknown[]) => mockAcknowledgeGrant(...args),
  fetchDeviceGrants: (...args: unknown[]) => mockFetchGrants(...args),
  revokeDeviceGrant: (...args: unknown[]) => mockRevokeGrant(...args),
}));

const mockForget = jest.fn();
jest.mock("@/lib/device-signing/device-key-store", () => ({
  forgetDeviceGrant: (...args: unknown[]) => mockForget(...args),
}));

const ADDRESS = "0x1111111111111111111111111111111111111111";
const grant = (overrides: Partial<ApiDeviceGrant> = {}): ApiDeviceGrant =>
  ({
    id: `0x${"1".repeat(64)}`,
    wallet: ADDRESS,
    key_type: "ed25519",
    device_key: `0x${"aa".repeat(32)}`,
    scopes: ["post"],
    device_label: "Safari on iPhone",
    domain: "6529.io",
    issued_at: 1,
    expires_at: 2,
    created_at: 1,
    revoked_at: null,
    last_used_at: null,
    ...overrides,
  }) as ApiDeviceGrant;

const createWrapper = (client: QueryClient) =>
  function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

describe("device grant hooks", () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockFetchGrants.mockReset();
    mockRevokeGrant.mockReset();
    mockAcknowledgeGrant.mockReset();
    mockForget.mockReset().mockResolvedValue(undefined);
    mockSetToast.mockReset();
  });

  it("loads grants only for an eligible wallet and drops local grants revoked elsewhere", async () => {
    const revoked = grant({ id: `0x${"2".repeat(64)}`, revoked_at: 5 });
    mockFetchGrants.mockResolvedValue([grant(), revoked]);

    const { result, rerender } = renderHook(
      ({ address }: { address: string | null }) => useDeviceGrants(address),
      {
        wrapper: createWrapper(client),
        initialProps: { address: null as string | null },
      }
    );
    expect(mockFetchGrants).not.toHaveBeenCalled();

    rerender({ address: ADDRESS });
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    await waitFor(() =>
      expect(mockForget).toHaveBeenCalledWith(ADDRESS, revoked.id)
    );
    expect(mockForget).toHaveBeenCalledTimes(1);
  });

  it("updates only the acknowledgment after the server accepts it", async () => {
    const active = grant({ notice_acknowledged: false });
    const unrelated = grant({ id: `0x${"2".repeat(64)}` });
    const queryKey = [QueryKey.DEVICE_GRANTS, ADDRESS];
    client.setQueryData(queryKey, [active, unrelated]);
    mockAcknowledgeGrant.mockResolvedValue({
      ...active,
      notice_acknowledged: true,
    });

    const { result } = renderHook(() => useAcknowledgeDeviceGrant(), {
      wrapper: createWrapper(client),
    });
    await act(async () => {
      await expect(result.current.acknowledge(active.id)).resolves.toBe(true);
    });

    expect(mockAcknowledgeGrant).toHaveBeenCalledWith(active.id);
    expect(client.getQueryData(queryKey)).toEqual([
      { ...active, notice_acknowledged: true },
      unrelated,
    ]);
    expect(mockRevokeGrant).not.toHaveBeenCalled();
    expect(mockForget).not.toHaveBeenCalled();
  });

  it("revokes, updates the cached list and confirms", async () => {
    const active = grant();
    const revoked = { ...active, revoked_at: 9 };
    client.setQueryData([QueryKey.DEVICE_GRANTS, ADDRESS], [active]);
    mockRevokeGrant.mockResolvedValue(revoked);

    const { result } = renderHook(() => useRevokeDeviceGrant(), {
      wrapper: createWrapper(client),
    });
    let outcome = false;
    await act(async () => {
      outcome = await result.current.revoke(active);
    });

    expect(outcome).toBe(true);
    expect(mockRevokeGrant).toHaveBeenCalledWith(active.id);
    expect(client.getQueryData([QueryKey.DEVICE_GRANTS, ADDRESS])).toEqual([
      revoked,
    ]);
    expect(mockForget).toHaveBeenCalledWith(ADDRESS, active.id);
    expect(mockSetToast).toHaveBeenCalledWith({
      message: "Safari on iPhone can no longer post as you.",
      type: "success",
    });
  });

  it("reports a failed revocation", async () => {
    mockRevokeGrant.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useRevokeDeviceGrant(), {
      wrapper: createWrapper(client),
    });

    let outcome = true;
    await act(async () => {
      outcome = await result.current.revoke(grant());
    });

    expect(outcome).toBe(false);
    expect(mockSetToast).toHaveBeenCalledWith({
      message: "Couldn't revoke this device. Please try again.",
      type: "error",
    });
  });
});
