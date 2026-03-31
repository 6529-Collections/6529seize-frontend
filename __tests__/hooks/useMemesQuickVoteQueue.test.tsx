import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { useMemesQuickVoteQueue } from "@/hooks/useMemesQuickVoteQueue";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

const useSeizeSettingsMock = useSeizeSettings as jest.MockedFunction<
  typeof useSeizeSettings
>;
const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;
const commonApiPostMock = commonApiPost as jest.MockedFunction<
  typeof commonApiPost
>;

const DEFAULT_CONTEXT_PROFILE = "me";
const DEFAULT_MEMES_WAVE_ID = "memes-wave";
const DEFAULT_WAVE = {
  id: DEFAULT_MEMES_WAVE_ID,
  name: "The Memes",
  voting_credit_type: ApiWaveCreditType.Tdh,
  authenticated_user_eligible_to_vote: true,
  voting_period_start: null,
  voting_period_end: null,
} as const;

const getSkippedStorageKey = (
  memesWaveId = DEFAULT_MEMES_WAVE_ID,
  contextProfile = DEFAULT_CONTEXT_PROFILE
) => `memesQuickVoteSkipped:${memesWaveId}:${contextProfile}`;

const getAmountsStorageKey = (
  memesWaveId = DEFAULT_MEMES_WAVE_ID,
  contextProfile = DEFAULT_CONTEXT_PROFILE
) => `memesQuickVoteAmounts:${memesWaveId}:${contextProfile}`;

const createWrapper = ({
  activeProfileProxy = null,
  connectedProfileHandle = DEFAULT_CONTEXT_PROFILE,
  invalidateDrops = jest.fn(),
  requestAuth = jest.fn().mockResolvedValue({ success: false }),
  setToast = jest.fn(),
}: {
  readonly activeProfileProxy?: { readonly id: string } | null;
  readonly connectedProfileHandle?: string | null;
  readonly invalidateDrops?: jest.Mock;
  readonly requestAuth?: jest.Mock;
  readonly setToast?: jest.Mock;
} = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={
          {
            connectedProfile: connectedProfileHandle
              ? {
                  id: "profile-1",
                  handle: connectedProfileHandle,
                  primary_wallet: "0x123",
                }
              : null,
            activeProfileProxy,
            requestAuth,
            setToast,
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider value={{ invalidateDrops } as any}>
          {children}
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

const createDrop = ({
  id,
  serialNo,
  rating = 0,
  maxRating = 5_000,
  eligible = true,
}: {
  readonly id: string;
  readonly serialNo: number;
  readonly rating?: number;
  readonly maxRating?: number;
  readonly eligible?: boolean;
}) =>
  ({
    id,
    serial_no: serialNo,
    drop_type: ApiDropType.Participatory,
    context_profile_context: {
      rating,
      max_rating: maxRating,
    },
    wave: {
      ...DEFAULT_WAVE,
      authenticated_user_eligible_to_vote: eligible,
    },
    author: {
      handle: `artist-${serialNo}`,
      primary_address: `0x${serialNo}`,
    },
    title: null,
    reply_to: null,
    parts: [
      {
        content: `content-${serialNo}`,
        media: [],
      },
    ],
    metadata: [],
    created_at: new Date(serialNo * 1_000).toISOString(),
  }) as any;

const readStoredStrings = (key: string): string[] =>
  JSON.parse(localStorage.getItem(key) || "[]");

const readStoredNumbers = (key: string): number[] =>
  JSON.parse(localStorage.getItem(key) || "[]");

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const getLeaderboardFetchCalls = (pageSize: number) =>
  commonApiFetchMock.mock.calls.filter(([request]) => {
    const candidate = request as {
      readonly endpoint: string;
      readonly params?: Record<string, string>;
    };

    return (
      candidate.endpoint === `waves/${DEFAULT_MEMES_WAVE_ID}/leaderboard` &&
      candidate.params?.page_size === `${pageSize}`
    );
  });

describe("useMemesQuickVoteQueue", () => {
  let currentLeaderboardIds: string[];
  let currentLeaderboardDropsById: Record<string, any>;
  let currentHydratedDropsById: Record<string, any>;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    currentLeaderboardIds = [];
    currentLeaderboardDropsById = {};
    currentHydratedDropsById = {};

    useSeizeSettingsMock.mockReturnValue({
      isLoaded: true,
      seizeSettings: {
        memes_wave_id: DEFAULT_MEMES_WAVE_ID,
      },
    } as any);

    commonApiPostMock.mockResolvedValue({} as any);
    commonApiFetchMock.mockImplementation(async (request: any) => {
      const { endpoint, params } = request as {
        readonly endpoint: string;
        readonly params?: Record<string, string>;
      };

      if (endpoint === `waves/${DEFAULT_MEMES_WAVE_ID}/leaderboard`) {
        const page = Number(params?.page ?? "1");
        const pageSize = Number(params?.page_size ?? "20");
        const startIndex = (page - 1) * pageSize;
        const pageIds = currentLeaderboardIds.slice(
          startIndex,
          startIndex + pageSize
        );

        return {
          count: currentLeaderboardIds.length,
          page,
          next: startIndex + pageSize < currentLeaderboardIds.length,
          wave: DEFAULT_WAVE,
          drops: pageIds.map((id) => currentLeaderboardDropsById[id]),
        } as any;
      }

      if (endpoint.startsWith("drops/")) {
        const dropId = endpoint.replace(/^drops\//, "");
        const drop = currentHydratedDropsById[dropId];

        if (!drop) {
          throw new Error("not found");
        }

        return drop;
      }

      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });
  });

  it("hydrates recent quick-vote amounts from storage on mount", () => {
    localStorage.setItem(
      getAmountsStorageKey(),
      JSON.stringify([500, 100, 250])
    );

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ enabled: false, sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    expect(result.current.recentAmounts).toEqual([100, 250, 500]);
    expect(result.current.latestUsedAmount).toBe(250);
  });

  it("persists skipped drop ids and advances to the next discovered item", async () => {
    const drop30 = createDrop({ id: "drop-30", serialNo: 30 });
    const drop20 = createDrop({ id: "drop-20", serialNo: 20 });
    const drop10 = createDrop({ id: "drop-10", serialNo: 10 });

    currentLeaderboardIds = [drop30.id, drop20.id, drop10.id];
    currentLeaderboardDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
      [drop10.id]: drop10,
    };
    currentHydratedDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
      [drop10.id]: drop10,
    };

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));

    act(() => {
      result.current.skipDrop(result.current.activeDrop!);
    });

    expect(readStoredStrings(getSkippedStorageKey())).toEqual([drop30.id]);

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop20.id));
    expect(result.current.queue.map((drop) => drop.id)).toEqual([
      drop20.id,
      drop10.id,
      drop30.id,
    ]);
    expect(result.current.remainingCount).toBe(3);
  });

  it("stores the vote amount, removes the voted item, and advances after a successful vote", async () => {
    const drop30 = createDrop({ id: "drop-30", serialNo: 30 });
    const drop20 = createDrop({ id: "drop-20", serialNo: 20 });
    const invalidateDrops = jest.fn();
    const requestAuth = jest.fn().mockResolvedValue({ success: true });

    currentLeaderboardIds = [drop30.id, drop20.id];
    currentLeaderboardDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
    };
    currentHydratedDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
    };

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper({
          invalidateDrops,
          requestAuth,
        }),
      }
    );

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));

    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, 250);
    });

    expect(commonApiPostMock).toHaveBeenCalledWith({
      endpoint: `drops/${drop30.id}/ratings`,
      body: {
        rating: 250,
        category: "Rep",
      },
    });
    expect(readStoredNumbers(getAmountsStorageKey())).toEqual([250]);
    expect(invalidateDrops).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop20.id));
    expect(result.current.latestUsedAmount).toBe(250);
    expect(result.current.queue.map((drop) => drop.id)).toEqual([drop20.id]);
  });

  it("advances immediately before the vote request resolves", async () => {
    const drop30 = createDrop({ id: "drop-30", serialNo: 30 });
    const drop20 = createDrop({ id: "drop-20", serialNo: 20 });
    const deferredVote = createDeferred<any>();
    const requestAuth = jest.fn().mockResolvedValue({ success: true });

    currentLeaderboardIds = [drop30.id, drop20.id];
    currentLeaderboardDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
    };
    currentHydratedDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
    };

    commonApiPostMock.mockImplementationOnce(() => deferredVote.promise);

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper({ requestAuth }),
      }
    );

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));

    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, 250);
    });

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop20.id));
    expect(result.current.latestUsedAmount).toBe(250);
    expect(readStoredNumbers(getAmountsStorageKey())).toEqual([250]);
    expect(commonApiPostMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferredVote.resolve(
        createDrop({
          id: drop30.id,
          serialNo: drop30.serial_no,
          rating: 250,
          maxRating: 4_750,
        })
      );
      await Promise.resolve();
    });
  });

  it("keeps advancing while an earlier vote is still in flight", async () => {
    const drop30 = createDrop({ id: "drop-30", serialNo: 30 });
    const drop20 = createDrop({ id: "drop-20", serialNo: 20 });
    const drop10 = createDrop({ id: "drop-10", serialNo: 10 });
    const firstVote = createDeferred<any>();
    const requestAuth = jest.fn().mockResolvedValue({ success: true });

    currentLeaderboardIds = [drop30.id, drop20.id, drop10.id];
    currentLeaderboardDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
      [drop10.id]: drop10,
    };
    currentHydratedDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
      [drop10.id]: drop10,
    };

    commonApiPostMock
      .mockImplementationOnce(() => firstVote.promise)
      .mockResolvedValueOnce(
        createDrop({
          id: drop20.id,
          serialNo: drop20.serial_no,
          rating: 500,
          maxRating: 4_000,
        })
      );

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper({ requestAuth }),
      }
    );

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));

    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, 250);
    });

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop20.id));

    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, 500);
    });

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop10.id));
    expect(commonApiPostMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstVote.resolve(
        createDrop({
          id: drop30.id,
          serialNo: drop30.serial_no,
          rating: 250,
          maxRating: 4_750,
        })
      );
      await Promise.resolve();
    });

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalledTimes(2));
    expect(commonApiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: `drops/${drop20.id}/ratings`,
      body: {
        rating: 500,
        category: "Rep",
      },
    });
  });

  it("treats zero optimistic remaining power as exhaustion while the next card is still refetching", async () => {
    const drop30 = createDrop({
      id: "drop-30",
      serialNo: 30,
      maxRating: 5_000,
    });
    const drop20 = createDrop({
      id: "drop-20",
      serialNo: 20,
      maxRating: 5_000,
    });
    const hydratedDrop20 = createDrop({
      id: drop20.id,
      serialNo: drop20.serial_no,
      maxRating: 0,
    });
    const deferredDrop20 = createDeferred<any>();
    const requestAuth = jest.fn().mockResolvedValue({ success: true });

    currentLeaderboardIds = [drop30.id, drop20.id];
    currentLeaderboardDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
    };
    currentHydratedDropsById = {
      [drop30.id]: drop30,
    };

    commonApiFetchMock.mockImplementation(async (request: any) => {
      const { endpoint, params } = request as {
        readonly endpoint: string;
        readonly params?: Record<string, string>;
      };

      if (endpoint === `waves/${DEFAULT_MEMES_WAVE_ID}/leaderboard`) {
        const page = Number(params?.page ?? "1");
        const pageSize = Number(params?.page_size ?? "20");
        const startIndex = (page - 1) * pageSize;
        const pageIds = currentLeaderboardIds.slice(
          startIndex,
          startIndex + pageSize
        );

        return {
          count: currentLeaderboardIds.length,
          page,
          next: startIndex + pageSize < currentLeaderboardIds.length,
          wave: DEFAULT_WAVE,
          drops: pageIds.map((id) => currentLeaderboardDropsById[id]),
        } as any;
      }

      if (endpoint === `drops/${drop20.id}`) {
        return deferredDrop20.promise;
      }

      if (endpoint === `drops/${drop30.id}`) {
        return drop30;
      }

      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });
    commonApiPostMock.mockResolvedValueOnce(
      createDrop({
        id: drop30.id,
        serialNo: drop30.serial_no,
        rating: 5_000,
        maxRating: 0,
      })
    );

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper({ requestAuth }),
      }
    );

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));

    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, 5_000);
    });

    await waitFor(() => expect(result.current.isExhausted).toBe(true));
    expect(result.current.activeDrop).toBeNull();
    expect(result.current.isReady).toBe(false);
    expect(result.current.uncastPower).toBeNull();
    expect(result.current.queue[0]?.context_profile_context?.max_rating).toBe(
      0
    );
    expect(commonApiPostMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferredDrop20.resolve(hydratedDrop20);
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.isExhausted).toBe(true));
    expect(result.current.queue.map((drop) => drop.id)).toEqual([drop20.id]);
    expect(result.current.queue[0]?.context_profile_context?.max_rating).toBe(
      0
    );
  });

  it("clears the optimistic cap after fresh next-card data arrives", async () => {
    const drop30 = createDrop({
      id: "drop-30",
      serialNo: 30,
      maxRating: 5_000,
    });
    const drop20 = createDrop({
      id: "drop-20",
      serialNo: 20,
      maxRating: 5_000,
    });
    const hydratedDrop20 = createDrop({
      id: drop20.id,
      serialNo: drop20.serial_no,
      maxRating: 1_200,
    });
    const deferredDrop20 = createDeferred<any>();
    const requestAuth = jest.fn().mockResolvedValue({ success: true });

    currentLeaderboardIds = [drop30.id, drop20.id];
    currentLeaderboardDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
    };
    currentHydratedDropsById = {
      [drop30.id]: drop30,
    };

    commonApiFetchMock.mockImplementation(async (request: any) => {
      const { endpoint, params } = request as {
        readonly endpoint: string;
        readonly params?: Record<string, string>;
      };

      if (endpoint === `waves/${DEFAULT_MEMES_WAVE_ID}/leaderboard`) {
        const page = Number(params?.page ?? "1");
        const pageSize = Number(params?.page_size ?? "20");
        const startIndex = (page - 1) * pageSize;
        const pageIds = currentLeaderboardIds.slice(
          startIndex,
          startIndex + pageSize
        );

        return {
          count: currentLeaderboardIds.length,
          page,
          next: startIndex + pageSize < currentLeaderboardIds.length,
          wave: DEFAULT_WAVE,
          drops: pageIds.map((id) => currentLeaderboardDropsById[id]),
        } as any;
      }

      if (endpoint === `drops/${drop20.id}`) {
        return deferredDrop20.promise;
      }

      if (endpoint === `drops/${drop30.id}`) {
        return drop30;
      }

      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });
    commonApiPostMock
      .mockResolvedValueOnce(
        createDrop({
          id: drop30.id,
          serialNo: drop30.serial_no,
          rating: 4_700,
          maxRating: 300,
        })
      )
      .mockResolvedValueOnce(
        createDrop({
          id: drop20.id,
          serialNo: drop20.serial_no,
          rating: 1_000,
          maxRating: 200,
        })
      );

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper({ requestAuth }),
      }
    );

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));

    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, 4_700);
    });

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop20.id));
    expect(result.current.activeDrop?.context_profile_context?.max_rating).toBe(
      300
    );

    await act(async () => {
      deferredDrop20.resolve(hydratedDrop20);
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(
        result.current.activeDrop?.context_profile_context?.max_rating
      ).toBe(1_200)
    );

    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, 1_000);
    });

    expect(commonApiPostMock).toHaveBeenNthCalledWith(2, {
      endpoint: `drops/${drop20.id}/ratings`,
      body: {
        rating: 1_000,
        category: "Rep",
      },
    });
  });

  it("keeps a lower server max rating when the next card refetch completes first", async () => {
    const drop30 = createDrop({
      id: "drop-30",
      serialNo: 30,
      maxRating: 5_000,
    });
    const drop20 = createDrop({
      id: "drop-20",
      serialNo: 20,
      maxRating: 5_000,
    });
    const hydratedDrop20 = createDrop({
      id: drop20.id,
      serialNo: drop20.serial_no,
      maxRating: 200,
    });
    const requestAuth = jest.fn().mockResolvedValue({ success: true });

    currentLeaderboardIds = [drop30.id, drop20.id];
    currentLeaderboardDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
    };
    currentHydratedDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: hydratedDrop20,
    };

    commonApiPostMock.mockResolvedValueOnce(
      createDrop({
        id: drop30.id,
        serialNo: drop30.serial_no,
        rating: 4_700,
        maxRating: 300,
      })
    );

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper({ requestAuth }),
      }
    );

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));

    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, 4_700);
    });

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop20.id));
    expect(result.current.activeDrop?.context_profile_context?.max_rating).toBe(
      200
    );
  });

  it("resets optimistic remaining power when the session changes", async () => {
    const drop30 = createDrop({
      id: "drop-30",
      serialNo: 30,
      maxRating: 5_000,
    });
    const drop20 = createDrop({
      id: "drop-20",
      serialNo: 20,
      maxRating: 5_000,
    });
    const deferredDrop20 = createDeferred<any>();
    const requestAuth = jest.fn().mockResolvedValue({ success: true });

    currentLeaderboardIds = [drop30.id, drop20.id];
    currentLeaderboardDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
    };
    currentHydratedDropsById = {
      [drop30.id]: drop30,
    };

    commonApiFetchMock.mockImplementation(async (request: any) => {
      const { endpoint, params } = request as {
        readonly endpoint: string;
        readonly params?: Record<string, string>;
      };

      if (endpoint === `waves/${DEFAULT_MEMES_WAVE_ID}/leaderboard`) {
        const page = Number(params?.page ?? "1");
        const pageSize = Number(params?.page_size ?? "20");
        const startIndex = (page - 1) * pageSize;
        const pageIds = currentLeaderboardIds.slice(
          startIndex,
          startIndex + pageSize
        );

        return {
          count: currentLeaderboardIds.length,
          page,
          next: startIndex + pageSize < currentLeaderboardIds.length,
          wave: DEFAULT_WAVE,
          drops: pageIds.map((id) => currentLeaderboardDropsById[id]),
        } as any;
      }

      if (endpoint === `drops/${drop20.id}`) {
        return deferredDrop20.promise;
      }

      if (endpoint === `drops/${drop30.id}`) {
        return drop30;
      }

      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });

    commonApiPostMock.mockResolvedValueOnce(
      createDrop({
        id: drop30.id,
        serialNo: drop30.serial_no,
        rating: 4_700,
        maxRating: 300,
      })
    );

    const { result, rerender } = renderHook(
      ({ sessionId }) => useMemesQuickVoteQueue({ sessionId }),
      {
        initialProps: { sessionId: 1 },
        wrapper: createWrapper({ requestAuth }),
      }
    );

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));

    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, 4_700);
    });

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop20.id));
    expect(result.current.activeDrop?.context_profile_context?.max_rating).toBe(
      300
    );

    rerender({ sessionId: 2 });

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));
    expect(result.current.activeDrop?.context_profile_context?.max_rating).toBe(
      5_000
    );
  });

  it("prunes invalidated skipped items before exhausting the queue", async () => {
    const leaderboardDrop = createDrop({ id: "drop-30", serialNo: 30 });
    const hydratedDrop = createDrop({
      id: "drop-30",
      serialNo: 30,
      rating: 1,
    });

    currentLeaderboardIds = [leaderboardDrop.id];
    currentLeaderboardDropsById = {
      [leaderboardDrop.id]: leaderboardDrop,
    };
    currentHydratedDropsById = {
      [hydratedDrop.id]: hydratedDrop,
    };
    localStorage.setItem(
      getSkippedStorageKey(),
      JSON.stringify([leaderboardDrop.id])
    );

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.isExhausted).toBe(true));

    expect(result.current.activeDrop).toBeNull();
    expect(result.current.queue).toEqual([]);
    expect(readStoredStrings(getSkippedStorageKey())).toEqual([]);

    expect(getLeaderboardFetchCalls(20)).toHaveLength(1);
  });

  it("refetches the shared summary when a hydrated drop is discarded", async () => {
    const leaderboardDrop = createDrop({ id: "drop-30", serialNo: 30 });
    const hydratedDrop = createDrop({
      id: leaderboardDrop.id,
      serialNo: leaderboardDrop.serial_no,
      rating: 1,
    });

    currentLeaderboardIds = [leaderboardDrop.id];
    currentLeaderboardDropsById = {
      [leaderboardDrop.id]: leaderboardDrop,
    };
    currentHydratedDropsById = {
      [hydratedDrop.id]: hydratedDrop,
    };
    localStorage.setItem(
      getSkippedStorageKey(),
      JSON.stringify([leaderboardDrop.id, "drop-20"])
    );

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.isExhausted).toBe(true));
    await waitFor(() => expect(getLeaderboardFetchCalls(1)).toHaveLength(2));

    expect(result.current.activeDrop).toBeNull();
    expect(result.current.queue).toEqual([]);
    expect(readStoredStrings(getSkippedStorageKey())).toEqual(["drop-20"]);
  });

  it("does not refetch the shared summary when the hydrated drop stays eligible", async () => {
    const leaderboardDrop = createDrop({ id: "drop-30", serialNo: 30 });

    currentLeaderboardIds = [leaderboardDrop.id];
    currentLeaderboardDropsById = {
      [leaderboardDrop.id]: leaderboardDrop,
    };
    currentHydratedDropsById = {
      [leaderboardDrop.id]: leaderboardDrop,
    };

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() =>
      expect(result.current.activeDrop?.id).toBe(leaderboardDrop.id)
    );

    expect(result.current.queue.map((drop) => drop.id)).toEqual([
      leaderboardDrop.id,
    ]);
    expect(getLeaderboardFetchCalls(1)).toHaveLength(1);
  });

  it("advances past a candidate whose hydrated drop fails after retries", async () => {
    const drop30 = createDrop({ id: "drop-30", serialNo: 30 });
    const drop20 = createDrop({ id: "drop-20", serialNo: 20 });

    currentLeaderboardIds = [drop30.id, drop20.id];
    currentLeaderboardDropsById = {
      [drop30.id]: drop30,
      [drop20.id]: drop20,
    };
    currentHydratedDropsById = {
      [drop20.id]: drop20,
    };

    commonApiFetchMock.mockImplementation(async (request: any) => {
      const { endpoint, params } = request as {
        readonly endpoint: string;
        readonly params?: Record<string, string>;
      };

      if (endpoint === `waves/${DEFAULT_MEMES_WAVE_ID}/leaderboard`) {
        const page = Number(params?.page ?? "1");
        const pageSize = Number(params?.page_size ?? "20");
        const startIndex = (page - 1) * pageSize;
        const pageIds = currentLeaderboardIds.slice(
          startIndex,
          startIndex + pageSize
        );

        return {
          count: currentLeaderboardIds.length,
          page,
          next: startIndex + pageSize < currentLeaderboardIds.length,
          wave: DEFAULT_WAVE,
          drops: pageIds.map((id) => currentLeaderboardDropsById[id]),
        } as any;
      }

      if (endpoint === `drops/${drop30.id}`) {
        throw new Error("network error");
      }

      if (endpoint === `drops/${drop20.id}`) {
        return drop20;
      }

      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));
    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop20.id), {
      timeout: 10_000,
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.queue.map((drop) => drop.id)).toEqual([drop20.id]);
    expect(readStoredStrings(getSkippedStorageKey())).toEqual([]);
  }, 15_000);

  it("keeps discovery failures retryable until the leaderboard loads", async () => {
    const leaderboardDrop = createDrop({ id: "drop-30", serialNo: 30 });
    let discoveryAttemptCount = 0;

    currentLeaderboardIds = [leaderboardDrop.id];
    currentLeaderboardDropsById = {
      [leaderboardDrop.id]: leaderboardDrop,
    };
    currentHydratedDropsById = {
      [leaderboardDrop.id]: leaderboardDrop,
    };

    commonApiFetchMock.mockImplementation(async (request: any) => {
      const { endpoint, params } = request as {
        readonly endpoint: string;
        readonly params?: Record<string, string>;
      };

      if (endpoint === `waves/${DEFAULT_MEMES_WAVE_ID}/leaderboard`) {
        const page = Number(params?.page ?? "1");
        const pageSize = Number(params?.page_size ?? "20");

        if (page === 1 && pageSize === 20) {
          discoveryAttemptCount += 1;

          if (discoveryAttemptCount === 1) {
            throw new Error("network error");
          }
        }

        const startIndex = (page - 1) * pageSize;
        const pageIds = currentLeaderboardIds.slice(
          startIndex,
          startIndex + pageSize
        );

        return {
          count: currentLeaderboardIds.length,
          page,
          next: startIndex + pageSize < currentLeaderboardIds.length,
          wave: DEFAULT_WAVE,
          drops: pageIds.map((id) => currentLeaderboardDropsById[id]),
        } as any;
      }

      if (endpoint.startsWith("drops/")) {
        const dropId = endpoint.replace(/^drops\//, "");
        const drop = currentHydratedDropsById[dropId];

        if (!drop) {
          throw new Error("not found");
        }

        return drop;
      }

      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.hasDiscoveryError).toBe(true));

    expect(result.current.isExhausted).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeDrop).toBeNull();

    act(() => {
      result.current.retryDiscovery();
    });

    await waitFor(() =>
      expect(result.current.activeDrop?.id).toBe(leaderboardDrop.id)
    );
    expect(result.current.hasDiscoveryError).toBe(false);

    expect(getLeaderboardFetchCalls(20)).toHaveLength(2);
  });

  it("treats missing wave ids as unavailable instead of loading forever", () => {
    useSeizeSettingsMock.mockReturnValue({
      isLoaded: true,
      seizeSettings: {
        memes_wave_id: null,
      },
    } as any);

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    expect(commonApiFetchMock).not.toHaveBeenCalled();
    expect(result.current.isExhausted).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeDrop).toBeNull();
  });

  it("keeps quick vote loading while seize settings are unresolved", () => {
    useSeizeSettingsMock.mockReturnValue({
      isLoaded: false,
      seizeSettings: {
        memes_wave_id: null,
      },
    } as any);

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    expect(commonApiFetchMock).not.toHaveBeenCalled();
    expect(result.current.isExhausted).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.activeDrop).toBeNull();
  });

  it("treats proxy sessions as unavailable instead of loading forever", () => {
    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper({
          activeProfileProxy: {
            id: "proxy-1",
          },
        }),
      }
    );

    expect(commonApiFetchMock).not.toHaveBeenCalled();
    expect(result.current.isExhausted).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeDrop).toBeNull();
  });
});
