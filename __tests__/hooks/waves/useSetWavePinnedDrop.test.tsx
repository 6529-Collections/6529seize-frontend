import { act, renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryKey as TanstackQueryKey,
} from "@tanstack/react-query";
import React from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiPost } from "@/services/api/common-api";
import {
  useSetWavePinnedDrop,
  type SetWavePinnedDropInput,
} from "@/hooks/waves/useSetWavePinnedDrop";

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

const mockedCommonApiPost = commonApiPost as jest.MockedFunction<
  typeof commonApiPost
>;

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

const createMockWave = (overrides: Partial<ApiWave> = {}): ApiWave =>
  ({
    id: "wave-1",
    serial_no: 1,
    author: { handle: "wave-author" },
    name: "Wave One",
    picture: null,
    created_at: 123,
    description_drop: {
      id: "drop-2",
      serial_no: 2,
      drop_type: "Chat",
      rank: null,
      wave: {
        id: "wave-1",
        name: "Wave One",
        picture: null,
        description_drop_id: "drop-2",
        authenticated_user_eligible_to_vote: true,
        authenticated_user_eligible_to_participate: true,
        authenticated_user_eligible_to_chat: true,
        authenticated_user_admin: true,
        visibility_group_id: null,
        participation_group_id: null,
        chat_group_id: null,
        voting_group_id: null,
        admin_group_id: null,
        voting_period_start: null,
        voting_period_end: null,
        voting_credit_type: "NIC",
        admin_drop_deletion_enabled: false,
        forbid_negative_votes: false,
        pinned: false,
      },
      author: { handle: "wave-author" },
      created_at: 123,
      updated_at: null,
      title: null,
      parts: [],
      parts_count: 0,
      referenced_nfts: [],
      mentioned_users: [],
      mentioned_waves: [],
      metadata: [],
      rating: 0,
      realtime_rating: 0,
      rating_prediction: 0,
      top_raters: [],
      raters_count: 0,
      context_profile_context: null,
      subscribed_actions: [],
      is_signed: false,
      reactions: [],
      boosts: 0,
      hide_link_preview: false,
    },
    voting: {
      scope: { group: null },
      credit_type: "NIC",
      credit_category: null,
      creditor: null,
      signature_required: false,
      forbid_negative_votes: false,
      authenticated_user_eligible: true,
    },
    visibility: {
      scope: { group: null },
    },
    participation: {
      scope: { group: null },
      no_of_applications_allowed_per_participant: 1,
      required_media: false,
      required_metadata: [],
      signature_required: false,
      terms: null,
      authenticated_user_eligible: true,
    },
    chat: {
      scope: { group: null },
      enabled: true,
      authenticated_user_eligible: true,
    },
    wave: {
      type: "CHAT",
      time_lock_ms: null,
      winning_thresholds: null,
      max_winners: null,
      admin_group: { group: null },
      authenticated_user_eligible_for_admin: true,
      decisions_strategy: null,
      admin_drop_deletion_enabled: false,
    },
    contributors_overview: [],
    subscribed_actions: [],
    metrics: {
      drops_count: 0,
      subscribers_count: 0,
      your_participation_drops_count: 0,
      your_unread_drops_count: 0,
      muted: false,
    },
    pauses: [],
    pinned: false,
    ...overrides,
  }) as ApiWave;

describe("useSetWavePinnedDrop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("posts to the pinned-drop endpoint and resolves with the updated wave", async () => {
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);
    const updatedWave = createMockWave({
      description_drop: {
        ...createMockWave().description_drop,
        id: "drop-5",
        wave: {
          ...createMockWave().description_drop.wave,
          description_drop_id: "drop-5",
        },
      },
    });
    mockedCommonApiPost.mockResolvedValue(updatedWave);

    const { result } = renderHook(() => useSetWavePinnedDrop("wave-1"), {
      wrapper,
    });

    let response: ApiWave | undefined;
    await act(async () => {
      response = await result.current.setPinnedDrop({ dropId: "drop-5" });
    });

    expect(response).toBe(updatedWave);
    expect(mockedCommonApiPost).toHaveBeenCalledWith({
      endpoint: "waves/wave-1/pinned-drop",
      body: { drop_id: "drop-5" },
    });
    expect(result.current.data).toBe(updatedWave);
  });

  it("tracks pending state and pendingDropId during mutation", async () => {
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);
    const updatedWave = createMockWave();

    let resolveRequest: ((value: ApiWave) => void) | undefined;
    mockedCommonApiPost.mockReturnValue(
      new Promise<ApiWave>((resolve) => {
        resolveRequest = resolve;
      })
    );

    const { result } = renderHook(() => useSetWavePinnedDrop("wave-1"), {
      wrapper,
    });

    let mutationPromise: Promise<ApiWave> | undefined;
    await act(async () => {
      mutationPromise = result.current.setPinnedDrop({ dropId: "drop-9" });
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.pendingDropId).toBe("drop-9");

    await act(async () => {
      resolveRequest?.(updatedWave);
      await mutationPromise;
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.pendingDropId).toBeNull();
  });

  it("updates the exact wave cache entry on success", async () => {
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);
    const initialWave = createMockWave();
    const updatedWave = createMockWave({
      description_drop: {
        ...initialWave.description_drop,
        id: "drop-22",
        wave: {
          ...initialWave.description_drop.wave,
          description_drop_id: "drop-22",
        },
      },
    });

    queryClient.setQueryData(
      [QueryKey.WAVE, { wave_id: "wave-1" }],
      initialWave
    );
    mockedCommonApiPost.mockResolvedValue(updatedWave);

    const { result } = renderHook(() => useSetWavePinnedDrop("wave-1"), {
      wrapper,
    });

    await act(async () => {
      await result.current.setPinnedDrop({ dropId: "drop-22" });
    });

    expect(
      queryClient.getQueryData([QueryKey.WAVE, { wave_id: "wave-1" }])
    ).toBe(updatedWave);
  });

  it("invalidates only drop queries for the same wave", async () => {
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);
    const updatedWave = createMockWave();

    const sameWaveFeedKey: TanstackQueryKey = [
      QueryKey.DROPS,
      { waveId: "wave-1", limit: 50, dropId: null },
    ];
    const sameWaveSearchKey: TanstackQueryKey = [
      QueryKey.DROPS,
      { waveId: "wave-1", term: "hello", size: 20, context: "wave-search" },
    ];
    const otherWaveKey: TanstackQueryKey = [
      QueryKey.DROPS,
      { waveId: "wave-2", limit: 50, dropId: null },
    ];

    queryClient.setQueryData(sameWaveFeedKey, { pages: [] });
    queryClient.setQueryData(sameWaveSearchKey, { pages: [] });
    queryClient.setQueryData(otherWaveKey, { pages: [] });

    mockedCommonApiPost.mockResolvedValue(updatedWave);

    const { result } = renderHook(() => useSetWavePinnedDrop("wave-1"), {
      wrapper,
    });

    await act(async () => {
      await result.current.setPinnedDrop({ dropId: "drop-4" });
    });

    await waitFor(() => {
      expect(queryClient.getQueryState(sameWaveFeedKey)?.isInvalidated).toBe(
        true
      );
      expect(queryClient.getQueryState(sameWaveSearchKey)?.isInvalidated).toBe(
        true
      );
    });

    expect(queryClient.getQueryState(otherWaveKey)?.isInvalidated).toBe(false);
  });

  it.each([
    {
      label: "string errors",
      error: "boom",
      expectedMessage: "boom",
    },
    {
      label: "Error instances",
      error: new Error("failed"),
      expectedMessage: "failed",
    },
    {
      label: "unknown objects",
      error: { status: 500 },
      expectedMessage: "Something went wrong",
    },
  ])(
    "exposes normalized error state for $label",
    async ({ error, expectedMessage }) => {
      const queryClient = createQueryClient();
      const wrapper = createWrapper(queryClient);

      mockedCommonApiPost.mockRejectedValue(error);

      const { result } = renderHook(() => useSetWavePinnedDrop("wave-1"), {
        wrapper,
      });

      await act(async () => {
        await expect(
          result.current.setPinnedDrop({ dropId: "drop-4" })
        ).rejects.toBe(error);
      });

      await waitFor(() => {
        expect(result.current.error).toBe(error);
        expect(result.current.errorMessage).toBe(expectedMessage);
      });

      expect(result.current.pendingDropId).toBeNull();
    }
  );

  it("calls onSuccess and onError callbacks with normalized inputs", async () => {
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);
    const updatedWave = createMockWave();
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const input: SetWavePinnedDropInput = { dropId: "drop-8" };

    mockedCommonApiPost.mockResolvedValueOnce(updatedWave);

    const { result, rerender } = renderHook(
      ({ options }) => useSetWavePinnedDrop("wave-1", options),
      {
        initialProps: { options: { onSuccess, onError } },
        wrapper,
      }
    );

    await act(async () => {
      await result.current.setPinnedDrop(input);
    });

    expect(onSuccess).toHaveBeenCalledWith(updatedWave, input);
    expect(onError).not.toHaveBeenCalled();

    mockedCommonApiPost.mockRejectedValueOnce(new Error("bad request"));

    rerender({ options: { onSuccess, onError } });

    await act(async () => {
      await expect(result.current.setPinnedDrop(input)).rejects.toThrow(
        "bad request"
      );
    });

    expect(onError).toHaveBeenCalledWith(
      "bad request",
      expect.any(Error),
      input
    );
  });

  it("reset clears mutation data and error state", async () => {
    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);
    const updatedWave = createMockWave();

    mockedCommonApiPost.mockResolvedValueOnce(updatedWave);

    const { result } = renderHook(() => useSetWavePinnedDrop("wave-1"), {
      wrapper,
    });

    await act(async () => {
      await result.current.setPinnedDrop({ dropId: "drop-3" });
    });

    expect(result.current.data).toBe(updatedWave);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });
});
