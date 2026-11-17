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
import {
  getAuthJwt,
  getWalletAddress,
  getWalletRole,
} from "@/services/auth/auth.utils";
import { pinnedWavesApi } from "@/services/api/pinned-waves-api";

jest.mock("@/services/api/pinned-waves-api", () => ({
  pinnedWavesApi: {
    getPinnedWaves: jest.fn(),
    updateOrder: jest.fn(),
    pinWave: jest.fn(),
    unpinWave: jest.fn(),
  },
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
    mapApiWaveOverviewToSidebarWave: jest.fn((wave) => wave),
  };
});

const useMutationMock = useMutation as jest.Mock;
const useQueryMock = useQuery as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const useSeizeConnectContextMock = useSeizeConnectContext as jest.Mock;
const useSeizeSettingsOptionalMock = useSeizeSettingsOptional as jest.Mock;

const useOfficialWavesMock = require("@/hooks/useOfficialWaves")
  .useOfficialWaves as jest.Mock;

const queryClientMock = {
  cancelQueries: jest.fn().mockResolvedValue(undefined),
  getQueryData: jest.fn(),
  getQueriesData: jest.fn().mockReturnValue([]),
  invalidateQueries: jest.fn(),
  refetchQueries: jest.fn().mockResolvedValue(undefined),
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

const getPinnedWavesQueryOptions = (): {
  readonly queryFn: (options: { signal: AbortSignal }) => Promise<unknown>;
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
  queryClientMock.cancelQueries.mockReset().mockResolvedValue(undefined);
  queryClientMock.getQueryData.mockReset();
  queryClientMock.setQueryData.mockReset();
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

test("loads all pins in saved order in one request", async () => {
  jest
    .mocked(pinnedWavesApi.getPinnedWaves)
    .mockResolvedValue([
      { ...createWave("wave-2"), pinned: false },
      createWave("wave-1"),
    ]);
  renderHook(() => usePinnedWavesServer(), { wrapper });

  const { signal } = new AbortController();
  await expect(
    getPinnedWavesQueryOptions().queryFn({ signal })
  ).resolves.toEqual([createWave("wave-2"), createWave("wave-1")]);
  expect(pinnedWavesApi.getPinnedWaves).toHaveBeenCalledTimes(1);
  expect(pinnedWavesApi.getPinnedWaves).toHaveBeenCalledWith(signal);
});

test("rolls back a failed reorder while preserving a pin added during the save", async () => {
  const a = createWave("a");
  const b = createWave("b");
  const added = createWave("added");
  let current = [a, b];
  queryClientMock.getQueryData.mockImplementation(() => current);
  queryClientMock.setQueryData.mockImplementation((_key, data) => {
    current = typeof data === "function" ? data(current) : data;
  });
  jest.mocked(pinnedWavesApi.updateOrder).mockImplementationOnce(async () => {
    current = [...current, added];
    throw new Error("Conflict");
  });
  renderHook(() => usePinnedWavesServer(), { wrapper });
  const { mutationFn } = useMutationMock.mock.calls[2][0];

  await expect(
    mutationFn({ previousIds: ["a", "b"], nextIds: ["b", "a"] })
  ).rejects.toThrow("Conflict");

  expect(pinnedWavesApi.updateOrder).toHaveBeenCalledWith({
    previous_wave_ids: ["a", "b"],
    wave_ids: ["b", "a"],
  });
  expect(current).toEqual([a, b, added]);
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
    for (const [options] of useMutationMock.mock.calls.slice(0, 2)) {
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

test("refreshes saved order on window focus even when the cache is fresh", () => {
  renderHook(() => usePinnedWavesServer(), { wrapper });

  expect(useQueryMock).toHaveBeenCalledWith(
    expect.objectContaining({
      refetchOnWindowFocus: "always",
      staleTime: 5 * 60 * 1000,
    })
  );
});

test("refetchIfStale refreshes only the stale, active pinned query without cancelling", () => {
  const { result } = renderHook(() => usePinnedWavesServer(), { wrapper });

  result.current.refetchIfStale();

  expect(queryClientMock.refetchQueries).toHaveBeenCalledTimes(1);
  expect(queryClientMock.refetchQueries).toHaveBeenCalledWith(
    {
      queryKey: getPinnedWavesQueryOptions().queryKey,
      exact: true,
      type: "active",
      stale: true,
    },
    { cancelRefetch: false }
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
    const operation = expect(onMutate("wave")).rejects.toThrow(
      "The active profile changed"
    );
    if (switchType === "wallet") {
      jest.mocked(getWalletAddress).mockReturnValue("0xdef");
    } else {
      jest.mocked(getAuthJwt).mockReturnValue(createAuthJwt("other-profile"));
    }
    finishCancellation();
    await operation;
    expect(queryClientMock.setQueryData).not.toHaveBeenCalled();
    expect(pinnedWavesApi.pinWave).not.toHaveBeenCalled();
    expect(pinnedWavesApi.unpinWave).not.toHaveBeenCalled();
  }
);
