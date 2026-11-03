import { AuthContext } from "@/components/auth/Auth";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { useMemesWaveFooterStats } from "@/hooks/useMemesWaveFooterStats";
import { getMemesQuickVoteUndiscoveredDropQueryKey } from "@/hooks/memesQuickVote.query";
import { useMemesQuickVoteQueue } from "@/hooks/useMemesQuickVoteQueue";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";

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

const getAmountsStorageKey = (
  memesWaveId = DEFAULT_MEMES_WAVE_ID,
  contextProfile = DEFAULT_CONTEXT_PROFILE
) => `memesQuickVoteAmounts:${memesWaveId}:${contextProfile}`;

const createWrapper = ({
  activeProfileProxy = null,
  connectedProfileHandle = DEFAULT_CONTEXT_PROFILE,
  requestAuth = jest.fn().mockResolvedValue({ success: true }),
  setToast = jest.fn(),
  queryClient: providedQueryClient,
}: {
  readonly activeProfileProxy?: { readonly id: string } | null;
  readonly connectedProfileHandle?: string | null;
  readonly requestAuth?: jest.Mock;
  readonly setToast?: jest.Mock;
  readonly queryClient?: QueryClient;
} = {}) => {
  const queryClient =
    providedQueryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
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
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

const createDrop = ({
  id,
  serialNo,
  rating = 0,
  minRating = 0,
  maxRating = 5_000,
}: {
  readonly id: string;
  readonly serialNo: number;
  readonly rating?: number;
  readonly minRating?: number;
  readonly maxRating?: number;
}) =>
  ({
    id,
    serial_no: serialNo,
    drop_type: ApiDropType.Participatory,
    context_profile_context: {
      rating,
      min_rating: minRating,
      max_rating: maxRating,
    },
    wave: DEFAULT_WAVE,
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

describe("useMemesQuickVoteQueue", () => {
  let currentUndiscoveredDrops: any[];
  let leftThisRoundCount: number;
  let totalCount: number;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    currentUndiscoveredDrops = [];
    leftThisRoundCount = 0;
    totalCount = 0;

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

      if (endpoint === `waves/${DEFAULT_MEMES_WAVE_ID}/undiscovered-drop`) {
        const skip = Number(params?.skip ?? "0");

        return {
          drop: currentUndiscoveredDrops[skip] ?? null,
          left_to_vote_in_current_round: leftThisRoundCount,
          total_count: totalCount,
        } as any;
      }

      if (endpoint === `waves/${DEFAULT_MEMES_WAVE_ID}/undiscovered-drops`) {
        const skip = Number(params?.["skip"] ?? "0");
        const limit = Number(params?.["limit"] ?? "4");
        return {
          drops: currentUndiscoveredDrops.slice(skip, skip + limit),
          left_to_vote_in_current_round: leftThisRoundCount,
          total_count: totalCount,
        } as any;
      }

      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });
  });

  it("loads the preview window once and shares its counts with the footer", async () => {
    const drops = [40, 30, 20, 10].map((serialNo) =>
      createDrop({ id: `drop-${serialNo}`, serialNo })
    );
    currentUndiscoveredDrops = drops;
    leftThisRoundCount = 3;
    totalCount = 8;
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      getMemesQuickVoteUndiscoveredDropQueryKey({
        contextProfile: DEFAULT_CONTEXT_PROFILE,
        proxyId: null,
        sessionId: 0,
        skip: 0,
        waveId: DEFAULT_MEMES_WAVE_ID,
      }),
      { drop: drops[0], total_count: 8, left_to_vote_in_current_round: 3 }
    );
    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper({ queryClient }),
      }
    );
    await waitFor(() =>
      expect(result.current.activeDrop?.id).toBe(drops[0].id)
    );
    await waitFor(() => expect(result.current.nextDrop?.id).toBe(drops[1].id));
    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: `waves/${DEFAULT_MEMES_WAVE_ID}/undiscovered-drops`,
        params: { skip: "1", limit: "3" },
      })
    );
    expect(
      queryClient.getQueryData(
        getMemesQuickVoteUndiscoveredDropQueryKey({
          contextProfile: DEFAULT_CONTEXT_PROFILE,
          proxyId: null,
          sessionId: 0,
          skip: 0,
          waveId: DEFAULT_MEMES_WAVE_ID,
        })
      )
    ).toEqual({
      drop: drops[0],
      total_count: 8,
      left_to_vote_in_current_round: 3,
    });
  });

  it("refreshes the footer when the post-vote batch fails", async () => {
    const first = createDrop({ id: "first", serialNo: 2 });
    const second = createDrop({ id: "second", serialNo: 1 });
    currentUndiscoveredDrops = [first, second];
    leftThisRoundCount = 2;
    totalCount = 2;
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      getMemesQuickVoteUndiscoveredDropQueryKey({
        contextProfile: DEFAULT_CONTEXT_PROFILE,
        proxyId: null,
        sessionId: 0,
        skip: 0,
        waveId: DEFAULT_MEMES_WAVE_ID,
      }),
      { drop: first, total_count: 2, left_to_vote_in_current_round: 2 }
    );
    const { result } = renderHook(
      () => ({
        queue: useMemesQuickVoteQueue({ sessionId: 1 }),
        footer: useMemesWaveFooterStats(),
      }),
      { wrapper: createWrapper({ queryClient }) }
    );
    await waitFor(() =>
      expect(result.current.queue.activeDrop?.id).toBe(first.id)
    );
    const fetchAvailableData = commonApiFetchMock.getMockImplementation()!;
    commonApiFetchMock.mockImplementation((request) => {
      if (request.endpoint.endsWith("/undiscovered-drops")) {
        return Promise.reject(new Error("Batch unavailable"));
      }
      return fetchAvailableData(request);
    });
    commonApiPostMock.mockImplementationOnce(async () => {
      currentUndiscoveredDrops = [second];
      leftThisRoundCount = 1;
      totalCount = 1;
      return {} as any;
    });
    await act(async () => {
      await result.current.queue.submitVote(
        result.current.queue.activeDrop!,
        250
      );
    });
    await waitFor(() => expect(result.current.footer.unratedCount).toBe(1));
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: `waves/${DEFAULT_MEMES_WAVE_ID}/undiscovered-drop`,
      })
    );
  });

  it("hydrates signed recent quick-vote amounts from storage on mount", () => {
    localStorage.setItem(
      getAmountsStorageKey(),
      JSON.stringify([-250, 500, 0, 250])
    );

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ enabled: false, sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    expect(result.current.recentAmounts).toEqual([-250, 250, 500]);
    expect(result.current.latestUsedAmount).toBe(250);
  });

  it("submits, stores, and advances a negative vote immediately", async () => {
    const drop30 = createDrop({
      id: "drop-30",
      serialNo: 30,
      minRating: -5_000,
      maxRating: 5_000,
    });
    const drop20 = createDrop({
      id: "drop-20",
      serialNo: 20,
      minRating: -5_000,
      maxRating: 5_000,
    });
    const drop10 = createDrop({
      id: "drop-10",
      serialNo: 10,
      minRating: -5_000,
      maxRating: 5_000,
    });
    const deferredVote = createDeferred<any>();

    currentUndiscoveredDrops = [drop30, drop20, drop10];
    leftThisRoundCount = 3;
    totalCount = 3;
    commonApiPostMock.mockImplementationOnce(() => deferredVote.promise);

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));

    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, -250);
    });

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop20.id));
    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalledTimes(1));

    expect(commonApiPostMock).toHaveBeenCalledWith({
      endpoint: `drops/${drop30.id}/ratings`,
      body: {
        rating: -250,
        category: "Rep",
      },
    });
    expect(readStoredNumbers(getAmountsStorageKey())).toEqual([-250]);
    expect(result.current.latestUsedAmount).toBe(-250);
    expect(result.current.activeDrop?.context_profile_context?.max_rating).toBe(
      4_750
    );
    expect(result.current.activeDrop?.context_profile_context?.min_rating).toBe(
      -4_750
    );
    expect(result.current.nextDrop?.context_profile_context?.max_rating).toBe(
      4_750
    );
    expect(result.current.nextDrop?.context_profile_context?.min_rating).toBe(
      -4_750
    );

    await act(async () => {
      deferredVote.resolve(
        createDrop({
          id: drop30.id,
          serialNo: drop30.serial_no,
          rating: -250,
          minRating: -4_750,
          maxRating: 4_750,
        })
      );
      await Promise.resolve();
    });
  });

  it("keeps positive-only waves from submitting negative quick-vote amounts", async () => {
    const drop30 = createDrop({
      id: "drop-30",
      serialNo: 30,
      minRating: 0,
      maxRating: 5_000,
    });

    currentUndiscoveredDrops = [drop30];
    leftThisRoundCount = 1;
    totalCount = 1;
    commonApiPostMock.mockResolvedValueOnce(
      createDrop({
        id: drop30.id,
        serialNo: drop30.serial_no,
        rating: 1,
        minRating: 0,
        maxRating: 4_999,
      })
    );

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));

    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, -250);
    });

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalledTimes(1));
    expect(commonApiPostMock).toHaveBeenCalledWith({
      endpoint: `drops/${drop30.id}/ratings`,
      body: {
        rating: 1,
        category: "Rep",
      },
    });
    expect(readStoredNumbers(getAmountsStorageKey())).toEqual([1]);
  });

  it("does not queue draft-only signed amounts", async () => {
    const drop30 = createDrop({
      id: "drop-30",
      serialNo: 30,
      minRating: -5_000,
      maxRating: 5_000,
    });

    currentUndiscoveredDrops = [drop30];
    leftThisRoundCount = 1;
    totalCount = 1;

    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.activeDrop?.id).toBe(drop30.id));

    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, "-");
      await result.current.submitVote(result.current.activeDrop!, "0");
      await result.current.submitVote(result.current.activeDrop!, "");
    });

    expect(commonApiPostMock).not.toHaveBeenCalled();
    expect(readStoredNumbers(getAmountsStorageKey())).toEqual([]);
    expect(result.current.activeDrop?.id).toBe(drop30.id);
  });
  it.each([
    { connectedProfileHandle: null },
    { activeProfileProxy: { id: "proxy" } },
  ])(
    "does not discover or show candidates without an eligible profile: %o",
    async (options) => {
      const { result } = renderHook(
        () => useMemesQuickVoteQueue({ sessionId: 1 }),
        { wrapper: createWrapper(options) }
      );
      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current.activeDrop).toBeNull();
      expect(commonApiFetchMock).not.toHaveBeenCalled();
    }
  );

  it("restores counts and power after a rejected stale vote and shows the server error", async () => {
    currentUndiscoveredDrops = [
      createDrop({ id: "first", serialNo: 2 }),
      createDrop({ id: "next", serialNo: 1 }),
    ];
    leftThisRoundCount = totalCount = 2;
    const setToast = jest.fn();
    commonApiPostMock.mockRejectedValueOnce("Voting is closed in this wave");
    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      { wrapper: createWrapper({ setToast }) }
    );
    await waitFor(() => expect(result.current.nextDrop?.id).toBe("next"));
    await act(async () => {
      await result.current.submitVote(result.current.activeDrop!, 100);
    });
    await waitFor(() =>
      expect(setToast).toHaveBeenCalledWith({
        message: "Voting is closed in this wave",
        type: "error",
      })
    );
    await waitFor(() => expect(result.current.unratedCount).toBe(2));
    expect(result.current.leftThisRoundCount).toBe(2);
    expect(result.current.uncastPower).toBe(5000);
    expect(result.current.activeDrop).not.toBeNull();
    expect(result.current.submissionError).toBe(
      "Voting is closed in this wave"
    );
  });

  it("updates unrated count only for a vote, while skip updates the round count", async () => {
    currentUndiscoveredDrops = [
      createDrop({ id: "first", serialNo: 2 }),
      createDrop({ id: "next", serialNo: 1 }),
    ];
    leftThisRoundCount = totalCount = 2;
    const pending = createDeferred<ApiDrop>();
    commonApiPostMock.mockReturnValueOnce(pending.promise);
    const { result, unmount } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.nextDrop?.id).toBe("next"));
    await act(async () => {
      await result.current.skipDrop(result.current.activeDrop!);
    });
    expect(result.current.unratedCount).toBe(2);
    expect(result.current.leftThisRoundCount).toBe(1);
    expect(result.current.uncastPower).toBe(5000);
    unmount();
  });
  it("keeps the power cap for older buffered candidates after refreshing the current one", async () => {
    currentUndiscoveredDrops = [
      createDrop({ id: "first", serialNo: 3, maxRating: 1000 }),
      createDrop({ id: "next", serialNo: 2, maxRating: 1000 }),
      createDrop({ id: "third", serialNo: 1, maxRating: 1000 }),
    ];
    leftThisRoundCount = totalCount = 3;
    const { result } = renderHook(
      () => useMemesQuickVoteQueue({ sessionId: 1 }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.nextDrop?.id).toBe("next"));
    currentUndiscoveredDrops = [
      createDrop({ id: "next", serialNo: 2, maxRating: 900 }),
      createDrop({ id: "third", serialNo: 1, maxRating: 900 }),
    ];
    leftThisRoundCount = totalCount = 2;
    await act(async () =>
      result.current.submitVote(result.current.activeDrop!, 100)
    );
    await act(async () => result.current.retryDiscovery());
    expect(result.current.uncastPower).toBe(900);
    act(() => {
      void result.current.skipDrop(result.current.activeDrop!);
    });
    expect(result.current.activeDrop?.id).toBe("third");
    expect(result.current.uncastPower).toBe(900);
    await act(async () => Promise.resolve());
  });

  it.each([100, 1000])(
    "uses fresh server power after a closed buffer expires following a %i vote",
    async (amount) => {
      jest.useFakeTimers();
      try {
        const first = createDrop({ id: "first", serialNo: 2, maxRating: 1000 });
        const next = createDrop({ id: "next", serialNo: 1, maxRating: 1000 });
        currentUndiscoveredDrops = [first, next];
        leftThisRoundCount = totalCount = 2;
        const { result, rerender } = renderHook(
          ({ enabled }) => useMemesQuickVoteQueue({ sessionId: 1, enabled }),
          { wrapper: createWrapper(), initialProps: { enabled: true } }
        );
        await act(async () => jest.advanceTimersByTimeAsync(1));
        expect(result.current.nextDrop?.id).toBe("next");
        currentUndiscoveredDrops = [
          createDrop({ id: "next", serialNo: 1, maxRating: 1000 - amount }),
        ];
        leftThisRoundCount = totalCount = 1;
        await act(async () =>
          result.current.submitVote(result.current.activeDrop!, amount)
        );
        await act(async () => jest.advanceTimersByTimeAsync(1));
        expect(result.current.uncastPower).toBe(
          amount === 1000 ? null : 1000 - amount
        );
        rerender({ enabled: false });
        await act(async () => jest.advanceTimersByTimeAsync(60_001));
        currentUndiscoveredDrops = [
          createDrop({ id: "next", serialNo: 1, maxRating: 1000 }),
        ];
        rerender({ enabled: true });
        await act(async () => jest.advanceTimersByTimeAsync(1));
        expect(result.current.uncastPower).toBe(1000);
      } finally {
        jest.useRealTimers();
      }
    }
  );

  it("refreshes the footer when a pending vote settles after the dialog closes", async () => {
    const first = createDrop({ id: "first", serialNo: 2 });
    const next = createDrop({ id: "next", serialNo: 1 });
    currentUndiscoveredDrops = [first, next];
    leftThisRoundCount = totalCount = 2;
    const pending = createDeferred<ApiDrop>();
    commonApiPostMock.mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderHook(
      ({ enabled }) => ({
        queue: useMemesQuickVoteQueue({ sessionId: 1, enabled }),
        footer: useMemesWaveFooterStats(),
      }),
      { wrapper: createWrapper(), initialProps: { enabled: true } }
    );
    await waitFor(() => expect(result.current.queue.nextDrop?.id).toBe("next"));
    await act(async () =>
      result.current.queue.submitVote(result.current.queue.activeDrop!, 100)
    );
    rerender({ enabled: false });
    const before = commonApiFetchMock.mock.calls.length;
    currentUndiscoveredDrops = [next];
    leftThisRoundCount = totalCount = 1;
    await act(async () =>
      pending.resolve({
        ...first,
        context_profile_context: {
          ...first.context_profile_context,
          rating: 100,
        },
      })
    );
    await waitFor(() => expect(result.current.footer.unratedCount).toBe(1));
    expect(result.current.footer.isAvailable).toBe(true);
    expect(commonApiFetchMock).toHaveBeenCalledTimes(before + 1);
  });
});
