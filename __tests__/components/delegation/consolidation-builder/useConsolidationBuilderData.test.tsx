import {
  useConsolidationFreshLinks,
  useConsolidationGroups,
  useConsolidationLinkStatus,
  useConsolidationManagedWallets,
} from "@/components/delegation/consolidation-builder/useConsolidationBuilderData";
import { toDirectedLinkKey } from "@/components/delegation/consolidation-builder/consolidation-plan";
import { fetchUrl } from "@/services/6529api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useReadContracts } from "wagmi";

jest.mock("wagmi", () => ({ useReadContracts: jest.fn() }));
jest.mock("@/services/6529api", () => ({ fetchUrl: jest.fn() }));
jest.mock("@/config/env", () => ({
  publicEnv: { API_ENDPOINT: "https://api.test" },
}));

const A = `0x${"a".repeat(40)}`;
const B = `0x${"b".repeat(40)}`;
const C = `0x${"c".repeat(40)}`;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useConsolidationGroups", () => {
  it("loads each wallet's current consolidation from the API", async () => {
    jest
      .mocked(fetchUrl)
      .mockImplementation(async (url: string) =>
        url.endsWith(A) ? { data: [A, C] } : { data: [B] }
      );
    const wallets = [A, B];

    const { result } = renderHook(() => useConsolidationGroups(wallets), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(fetchUrl).toHaveBeenCalledWith(
      `https://api.test/api/consolidations/${A}`
    );
    expect(result.current.isError).toBe(false);
    expect(result.current.groups.get(A)).toEqual([A, C]);
    expect(result.current.groups.get(B)).toEqual([]);
  });

  it("reports a failed lookup", async () => {
    jest.mocked(fetchUrl).mockRejectedValue(new Error("down"));
    const wallets = [A];

    const { result } = renderHook(() => useConsolidationGroups(wallets), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.groups.has(A)).toBe(false);
  });
});

describe("useConsolidationLinkStatus", () => {
  it("returns registered directions and refetches on demand", () => {
    const refetch = jest.fn().mockResolvedValue(undefined);
    jest.mocked(useReadContracts).mockReturnValue({
      data: [
        { status: "success", result: true },
        { status: "success", result: false },
        { status: "success", result: false },
        { status: "success", result: false },
      ],
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof useReadContracts>);
    const wallets = [A, B];

    const { result } = renderHook(() => useConsolidationLinkStatus(wallets));

    expect(result.current.registeredLinkKeys).toEqual([
      toDirectedLinkKey(A, B),
    ]);
    expect(result.current.isError).toBe(false);
    expect(jest.mocked(useReadContracts).mock.calls[0]?.[0]).toMatchObject({
      query: { enabled: true },
    });
    result.current.refetch();
    expect(refetch).toHaveBeenCalled();
  });

  it("flags failed reads and skips reading without wallets", () => {
    jest.mocked(useReadContracts).mockReturnValue({
      data: [{ status: "failure", error: new Error("rpc") }],
      isError: false,
      refetch: jest.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof useReadContracts>);
    const wallets: string[] = [];

    const { result } = renderHook(() => useConsolidationLinkStatus(wallets));

    expect(result.current.isError).toBe(true);
    expect(result.current.registeredLinkKeys).toBeUndefined();
    expect(jest.mocked(useReadContracts).mock.calls[0]?.[0]).toMatchObject({
      contracts: [],
      query: { enabled: false },
    });
  });
});

describe("useConsolidationManagedWallets", () => {
  function mockReads(value: Partial<ReturnType<typeof useReadContracts>>) {
    const refetch = jest.fn().mockResolvedValue(undefined);
    jest.mocked(useReadContracts).mockReturnValue({
      isError: false,
      refetch,
      ...value,
    } as unknown as ReturnType<typeof useReadContracts>);
    return refetch;
  }

  it("reads whether the connected wallet manages each other wallet", () => {
    const refetch = mockReads({
      data: [
        { status: "success", result: true },
        { status: "success", result: false },
      ],
    } as Partial<ReturnType<typeof useReadContracts>>);
    const wallets = [A, B, C];

    const { result } = renderHook(() =>
      useConsolidationManagedWallets(wallets, B)
    );

    const call = jest.mocked(useReadContracts).mock.calls[0]?.[0] as {
      contracts: { functionName: string; args: unknown[] }[];
      query: { enabled: boolean };
    };
    expect(call.query.enabled).toBe(true);
    expect(call.contracts.map((contract) => contract.args[0])).toEqual([A, C]);
    expect(call.contracts[0]?.functionName).toBe("retrieveSubDelegationStatus");
    expect([...(result.current.managedWallets ?? [])]).toEqual([A]);
    expect(result.current.isError).toBe(false);
    result.current.refetch();
    expect(refetch).toHaveBeenCalled();
  });

  it("is unknown while loading and flags failed reads", () => {
    mockReads({ data: undefined });
    const wallets = [A, B];
    const loading = renderHook(() =>
      useConsolidationManagedWallets(wallets, B)
    );
    expect(loading.result.current.managedWallets).toBeUndefined();

    mockReads({
      data: [{ status: "failure", error: new Error("rpc") }],
    } as Partial<ReturnType<typeof useReadContracts>>);
    const failed = renderHook(() => useConsolidationManagedWallets(wallets, B));
    expect(failed.result.current.isError).toBe(true);
    expect(failed.result.current.managedWallets).toBeUndefined();
  });

  it("manages nothing and reads nothing without a connected wallet", () => {
    const refetch = mockReads({ data: undefined });
    const wallets = [A, B];

    const { result } = renderHook(() =>
      useConsolidationManagedWallets(wallets, undefined)
    );

    expect(jest.mocked(useReadContracts).mock.calls[0]?.[0]).toMatchObject({
      contracts: [],
      query: { enabled: false },
    });
    expect(result.current.managedWallets?.size).toBe(0);
    expect(result.current.isError).toBe(false);
    result.current.refetch();
    expect(refetch).not.toHaveBeenCalled();
  });
});

describe("useConsolidationFreshLinks", () => {
  const AFTER = 1_792_022_400 + 60;

  it("reads every wallet's pair rows and returns fresh directions", async () => {
    jest.mocked(fetchUrl).mockImplementation(async (url: string) => ({
      data: url.includes(A)
        ? [
            {
              wallet1: A,
              wallet2: B,
              confirmed: true,
              wallet1_registered_at: AFTER,
              wallet2_registered_at: null,
            },
          ]
        : [],
    }));
    const wallets = [A, B];

    const { result } = renderHook(
      () =>
        useConsolidationFreshLinks(wallets, Date.parse("2026-10-15T00:00:00Z")),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.freshLinkKeys).toBeDefined());
    expect(fetchUrl).toHaveBeenCalledWith(
      `https://api.test/api/consolidations/${A}?show_incomplete=true`
    );
    expect(result.current.freshLinkKeys).toEqual([toDirectedLinkKey(A, B)]);
    expect(result.current.isError).toBe(false);
  });

  it("returns no directions without wallets and reports failed reads", async () => {
    const empty = renderHook(() => useConsolidationFreshLinks([], null), {
      wrapper: createWrapper(),
    });
    expect(empty.result.current.freshLinkKeys).toEqual([]);

    jest.mocked(fetchUrl).mockRejectedValue(new Error("down"));
    const wallets = [A];
    const { result } = renderHook(
      () =>
        useConsolidationFreshLinks(wallets, Date.parse("2026-10-15T00:00:00Z")),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.freshLinkKeys).toBeUndefined();
  });
});
