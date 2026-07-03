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
import { fetchWavesV2Page } from "@/services/api/waves-v2-api";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { ApiWavesPinFilter } from "@/generated/models/ApiWavesPinFilter";

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

jest.mock("@/hooks/useOfficialWaves", () => ({
  useOfficialWaves: jest.fn(),
}));

jest.mock("@/services/api/waves-v2-api", () => {
  const actual = jest.requireActual("@/services/api/waves-v2-api");

  return {
    ...actual,
    fetchWavesV2Page: jest.fn(),
  };
});

const useMutationMock = useMutation as jest.Mock;
const useQueryMock = useQuery as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const useSeizeConnectContextMock = useSeizeConnectContext as jest.Mock;
const useSeizeSettingsOptionalMock = useSeizeSettingsOptional as jest.Mock;
const fetchWavesV2PageMock = fetchWavesV2Page as jest.Mock;
const useOfficialWavesMock = require("@/hooks/useOfficialWaves")
  .useOfficialWaves as jest.Mock;

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

const createWavesPage = ({
  page,
  count,
  next,
  startIndex = 0,
}: {
  readonly page: number;
  readonly count: number;
  readonly next: boolean;
  readonly startIndex?: number;
}) => ({
  waves: Array.from({ length: count }, (_, index) =>
    createWave(`wave-${startIndex + index}`)
  ),
  page,
  next,
});

const getPinnedWavesQueryOptions = (): {
  readonly queryFn: () => Promise<unknown>;
  readonly queryKey: readonly unknown[];
} => {
  const firstCall = useQueryMock.mock.calls[0];
  if (!firstCall) {
    throw new Error("Expected useQuery to be called");
  }

  return firstCall[0];
};

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
  useSeizeConnectContextMock.mockReturnValue({
    address: "0xabc",
    hasValidWalletAuth: true,
  });
  useSeizeSettingsOptionalMock.mockReturnValue({
    isAnnouncementsWave: (waveId: string | null | undefined) =>
      waveId === "announcement-wave",
  });
  useOfficialWavesMock.mockReturnValue({
    waves: [],
    isFetching: false,
    status: "success",
    refetch: jest.fn(),
  });
});

test("keeps the pinned cache key at the logical limit but requests API pages of 20", async () => {
  fetchWavesV2PageMock.mockResolvedValue(
    createWavesPage({ page: 1, count: 1, next: false })
  );

  renderHook(() => usePinnedWavesServer(), { wrapper });

  const queryOptions = getPinnedWavesQueryOptions();
  expect((queryOptions.queryKey[1] as { page_size: number }).page_size).toBe(
    MAX_PINNED_WAVES
  );

  await queryOptions.queryFn();

  expect(fetchWavesV2PageMock).toHaveBeenCalledWith({
    page: 1,
    pageSize: 20,
    overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
    pinned: ApiWavesPinFilter.Pinned,
  });
});

test("disables pinned and official wave reads while wallet auth is invalid", () => {
  useSeizeConnectContextMock.mockReturnValue({
    address: "0xabc",
    hasValidWalletAuth: false,
  });

  renderHook(() => usePinnedWavesServer(), { wrapper });

  expect(useQueryMock).toHaveBeenCalledWith(
    expect.objectContaining({
      enabled: false,
      queryKey: expect.arrayContaining([
        expect.anything(),
        expect.not.objectContaining({ viewer_identity: expect.any(String) }),
      ]),
    })
  );
  expect(useOfficialWavesMock).toHaveBeenCalledWith({
    viewerIdentityKey: null,
    enabled: false,
  });
});

test("disables pinned and official wave reads without clearing cache when deferred", () => {
  renderHook(() => usePinnedWavesServer({ enabled: false }), { wrapper });

  expect(useQueryMock).toHaveBeenCalledWith(
    expect.objectContaining({
      enabled: false,
      queryKey: expect.arrayContaining([
        expect.anything(),
        expect.objectContaining({ viewer_identity: "0xabc:primary" }),
      ]),
    })
  );
  expect(useOfficialWavesMock).toHaveBeenCalledWith({
    viewerIdentityKey: "0xabc:primary",
    enabled: false,
  });
  expect(queryClientMock.setQueryData).not.toHaveBeenCalled();
});

test("fetches pinned waves across multiple API pages", async () => {
  fetchWavesV2PageMock
    .mockResolvedValueOnce(
      createWavesPage({ page: 1, count: 20, next: true, startIndex: 0 })
    )
    .mockResolvedValueOnce(
      createWavesPage({ page: 2, count: 3, next: false, startIndex: 20 })
    );

  renderHook(() => usePinnedWavesServer(), { wrapper });

  const result = await getPinnedWavesQueryOptions().queryFn();

  expect((result as any[]).map((wave) => wave.id)).toEqual([
    ...Array.from({ length: 20 }, (_, index) => `wave-${index}`),
    "wave-20",
    "wave-21",
    "wave-22",
  ]);
  expect(fetchWavesV2PageMock).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ page: 1, pageSize: 20 })
  );
  expect(fetchWavesV2PageMock).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ page: 2, pageSize: 20 })
  );
});

test("stops fetching pinned waves once the pinned limit is reached", async () => {
  fetchWavesV2PageMock.mockImplementation(({ page }) =>
    Promise.resolve(
      createWavesPage({
        page,
        count: 20,
        next: true,
        startIndex: (page - 1) * 20,
      })
    )
  );

  renderHook(() => usePinnedWavesServer(), { wrapper });

  const result = await getPinnedWavesQueryOptions().queryFn();

  expect(result as any[]).toHaveLength(MAX_PINNED_WAVES);
  expect(fetchWavesV2PageMock).toHaveBeenCalledTimes(5);
  expect(fetchWavesV2PageMock).not.toHaveBeenCalledWith(
    expect.objectContaining({ page: 6 })
  );
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

test("keeps raw pinned ids but ignores official pins for budget checks", async () => {
  const pinnedWaves = [
    createWave("official-wave"),
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
  useOfficialWavesMock.mockReturnValue({
    waves: [createWave("official-wave")],
    isFetching: false,
    status: "success",
    refetch: jest.fn(),
  });

  const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });

  expect(result.current.pinnedIds).toContain("official-wave");
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
