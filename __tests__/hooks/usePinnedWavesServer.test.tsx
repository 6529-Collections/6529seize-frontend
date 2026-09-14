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
import {
  getAuthJwt,
  getWalletAddress,
  getWalletRole,
} from "@/services/auth/auth.utils";
import { pinnedWavesApi } from "@/services/api/pinned-waves-api";

jest.mock("@/services/api/pinned-waves-api", () => ({
  pinnedWavesApi: { pinWave: jest.fn(), unpinWave: jest.fn() },
}));

jest.mock("@/services/auth/auth.utils", () => ({
  ...jest.requireActual("@/services/auth/auth.utils"),
  getAuthJwt: jest.fn(),
  getWalletAddress: jest.fn(),
  getWalletRole: jest.fn(),
}));

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

const requestAuth = jest.fn();
const createAuthJwt = (role: string | null | undefined) =>
  `e30.${btoa(JSON.stringify({ role, sub: "0xabc", exp: Date.now() / 1000 + 3600 }))}.signature`;

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider
    value={
      {
        connectedProfile: { id: "profile-me", handle: "me" },
        activeProfileProxy: null,
        requestAuth,
      } as any
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
  requestAuth.mockReset().mockResolvedValue({ success: true });
  jest.mocked(getWalletAddress).mockReturnValue("0xabc");
  jest.mocked(getAuthJwt).mockReturnValue(createAuthJwt("profile-me"));
  jest.mocked(getWalletRole).mockReturnValue("profile-me");

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

test("does not turn anonymous overview results into pins or paginate through public waves", async () => {
  fetchWavesV2PageMock.mockResolvedValue({
    page: 1,
    next: true,
    waves: [{ ...createWave("public-wave"), pinned: false }],
  });
  renderHook(() => usePinnedWavesServer(), { wrapper });

  await expect(getPinnedWavesQueryOptions().queryFn()).resolves.toEqual([]);
  expect(fetchWavesV2PageMock).toHaveBeenCalledTimes(1);
});

test("excludes unpinned entries already present in the pinned cache", () => {
  useQueryMock.mockReturnValue({
    data: [createWave("pin"), { ...createWave("public"), pinned: false }],
  });
  const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });
  expect(result.current.pinnedIds).toEqual(["pin"]);
});

test.each([0, 1])(
  "pin mutation %s checks the active account immediately before the API request",
  async (index) => {
    renderHook(() => usePinnedWavesServer(), { wrapper });
    const { mutationFn } = useMutationMock.mock.calls[index][0];
    jest.mocked(getWalletAddress).mockReturnValue("0xdef");
    expect(() => mutationFn("wave")).toThrow("The active profile changed");
    expect(pinnedWavesApi.pinWave).not.toHaveBeenCalled();
    expect(pinnedWavesApi.unpinWave).not.toHaveBeenCalled();

    jest.mocked(getWalletAddress).mockReturnValue("0xabc");
    await mutationFn("wave");
    expect(
      index === 0 ? pinnedWavesApi.pinWave : pinnedWavesApi.unpinWave
    ).toHaveBeenCalledWith("wave");
  }
);

test.each(["pinWave", "unpinWave"] as const)(
  "%s cancels when a proxy becomes active during authentication",
  async (action) => {
    requestAuth.mockImplementation(async () => {
      jest.mocked(getAuthJwt).mockReturnValue(createAuthJwt("proxy-1"));
      return { success: true };
    });
    const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });
    await expect(result.current[action]("wave")).rejects.toThrow(
      "The active profile changed"
    );
    expect(pinMutateAsync).not.toHaveBeenCalled();
    expect(unpinMutateAsync).not.toHaveBeenCalled();
    expect(queryClientMock.setQueryData).not.toHaveBeenCalled();
    expect(result.current.isOperationInProgress("wave")).toBe(false);
  }
);

test.each(["pinWave", "unpinWave"] as const)(
  "%s accepts a primary JWT when saved proxy metadata is stale",
  async (action) => {
    jest.mocked(getWalletRole).mockReturnValue("stale-proxy");
    const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });

    await result.current[action]("wave");

    expect(
      action === "pinWave" ? pinMutateAsync : unpinMutateAsync
    ).toHaveBeenCalledWith("wave");
    const index = action === "pinWave" ? 0 : 1;
    await useMutationMock.mock.calls[index][0].mutationFn("wave");
    expect(
      action === "pinWave" ? pinnedWavesApi.pinWave : pinnedWavesApi.unpinWave
    ).toHaveBeenCalledWith("wave");
  }
);

test.each([null, undefined])(
  "accepts a legacy token without a primary profile role (%s)",
  async (role) => {
    jest.mocked(getAuthJwt).mockReturnValue(createAuthJwt(role));
    const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });

    await result.current.pinWave("wave");
    await result.current.unpinWave("wave");

    expect(pinMutateAsync).toHaveBeenCalledWith("wave");
    expect(unpinMutateAsync).toHaveBeenCalledWith("wave");
  }
);

test.each([null, "invalid-jwt", createAuthJwt("proxy-1")])(
  "rejects an absent, malformed, or proxy JWT before changing pin state (%s)",
  async (jwt) => {
    const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });
    jest.mocked(getAuthJwt).mockReturnValue(jwt);

    for (const action of ["pinWave", "unpinWave"] as const) {
      await expect(result.current[action]("wave")).rejects.toThrow(
        "The active profile changed"
      );
      expect(result.current.isOperationInProgress("wave")).toBe(false);
    }
    expect(pinMutateAsync).not.toHaveBeenCalled();
    expect(unpinMutateAsync).not.toHaveBeenCalled();
    expect(queryClientMock.setQueryData).not.toHaveBeenCalled();
    for (const [options] of useMutationMock.mock.calls) {
      expect(() => options.mutationFn("wave")).toThrow(
        "The active profile changed"
      );
    }
    expect(pinnedWavesApi.pinWave).not.toHaveBeenCalled();
    expect(pinnedWavesApi.unpinWave).not.toHaveBeenCalled();
  }
);

test.each(["pinWave", "unpinWave"] as const)(
  "%s authenticates before changing pin state",
  async (action) => {
    let finishAuth!: (value: { success: boolean }) => void;
    requestAuth.mockReturnValue(
      new Promise((resolve) => {
        finishAuth = resolve;
      })
    );
    const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });
    const operation = result.current[action]("wave");
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(pinMutateAsync).not.toHaveBeenCalled();
    expect(unpinMutateAsync).not.toHaveBeenCalled();
    finishAuth({ success: true });
    await operation;
    expect(
      action === "pinWave" ? pinMutateAsync : unpinMutateAsync
    ).toHaveBeenCalledWith("wave");
  }
);

test.each(["pinWave", "unpinWave"] as const)(
  "%s leaves pin state intact when authentication fails",
  async (action) => {
    requestAuth.mockResolvedValue({ success: false });
    const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });
    await result.current[action]("wave");
    expect(pinMutateAsync).not.toHaveBeenCalled();
    expect(unpinMutateAsync).not.toHaveBeenCalled();
    expect(queryClientMock.setQueryData).not.toHaveBeenCalled();
    expect(result.current.isOperationInProgress("wave")).toBe(false);
  }
);

test.each(["pinWave", "unpinWave"] as const)(
  "%s cancels when the account changes during authentication",
  async (action) => {
    requestAuth.mockImplementation(async () => {
      jest.mocked(getWalletAddress).mockReturnValue("0xdef");
      return { success: true };
    });
    const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });
    await expect(result.current[action]("wave")).rejects.toThrow(
      "The active profile changed"
    );
    expect(pinMutateAsync).not.toHaveBeenCalled();
    expect(unpinMutateAsync).not.toHaveBeenCalled();
    expect(queryClientMock.setQueryData).not.toHaveBeenCalled();
  }
);

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

test.each(["pinWave", "unpinWave"] as const)(
  "%s propagates authentication errors and releases the pending operation",
  async (action) => {
    requestAuth.mockRejectedValue(new Error("Authentication unavailable"));
    const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });
    await expect(result.current[action]("wave")).rejects.toThrow(
      "Authentication unavailable"
    );
    expect(pinMutateAsync).not.toHaveBeenCalled();
    expect(unpinMutateAsync).not.toHaveBeenCalled();
    expect(queryClientMock.setQueryData).not.toHaveBeenCalled();
    expect(result.current.isOperationInProgress("wave")).toBe(false);
  }
);

test.each([
  [0, "wallet"],
  [1, "wallet"],
  [0, "proxy"],
  [1, "proxy"],
] as const)(
  "pin mutation %s rejects a %s switch while cancelling queries before optimistic writes",
  async (index, switchType) => {
    let finishCancellation!: () => void;
    queryClientMock.cancelQueries.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishCancellation = resolve;
      })
    );
    renderHook(() => usePinnedWavesServer(), { wrapper });
    const { onMutate } = useMutationMock.mock.calls[index][0];
    const operation = onMutate("wave");
    if (switchType === "wallet") {
      jest.mocked(getWalletAddress).mockReturnValue("0xdef");
    } else {
      jest.mocked(getAuthJwt).mockReturnValue(createAuthJwt("other-profile"));
    }
    finishCancellation();
    await expect(operation).rejects.toThrow("The active profile changed");
    expect(queryClientMock.setQueryData).not.toHaveBeenCalled();
    expect(pinnedWavesApi.pinWave).not.toHaveBeenCalled();
    expect(pinnedWavesApi.unpinWave).not.toHaveBeenCalled();
  }
);
