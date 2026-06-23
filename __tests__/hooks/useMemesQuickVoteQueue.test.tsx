import { AuthContext } from "@/components/auth/Auth";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
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
}: {
  readonly activeProfileProxy?: { readonly id: string } | null;
  readonly connectedProfileHandle?: string | null;
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

      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });
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
});
