import { renderHook } from "@testing-library/react";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import {
  MAX_PINNED_WAVES,
  usePinnedWavesServer,
} from "@/hooks/usePinnedWavesServer";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettingsOptional: jest.fn(),
}));

const useMutationMock = useMutation as jest.Mock;
const useQueryMock = useQuery as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const useSeizeConnectContextMock = useSeizeConnectContext as jest.Mock;
const useSeizeSettingsOptionalMock = useSeizeSettingsOptional as jest.Mock;

const queryClientMock = {
  cancelQueries: jest.fn().mockResolvedValue(undefined),
  getQueryData: jest.fn(),
  getQueriesData: jest.fn().mockReturnValue([]),
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

const createWave = (id: string) =>
  ({
    id,
    pinned: true,
  }) as any;

let pinMutateAsync: jest.Mock;
let unpinMutateAsync: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  pinMutateAsync = jest.fn().mockResolvedValue(undefined);
  unpinMutateAsync = jest.fn().mockResolvedValue(undefined);

  let mutationCallCount = 0;
  useMutationMock.mockImplementation(() => {
    mutationCallCount += 1;

    return mutationCallCount === 1
      ? { mutateAsync: pinMutateAsync, error: null }
      : { mutateAsync: unpinMutateAsync, error: null };
  });

  useQueryClientMock.mockReturnValue(queryClientMock);
  useQueryMock.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  });
  useSeizeConnectContextMock.mockReturnValue({ address: "0xabc" });
  useSeizeSettingsOptionalMock.mockReturnValue({
    isAnnouncementsWave: (waveId: string | null | undefined) =>
      waveId === "announcement-wave",
  });
});

test("keeps raw pinned ids but ignores a legacy announcement pin for budget checks", async () => {
  const pinnedWaves = [
    createWave("announcement-wave"),
    ...Array.from({ length: MAX_PINNED_WAVES - 1 }, (_, index) =>
      createWave(`wave-${index}`)
    ),
  ];
  useQueryMock.mockReturnValue({
    data: pinnedWaves,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  });

  const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });

  expect(result.current.pinnedIds).toContain("announcement-wave");
  expect(result.current.canPinWave("new-wave")).toBe(true);

  await result.current.pinWave("new-wave");

  expect(pinMutateAsync).toHaveBeenCalledWith("new-wave");
});

test("always refetches pinned waves on window focus", () => {
  renderHook(() => usePinnedWavesServer(), { wrapper });

  expect(useQueryMock).toHaveBeenCalledWith(
    expect.objectContaining({
      refetchOnWindowFocus: "always",
    })
  );
});

test("still enforces the cap once non-announcement pins reach the limit", async () => {
  const pinnedWaves = [
    createWave("announcement-wave"),
    ...Array.from({ length: MAX_PINNED_WAVES }, (_, index) =>
      createWave(`wave-${index}`)
    ),
  ];
  useQueryMock.mockReturnValue({
    data: pinnedWaves,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  });

  const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });

  expect(result.current.canPinWave("new-wave")).toBe(false);
  await expect(result.current.pinWave("new-wave")).rejects.toThrow(
    `Maximum ${MAX_PINNED_WAVES} pinned waves allowed`
  );
  expect(pinMutateAsync).not.toHaveBeenCalled();
});
