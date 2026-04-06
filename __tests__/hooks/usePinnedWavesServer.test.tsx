import { renderHook } from "@testing-library/react";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AuthContext } from "@/components/auth/Auth";
import { usePinnedWavesServer } from "@/hooks/usePinnedWavesServer";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

const queryClientMock = {
  cancelQueries: jest.fn(),
  getQueriesData: jest.fn(() => []),
  getQueryData: jest.fn(() => []),
  invalidateQueries: jest.fn(),
  setQueryData: jest.fn(),
};

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider
    value={
      { connectedProfile: { handle: "me" }, activeProfileProxy: null } as any
    }
  >
    {children}
  </AuthContext.Provider>
);

describe("usePinnedWavesServer", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useQueryClient as jest.Mock).mockReturnValue(queryClientMock);
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      error: null,
    });
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: "0xabc",
    });
  });

  it("always refetches pinned waves on window focus", () => {
    renderHook(() => usePinnedWavesServer(), { wrapper });

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        gcTime: 10 * 60 * 1000,
        refetchInterval: 2 * 60 * 1000,
        refetchOnWindowFocus: "always",
        staleTime: 5 * 60 * 1000,
      })
    );
  });
});
