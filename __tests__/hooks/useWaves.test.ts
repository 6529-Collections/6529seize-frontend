import { renderHook } from "@testing-library/react";
import { useWaves } from "@/hooks/useWaves";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import React from "react";
import { commonApiFetch } from "@/services/api/common-api";

// Mock dependencies
jest.mock("react-use", () => ({
  useDebounce: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn().mockResolvedValue({ waves: [], count: 0 }),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

const useSeizeConnectContextMock =
  require("@/components/auth/SeizeConnectContext")
    .useSeizeConnectContext as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  const defaultAuthContext = {
    connectedProfile: null,
    activeProfileProxy: null,
    setTitle: jest.fn(),
    requestAuth: jest.fn(),
    setToast: jest.fn(),
    setActiveProfileProxy: jest.fn(),
    fetchingProfile: false,
    connectionStatus: "DISCONNECTED" as any,
    receivedProfileProxies: [],
    showWaves: false,
    title: "",
  };

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        AuthContext.Provider,
        { value: defaultAuthContext },
        children
      )
    );
};

describe("useWaves", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSeizeConnectContextMock.mockReturnValue({
      address: undefined,
      hasValidWalletAuth: false,
    });
  });

  it("should return expected hook properties", () => {
    const { result } = renderHook(
      () =>
        useWaves({
          identity: null,
          waveName: null,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveProperty("waves");
    expect(result.current).toHaveProperty("hasNextPage");
    expect(result.current).toHaveProperty("fetchNextPage");
    expect(result.current).toHaveProperty("isFetching");
    expect(result.current).toHaveProperty("isFetchingNextPage");
  });

  it("does not fetch public or private waves while a connected wallet lacks valid auth", async () => {
    useSeizeConnectContextMock.mockReturnValue({
      address: "0xABC",
      hasValidWalletAuth: false,
    });

    renderHook(
      () =>
        useWaves({
          identity: null,
          waveName: null,
        }),
      { wrapper: createWrapper() }
    );

    await Promise.resolve();

    expect(commonApiFetchMock).not.toHaveBeenCalled();
  });
});
