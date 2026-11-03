import { useSafeCollectingSetup } from "@/components/delegation/safe-collecting/useSafeCollectingSetup";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const VAULT = `0x${"a".repeat(40)}`;
const SOCIAL = `0x${"c".repeat(40)}`;

let mockAddress: string | undefined = SOCIAL;
let mockProfile: unknown = null;
const mockFetchUrl = jest.fn();

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: mockAddress }),
}));

jest.mock("@/components/auth/authContext", () => ({
  useAuth: () => ({ connectedProfile: mockProfile }),
}));

jest.mock("@/services/6529api", () => ({
  fetchUrl: (...args: unknown[]) => mockFetchUrl(...args),
}));

function wrapper({ children }: { readonly children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mockAddress = SOCIAL;
  mockProfile = null;
  mockFetchUrl.mockReset();
  mockFetchUrl.mockResolvedValue({ data: [] });
});

describe("useSafeCollectingSetup", () => {
  it("is disconnected without a wallet", () => {
    mockAddress = undefined;
    const { result } = renderHook(() => useSafeCollectingSetup(), { wrapper });
    expect(result.current).toEqual({ kind: "disconnected" });
  });

  it("handles a profile without a primary wallet", async () => {
    mockProfile = {
      wallets: [
        { wallet: VAULT, display: "vault.eth", tdh: 10 },
        { wallet: SOCIAL, display: "", tdh: 0 },
      ],
      primary_wallet: undefined,
    };
    const { result } = renderHook(() => useSafeCollectingSetup(), { wrapper });

    await waitFor(() => expect(result.current.kind).toBe("ready"));
    const state = result.current;
    if (state.kind !== "ready") {
      throw new Error("expected ready");
    }
    expect(state.primaryWallet).toBeUndefined();
    expect(state.connectedWallet).toBe(SOCIAL);
    expect(state.wallets.map((wallet) => wallet.display)).toEqual([
      "vault.eth",
      SOCIAL,
    ]);
    expect(state.checklist.combined).toBe(true);
    expect(mockFetchUrl).toHaveBeenCalledTimes(2);
  });

  it("reports a failed delegation read", async () => {
    mockFetchUrl.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useSafeCollectingSetup(), { wrapper });
    await waitFor(() => expect(result.current.kind).toBe("error"));
  });
});
