import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { useMemesQuickVoteQueue } from "@/hooks/useMemesQuickVoteQueue";
import { useMemesWaveParticipatoryDrops } from "@/hooks/useMemesWaveParticipatoryDrops";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/hooks/useMemesWaveParticipatoryDrops", () => ({
  useMemesWaveParticipatoryDrops: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

const useMemesWaveParticipatoryDropsMock =
  useMemesWaveParticipatoryDrops as jest.Mock;
const commonApiPostMock = commonApiPost as jest.MockedFunction<
  typeof commonApiPost
>;

const DEFAULT_CONTEXT_PROFILE = "me";
const DEFAULT_MEMES_WAVE_ID = "memes-wave";

const getSkippedStorageKey = (
  memesWaveId = DEFAULT_MEMES_WAVE_ID,
  contextProfile = DEFAULT_CONTEXT_PROFILE
) => `memesQuickVoteSkipped:${memesWaveId}:${contextProfile}`;

const getAmountsStorageKey = (
  memesWaveId = DEFAULT_MEMES_WAVE_ID,
  contextProfile = DEFAULT_CONTEXT_PROFILE
) => `memesQuickVoteAmounts:${memesWaveId}:${contextProfile}`;

const createWrapper = ({
  invalidateDrops = jest.fn(),
  requestAuth = jest.fn().mockResolvedValue({ success: false }),
  setToast = jest.fn(),
}: {
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
      <AuthContext.Provider value={{ requestAuth, setToast } as any}>
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
      id: "wave-1",
      name: "The Memes",
      voting_credit_type: ApiWaveCreditType.Tdh,
      authenticated_user_eligible_to_vote: eligible,
    },
    author: {
      handle: `artist-${serialNo}`,
      primary_address: `0x${serialNo}`,
    },
    title: null,
    reply_to: null,
    parts: [],
    metadata: [],
    created_at: new Date(serialNo * 1_000).toISOString(),
  }) as any;

const readStoredNumbers = (key: string): number[] =>
  JSON.parse(localStorage.getItem(key) || "[]");

const readSkippedStorage = (key = getSkippedStorageKey()): number[] =>
  readStoredNumbers(key);

const readAmountsStorage = (key = getAmountsStorageKey()): number[] =>
  readStoredNumbers(key);

describe("useMemesQuickVoteQueue", () => {
  let currentDrops: any[] = [];
  let currentContextProfile = DEFAULT_CONTEXT_PROFILE;
  let currentMemesWaveId = DEFAULT_MEMES_WAVE_ID;
  let currentRefetch: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    currentDrops = [];
    currentContextProfile = DEFAULT_CONTEXT_PROFILE;
    currentMemesWaveId = DEFAULT_MEMES_WAVE_ID;
    currentRefetch = jest.fn().mockResolvedValue(undefined);
    commonApiPostMock.mockResolvedValue({} as any);

    useMemesWaveParticipatoryDropsMock.mockImplementation(() => ({
      drops: currentDrops,
      contextProfile: currentContextProfile,
      isPending: false,
      isRefetching: false,
      memesWaveId: currentMemesWaveId,
      refetch: currentRefetch,
    }));
  });

  it("hydrates recent quick-vote amounts from storage on mount", () => {
    localStorage.setItem(
      getAmountsStorageKey(),
      JSON.stringify([500, 100, 250])
    );

    const { result } = renderHook(() => useMemesQuickVoteQueue(), {
      wrapper: createWrapper(),
    });

    expect(result.current.recentAmounts).toEqual([100, 250, 500]);
    expect(result.current.latestUsedAmount).toBe(250);
  });

  it("reads recent quick-vote amounts from the active storage key when the context changes", () => {
    localStorage.setItem(getAmountsStorageKey(), JSON.stringify([300, 50]));
    localStorage.setItem(
      getAmountsStorageKey(DEFAULT_MEMES_WAVE_ID, "other"),
      JSON.stringify([600, 100])
    );

    const { result, rerender } = renderHook(() => useMemesQuickVoteQueue(), {
      wrapper: createWrapper(),
    });

    expect(result.current.recentAmounts).toEqual([50, 300]);
    expect(result.current.latestUsedAmount).toBe(50);

    currentContextProfile = "other";

    rerender();

    expect(result.current.recentAmounts).toEqual([100, 600]);
    expect(result.current.latestUsedAmount).toBe(100);
  });

  it("ignores dead skipped serials when building the queue and prunes storage", async () => {
    currentDrops = [
      createDrop({ id: "drop-40", serialNo: 40 }),
      createDrop({ id: "drop-30", serialNo: 30 }),
      createDrop({ id: "drop-20", serialNo: 20 }),
    ];
    localStorage.setItem(getSkippedStorageKey(), JSON.stringify([30, 999, 20]));

    const { result } = renderHook(() => useMemesQuickVoteQueue(), {
      wrapper: createWrapper(),
    });

    expect(result.current.queue.map((drop) => drop.serial_no)).toEqual([
      40, 30, 20,
    ]);

    await waitFor(() => {
      expect(readSkippedStorage()).toEqual([30, 20]);
    });
  });

  it("recomputes queue order when a skipped drop disappears and prunes storage", async () => {
    currentDrops = [
      createDrop({ id: "drop-40", serialNo: 40 }),
      createDrop({ id: "drop-30", serialNo: 30 }),
      createDrop({ id: "drop-20", serialNo: 20 }),
    ];
    localStorage.setItem(getSkippedStorageKey(), JSON.stringify([30, 20]));

    const { result, rerender } = renderHook(() => useMemesQuickVoteQueue(), {
      wrapper: createWrapper(),
    });

    expect(result.current.queue.map((drop) => drop.serial_no)).toEqual([
      40, 30, 20,
    ]);

    currentDrops = [
      createDrop({ id: "drop-40", serialNo: 40 }),
      createDrop({ id: "drop-20", serialNo: 20 }),
    ];

    rerender();

    expect(result.current.queue.map((drop) => drop.serial_no)).toEqual([
      40, 20,
    ]);

    await waitFor(() => {
      expect(readSkippedStorage()).toEqual([20]);
    });
  });

  it("does not keep a reappearing drop skipped after it was pruned from storage", async () => {
    currentDrops = [
      createDrop({ id: "drop-50", serialNo: 50 }),
      createDrop({ id: "drop-40", serialNo: 40 }),
      createDrop({ id: "drop-30", serialNo: 30 }),
    ];
    localStorage.setItem(getSkippedStorageKey(), JSON.stringify([50, 30]));

    const { result, rerender } = renderHook(() => useMemesQuickVoteQueue(), {
      wrapper: createWrapper(),
    });

    expect(result.current.queue.map((drop) => drop.serial_no)).toEqual([
      40, 50, 30,
    ]);

    currentDrops = [
      createDrop({ id: "drop-40", serialNo: 40 }),
      createDrop({ id: "drop-30", serialNo: 30 }),
    ];

    rerender();

    await waitFor(() => {
      expect(readSkippedStorage()).toEqual([30]);
    });

    currentDrops = [
      createDrop({ id: "drop-50", serialNo: 50 }),
      createDrop({ id: "drop-40", serialNo: 40 }),
      createDrop({ id: "drop-30", serialNo: 30 }),
    ];

    rerender();

    expect(result.current.queue.map((drop) => drop.serial_no)).toEqual([
      50, 40, 30,
    ]);
    expect(readSkippedStorage()).toEqual([30]);
  });

  it("persists skipped ordering and advances the visible queue when skipping the active drop", () => {
    currentDrops = [
      createDrop({ id: "drop-40", serialNo: 40 }),
      createDrop({ id: "drop-30", serialNo: 30 }),
      createDrop({ id: "drop-20", serialNo: 20 }),
    ];
    localStorage.setItem(getSkippedStorageKey(), JSON.stringify([20]));

    const { result } = renderHook(() => useMemesQuickVoteQueue(), {
      wrapper: createWrapper(),
    });

    expect(result.current.activeDrop?.serial_no).toBe(40);

    act(() => {
      result.current.skipDrop(result.current.activeDrop!);
    });

    expect(readSkippedStorage()).toEqual([20, 40]);
    expect(result.current.activeDrop?.serial_no).toBe(30);
    expect(result.current.queue.map((drop) => drop.serial_no)).toEqual([
      30, 20,
    ]);
  });

  it("restores dismissed items after the quick-vote session remounts", () => {
    currentDrops = [
      createDrop({ id: "drop-40", serialNo: 40 }),
      createDrop({ id: "drop-30", serialNo: 30 }),
      createDrop({ id: "drop-20", serialNo: 20 }),
    ];

    const firstSession = renderHook(() => useMemesQuickVoteQueue(), {
      wrapper: createWrapper(),
    });

    act(() => {
      firstSession.result.current.skipDrop(
        firstSession.result.current.activeDrop!
      );
    });

    expect(
      firstSession.result.current.queue.map((drop) => drop.serial_no)
    ).toEqual([30, 20]);

    firstSession.unmount();

    const nextSession = renderHook(() => useMemesQuickVoteQueue(), {
      wrapper: createWrapper(),
    });

    expect(
      nextSession.result.current.queue.map((drop) => drop.serial_no)
    ).toEqual([30, 20, 40]);
  });

  it("persists recent quick-vote amounts to the active storage key after a successful vote", async () => {
    currentDrops = [createDrop({ id: "drop-40", serialNo: 40 })];
    localStorage.setItem(getAmountsStorageKey(), JSON.stringify([100]));
    localStorage.setItem(
      getAmountsStorageKey("other-wave"),
      JSON.stringify([400])
    );

    const requestAuth = jest.fn().mockResolvedValue({ success: true });
    const invalidateDrops = jest.fn();
    const { result, rerender } = renderHook(() => useMemesQuickVoteQueue(), {
      wrapper: createWrapper({ invalidateDrops, requestAuth }),
    });

    currentMemesWaveId = "other-wave";
    currentRefetch = jest.fn().mockResolvedValue(undefined);

    rerender();

    let didSubmit = false;

    await act(async () => {
      didSubmit = await result.current.submitVote(
        result.current.activeDrop!,
        123
      );
    });

    expect(didSubmit).toBe(true);
    expect(readAmountsStorage()).toEqual([100]);
    expect(readAmountsStorage(getAmountsStorageKey("other-wave"))).toEqual([
      400, 123,
    ]);
    expect(result.current.recentAmounts).toEqual([123, 400]);
    expect(result.current.latestUsedAmount).toBe(123);
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(commonApiPostMock).toHaveBeenCalledWith({
      endpoint: "drops/drop-40/ratings",
      body: {
        rating: 123,
        category: "Rep",
      },
    });
    expect(invalidateDrops).toHaveBeenCalledTimes(1);
    expect(currentRefetch).toHaveBeenCalledTimes(1);
  });
});
