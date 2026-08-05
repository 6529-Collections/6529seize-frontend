import { useDropReaction } from "@/hooks/drops/useDropReaction";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { QueryKey as AppQueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useAuth } from "@/components/auth/Auth";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { ChatRestriction } from "@/hooks/useDropPriviledges";
import * as commonApi from "@/services/api/common-api";
import * as dropReactionMonitoring from "@/utils/monitoring/dropReactionMonitoring";
import { getAuthJwt } from "@/services/auth/auth.utils";
import { __resetDropReactionAuthRecoveryForTests } from "@/hooks/drops/useDropReactionAuthRecovery";
import { act, renderHook, waitFor } from "@testing-library/react";

const setToastMock = jest.fn();
const rollbackMock = jest.fn();
const applyOptimisticDropUpdateMock = jest.fn(() => ({
  rollback: rollbackMock,
}));
const mockQueryCacheFindAll = jest.fn(() => []);
const mockSetQueryData = jest.fn();
const mockGetEligibility = jest.fn();
const mockUpdateEligibility = jest.fn();
const requestAuthMock = jest.fn(async () => ({ success: true }));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(),
}));

jest.mock("@/contexts/wave/WaveEligibilityContext", () => ({
  useWaveEligibility: jest.fn(() => ({
    getEligibility: mockGetEligibility,
    updateEligibility: mockUpdateEligibility,
  })),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  ...jest.requireActual("@/services/auth/auth.utils"),
  getAuthJwt: jest.fn(),
}));

jest.mock("@/services/api/drop-api", () => ({
  fetchDropByIdBatched: jest.fn().mockResolvedValue(null),
}));

jest.mock(
  "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops",
  () => ({
    updateDropInCachedDrops: jest.fn(),
  })
);

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(() => ({
    getQueryCache: jest.fn(() => ({ findAll: mockQueryCacheFindAll })),
    setQueryData: mockSetQueryData,
    setQueriesData: jest.fn(),
  })),
}));

jest.mock("@/helpers/reactions/reactionHistory", () => ({
  recordReaction: jest.fn(),
}));

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebsocketStatus: jest.fn(() => "connected"),
}));

jest.mock("@/utils/monitoring/dropReactionMonitoring", () => ({
  beginReactionMutation: jest.fn(() => ({ mutationId: "mutation-1" })),
  deriveReactionAction: jest.fn(() => "add"),
  isReactionMutationLatest: jest.fn(() => true),
  recordReactionOptimisticApplied: jest.fn(),
  recordReactionRequestFailed: jest.fn(() => ({
    isLatestMutation: true,
    supersededByMutationId: null,
  })),
  recordReactionRequestSent: jest.fn(),
  recordReactionRequestSucceeded: jest.fn(() => ({
    isLatestMutation: true,
    supersededByMutationId: null,
  })),
  recordReactionRollbackApplied: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockGetAuthJwt = getAuthJwt as jest.MockedFunction<typeof getAuthJwt>;
const mockUseMyStream = useMyStream as jest.Mock;
const { fetchDropByIdBatched } = require("@/services/api/drop-api");
const {
  updateDropInCachedDrops,
} = require("@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops");
const mutationResultFor = (mutationId: string) => ({
  isLatestMutation: mutationId === "mutation-2",
  supersededByMutationId: mutationId === "mutation-1" ? "mutation-2" : null,
});

const useSequentialMutationIds = () => {
  let nextMutation = 1;
  (
    dropReactionMonitoring.beginReactionMutation as jest.Mock
  ).mockImplementation(() => ({
    mutationId: `mutation-${nextMutation++}`,
  }));
};

const mockLatestOnlyMonitoringResults = () => {
  (
    dropReactionMonitoring.recordReactionRequestFailed as jest.Mock
  ).mockImplementation((mutation: { mutationId: string }) =>
    mutationResultFor(mutation.mutationId)
  );
  (
    dropReactionMonitoring.recordReactionRequestSucceeded as jest.Mock
  ).mockImplementation((mutation: { mutationId: string }) =>
    mutationResultFor(mutation.mutationId)
  );
};

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

const createStructuredReactionError = ({
  body,
  headers,
  message = "technical error",
  status,
}: {
  body?: unknown;
  headers?: unknown;
  message?: string;
  status?: number;
}): Error & {
  headers?: unknown;
  status?: number;
  response: { body?: unknown; headers?: unknown; status?: number };
} =>
  Object.assign(new Error(message), {
    ...(headers !== undefined ? { headers } : {}),
    ...(status !== undefined ? { status } : {}),
    response: {
      ...(body !== undefined ? { body } : {}),
      ...(headers !== undefined ? { headers } : {}),
      ...(status !== undefined ? { status } : {}),
    },
  });

const mockDrop = {
  id: "drop-1",
  wave: { id: "wave-1", authenticated_user_eligible_to_chat: true },
  context_profile_context: { reaction: null },
  author: { handle: "author-handle" },
  parts: [],
  metadata: [],
  drop_type: ApiDropType.Standard,
  serial_no: 1,
  created_at: new Date().toISOString(),
  reply_to: null,
  wave_messages: [],
  reactions: [],
  type: DropSize.FULL,
  stableKey: "drop-1",
  stableHash: "hash-drop-1",
} as unknown as ExtendedDrop;

const createNotificationQuery = ({
  identity = "user",
  relatedDrops = [mockDrop as unknown as ApiDrop],
}: {
  readonly identity?: string;
  readonly relatedDrops?: ApiDrop[];
} = {}) => {
  const data = {
    pages: [
      {
        notifications: [
          {
            id: 1,
            related_drops: relatedDrops,
          },
        ],
      },
    ],
    pageParams: [null],
  };

  return {
    queryKey: [AppQueryKey.IDENTITY_NOTIFICATIONS, { identity }],
    state: { data },
  };
};

describe("useDropReaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetDropReactionAuthRecoveryForTests();
    mockGetAuthJwt.mockReturnValue("auth-token-before-recovery");
    requestAuthMock.mockResolvedValue({ success: true });
    mockSetQueryData.mockReset();
    mockGetEligibility.mockReturnValue(null);
    mockQueryCacheFindAll.mockReturnValue([]);
    applyOptimisticDropUpdateMock.mockReset();
    applyOptimisticDropUpdateMock.mockImplementation(() => ({
      rollback: rollbackMock,
    }));
    (dropReactionMonitoring.beginReactionMutation as jest.Mock).mockReturnValue(
      { mutationId: "mutation-1" }
    );
    (
      dropReactionMonitoring.isReactionMutationLatest as jest.Mock
    ).mockReturnValue(true);
    (
      dropReactionMonitoring.recordReactionRequestFailed as jest.Mock
    ).mockReturnValue({
      isLatestMutation: true,
      supersededByMutationId: null,
    });
    (
      dropReactionMonitoring.recordReactionRequestSucceeded as jest.Mock
    ).mockReturnValue({
      isLatestMutation: true,
      supersededByMutationId: null,
    });
    (fetchDropByIdBatched as jest.Mock).mockResolvedValue(null);
    mockUseAuth.mockReturnValue({
      setToast: setToastMock,
      requestAuth: requestAuthMock,
      activeProfileProxy: null,
      connectedProfile: {
        id: "identity-1",
        handle: "user",
        pfp: null,
        banner1: null,
        banner2: null,
        cic: 0,
        rep: 0,
        tdh: 0,
        tdh_rate: 0,
        xtdh: 0,
        xtdh_rate: 0,
        level: 0,
        primary_wallet: "0xuser",
        active_main_stage_submission_ids: [],
        winner_main_stage_drop_ids: [],
        is_wave_creator: false,
        artist_of_prevote_cards: [],
        profile_wave_id: null,
      },
    });
    mockUseMyStream.mockReturnValue({
      applyOptimisticDropUpdate: applyOptimisticDropUpdateMock,
    });
  });

  it("disables reactions while a proxy profile is active", async () => {
    mockUseAuth.mockReturnValue({
      setToast: setToastMock,
      activeProfileProxy: { id: "proxy-1" },
      connectedProfile: { id: "identity-1", handle: "user" },
    });

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    expect(result.current.canReact).toBe(false);

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(dropReactionMonitoring.beginReactionMutation).not.toHaveBeenCalled();
    expect(commonApi.commonApiPost).not.toHaveBeenCalled();
    expect(commonApi.commonApiDelete).not.toHaveBeenCalled();
  });

  it("disables reactions when the current wave capability is disabled", async () => {
    mockGetEligibility.mockReturnValue({
      authenticated_user_eligible_to_chat: false,
    });

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    expect(result.current.canReact).toBe(false);

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(dropReactionMonitoring.beginReactionMutation).not.toHaveBeenCalled();
    expect(commonApi.commonApiPost).not.toHaveBeenCalled();
    expect(commonApi.commonApiDelete).not.toHaveBeenCalled();
  });

  it("sends a normal reaction when the current wave capability is enabled", async () => {
    mockGetEligibility.mockReturnValue({
      authenticated_user_eligible_to_chat: true,
    });
    (commonApi.commonApiPost as jest.Mock).mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    expect(result.current.canReact).toBe(true);

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(commonApi.commonApiPost).toHaveBeenCalledTimes(1);
    expect(commonApi.commonApiPost).toHaveBeenCalledWith({
      endpoint: "drops/drop-1/reaction",
      body: { reaction: ":smile:" },
      errorMode: "structured",
    });
  });

  it("allows reactions when slow mode is the only chat restriction", async () => {
    mockGetEligibility.mockReturnValue({
      authenticated_user_eligible_to_chat: false,
      authenticated_user_chat_restriction: ChatRestriction.SLOW_MODE,
    });
    (commonApi.commonApiPost as jest.Mock).mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    expect(result.current.canReact).toBe(true);

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(commonApi.commonApiPost).toHaveBeenCalledTimes(1);
  });

  it("handles an exact stale capability 403 and disables later reactions", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        body: JSON.stringify({
          error: "Chatting and reacting is not enabled in this wave",
        }),
        message: "Chatting and reacting is not enabled in this wave",
        status: 403,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(mockUpdateEligibility).toHaveBeenCalledWith("wave-1", {
      authenticated_user_eligible_to_chat: false,
    });
    expect(setToastMock).toHaveBeenCalledWith({
      message: "Reactions are disabled for this wave.",
      type: "error",
    });
    expect(rollbackMock).toHaveBeenCalledTimes(1);
    expect(fetchDropByIdBatched).toHaveBeenCalledWith("drop-1");
  });

  it("rolls back and reconciles a 504 without retrying the reaction write", async () => {
    const canonicalDrop = {
      ...(mockDrop as unknown as ApiDrop),
      context_profile_context: {
        ...(mockDrop.context_profile_context as NonNullable<
          ApiDrop["context_profile_context"]
        >),
        reaction: null,
      },
      reactions: [],
    };
    (fetchDropByIdBatched as jest.Mock).mockResolvedValueOnce(canonicalDrop);
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        body: JSON.stringify({ error: "Endpoint request timed out" }),
        message: "Endpoint request timed out",
        status: 504,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(setToastMock).toHaveBeenCalledWith({
      message:
        "The reaction request timed out. Refreshing the latest reaction state; wait before trying again.",
      type: "error",
    });
    expect(rollbackMock).toHaveBeenCalledTimes(1);
    expect(fetchDropByIdBatched).toHaveBeenCalledWith("drop-1");
    expect(updateDropInCachedDrops).toHaveBeenCalledWith(
      expect.anything(),
      canonicalDrop
    );
    expect(commonApi.commonApiPost).toHaveBeenCalledTimes(1);
    expect(commonApi.commonApiDelete).not.toHaveBeenCalled();
  });

  it("resolves after surfacing a structured quick react failure", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        body: JSON.stringify({ error: "Reaction not allowed" }),
        message: "unexpected raw error",
        status: 400,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await expect(result.current.react(":smile:")).resolves.toBeUndefined();
    });

    expect(commonApi.commonApiPost).toHaveBeenCalledWith({
      endpoint: "drops/drop-1/reaction",
      body: { reaction: ":smile:" },
      errorMode: "structured",
    });
    expect(setToastMock).toHaveBeenCalledWith({
      message: "Reaction not allowed",
      type: "error",
    });
  });

  it("optimistically updates cached notification drops", async () => {
    const notificationQuery = createNotificationQuery();
    mockQueryCacheFindAll.mockImplementation(
      ({
        predicate,
      }: {
        readonly predicate: (
          query: ReturnType<typeof createNotificationQuery>
        ) => boolean;
      }) => [notificationQuery].filter((query) => predicate(query))
    );
    (commonApi.commonApiPost as jest.Mock).mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(mockSetQueryData).toHaveBeenCalledWith(
      notificationQuery.queryKey,
      expect.objectContaining({
        pages: [
          {
            notifications: [
              expect.objectContaining({
                related_drops: [
                  expect.objectContaining({
                    id: "drop-1",
                    context_profile_context: expect.objectContaining({
                      reaction: ":smile:",
                    }),
                    reactions: [
                      expect.objectContaining({
                        reaction: ":smile:",
                        count: 1,
                        profiles: [
                          expect.objectContaining({ id: "identity-1" }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      })
    );
  });

  it("leaves cached notifications unchanged when the drop is not related", async () => {
    const notificationQuery = createNotificationQuery({
      relatedDrops: [
        {
          ...(mockDrop as unknown as ApiDrop),
          id: "another-drop",
        },
      ],
    });
    mockQueryCacheFindAll.mockImplementation(
      ({
        predicate,
      }: {
        readonly predicate: (
          query: ReturnType<typeof createNotificationQuery>
        ) => boolean;
      }) => [notificationQuery].filter((query) => predicate(query))
    );
    (commonApi.commonApiPost as jest.Mock).mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(mockSetQueryData).not.toHaveBeenCalled();
  });

  it("does not update cached notifications for another identity", async () => {
    const notificationQuery = createNotificationQuery({
      identity: "other-user",
    });
    mockQueryCacheFindAll.mockImplementation(
      ({
        predicate,
      }: {
        readonly predicate: (
          query: ReturnType<typeof createNotificationQuery>
        ) => boolean;
      }) => [notificationQuery].filter((query) => predicate(query))
    );
    (commonApi.commonApiPost as jest.Mock).mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(mockSetQueryData).not.toHaveBeenCalled();
  });

  it("rolls back cached notification drops on reaction failure", async () => {
    const notificationQuery = createNotificationQuery();
    mockQueryCacheFindAll.mockImplementation(
      ({
        predicate,
      }: {
        readonly predicate: (
          query: ReturnType<typeof createNotificationQuery>
        ) => boolean;
      }) => [notificationQuery].filter((query) => predicate(query))
    );
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      new Error("network down")
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(mockSetQueryData).toHaveBeenNthCalledWith(
      1,
      notificationQuery.queryKey,
      expect.objectContaining({
        pages: [
          {
            notifications: [
              expect.objectContaining({
                related_drops: [
                  expect.objectContaining({
                    context_profile_context: expect.objectContaining({
                      reaction: ":smile:",
                    }),
                  }),
                ],
              }),
            ],
          },
        ],
      })
    );
    expect(mockSetQueryData).toHaveBeenNthCalledWith(
      2,
      notificationQuery.queryKey,
      notificationQuery.state.data
    );
  });

  it("refreshes cached notification drops from the canonical drop after the latest failure", async () => {
    useSequentialMutationIds();
    mockLatestOnlyMonitoringResults();

    const notificationQuery = createNotificationQuery();
    mockQueryCacheFindAll.mockImplementation(
      ({
        predicate,
      }: {
        readonly predicate: (
          query: ReturnType<typeof createNotificationQuery>
        ) => boolean;
      }) => [notificationQuery].filter((query) => predicate(query))
    );
    mockSetQueryData.mockImplementation((queryKey, nextData) => {
      if (queryKey === notificationQuery.queryKey) {
        notificationQuery.state.data = nextData;
      }
    });

    const firstRequest = createDeferred<ApiDrop>();
    const secondRequest = createDeferred<ApiDrop>();
    (commonApi.commonApiPost as jest.Mock)
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    (fetchDropByIdBatched as jest.Mock).mockResolvedValueOnce({
      ...(mockDrop as unknown as ApiDrop),
      context_profile_context: {
        ...(mockDrop.context_profile_context as NonNullable<
          ApiDrop["context_profile_context"]
        >),
        reaction: null,
      },
      reactions: [],
    });

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    let firstReaction!: Promise<void>;
    let secondReaction!: Promise<void>;
    await act(async () => {
      firstReaction = result.current.react(":smile:");
      secondReaction = result.current.react(":wave:");
    });

    await act(async () => {
      firstRequest.reject(new Error("first request failed"));
      await firstReaction;
    });

    await act(async () => {
      secondRequest.reject(new Error("second request failed"));
      await secondReaction;
    });

    expect(mockSetQueryData).toHaveBeenLastCalledWith(
      notificationQuery.queryKey,
      expect.objectContaining({
        pages: [
          {
            notifications: [
              expect.objectContaining({
                related_drops: [
                  expect.objectContaining({
                    context_profile_context: expect.objectContaining({
                      reaction: null,
                    }),
                    reactions: [],
                  }),
                ],
              }),
            ],
          },
        ],
      })
    );
  });

  it("does not treat a throwing onSuccess callback as a request failure", async () => {
    const onSuccess = jest.fn(() => {
      throw new Error("consumer callback failed");
    });
    (commonApi.commonApiPost as jest.Mock).mockResolvedValueOnce({});

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, {
        source: "quick-react",
        onSuccess,
      })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(
      dropReactionMonitoring.recordReactionRequestSucceeded
    ).toHaveBeenCalledTimes(1);
    expect(
      dropReactionMonitoring.recordReactionRequestFailed
    ).not.toHaveBeenCalled();
    expect(
      dropReactionMonitoring.recordReactionRollbackApplied
    ).not.toHaveBeenCalled();
    expect(setToastMock).not.toHaveBeenCalled();
    expect(rollbackMock).not.toHaveBeenCalled();
  });

  it("applies the optimistic reaction without waiting for request success", async () => {
    const request = createDeferred<ApiDrop>();
    (commonApi.commonApiPost as jest.Mock).mockReturnValueOnce(request.promise);

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    let reaction!: Promise<void>;
    act(() => {
      reaction = result.current.react(":smile:");
    });

    expect(
      dropReactionMonitoring.recordReactionOptimisticApplied
    ).toHaveBeenCalledTimes(1);
    expect(
      (dropReactionMonitoring.recordReactionOptimisticApplied as jest.Mock).mock
        .invocationCallOrder[0]
    ).toBeLessThan(
      (commonApi.commonApiPost as jest.Mock).mock.invocationCallOrder[0]!
    );
    const optimisticUpdate = applyOptimisticDropUpdateMock.mock.calls[0]![0];
    const optimisticDrop = {
      ...mockDrop,
      context_profile_context: { ...mockDrop.context_profile_context },
      reactions: [...mockDrop.reactions],
    };
    optimisticUpdate.update(optimisticDrop);
    expect(optimisticDrop.context_profile_context?.reaction).toBe(":smile:");
    expect(optimisticDrop.reactions).toEqual([
      expect.objectContaining({
        reaction: ":smile:",
        count: 1,
        profiles: [expect.objectContaining({ id: "identity-1" })],
      }),
    ]);

    await act(async () => {
      request.resolve({} as ApiDrop);
      await reaction;
    });
  });

  it("falls back for unsafe structured quick react failures", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        body: "<html><body>Bad Gateway</body></html>",
        message: "<html><body>Bad Gateway</body></html>",
        status: 502,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(setToastMock).toHaveBeenCalledWith({
      message: "Error adding reaction",
      type: "error",
    });
  });

  it("recovers a rejected session without replaying the failed reaction", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        message: "Something went wrong",
        status: 401,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(setToastMock).toHaveBeenCalledWith({
      message: "Unauthorized",
      type: "error",
    });
    expect(requestAuthMock).toHaveBeenCalledTimes(1);
    expect(requestAuthMock).toHaveBeenCalledWith({
      serverRejected: true,
      expectedAuthStateFingerprint: expect.any(String),
    });
    expect(commonApi.commonApiPost).toHaveBeenCalledTimes(1);
    expect(rollbackMock).toHaveBeenCalledTimes(1);
  });

  it("does not start another recovery for concurrent 401s from the same auth state", async () => {
    const unauthorizedError = createStructuredReactionError({
      message: "Unauthorized",
      status: 401,
    });
    const firstRequest = createDeferred<ApiDrop>();
    const secondRequest = createDeferred<ApiDrop>();
    const recovery = createDeferred<{ success: boolean }>();
    (commonApi.commonApiPost as jest.Mock)
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    requestAuthMock.mockReturnValueOnce(recovery.promise);
    useSequentialMutationIds();
    mockLatestOnlyMonitoringResults();

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    let firstReaction!: Promise<void>;
    let secondReaction!: Promise<void>;
    act(() => {
      firstReaction = result.current.react(":smile:");
      secondReaction = result.current.react(":wave:");
    });

    act(() => {
      firstRequest.reject(unauthorizedError);
    });
    await waitFor(() =>
      expect(
        dropReactionMonitoring.recordReactionRequestFailed
      ).toHaveBeenCalledTimes(1)
    );
    expect(requestAuthMock).not.toHaveBeenCalled();

    act(() => {
      secondRequest.reject(unauthorizedError);
    });
    await waitFor(() =>
      expect(
        dropReactionMonitoring.recordReactionRequestFailed
      ).toHaveBeenCalledTimes(2)
    );

    expect(commonApi.commonApiPost).toHaveBeenCalledTimes(2);
    expect(requestAuthMock).toHaveBeenCalledTimes(1);
    expect(requestAuthMock).toHaveBeenCalledWith({
      serverRejected: true,
      expectedAuthStateFingerprint: expect.any(String),
    });

    await act(async () => {
      mockGetAuthJwt.mockReturnValue("auth-token-after-recovery");
      recovery.resolve({ success: true });
      await Promise.all([firstReaction, secondReaction]);
    });
  });

  it("does not repeat recovery after the same auth state is rejected again", async () => {
    const unauthorizedError = createStructuredReactionError({
      message: "Unauthorized",
      status: 401,
    });
    (commonApi.commonApiPost as jest.Mock)
      .mockRejectedValueOnce(unauthorizedError)
      .mockRejectedValueOnce(unauthorizedError);

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });
    await act(async () => {
      await result.current.react(":wave:");
    });

    expect(commonApi.commonApiPost).toHaveBeenCalledTimes(2);
    expect(requestAuthMock).toHaveBeenCalledTimes(1);
  });

  it("does not recover a stale 401 after the auth state changes", async () => {
    const request = createDeferred<ApiDrop>();
    (commonApi.commonApiPost as jest.Mock).mockReturnValueOnce(request.promise);

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    let reaction!: Promise<void>;
    act(() => {
      reaction = result.current.react(":smile:");
    });
    mockGetAuthJwt.mockReturnValue("replacement-auth-token");

    await act(async () => {
      request.reject(
        createStructuredReactionError({
          message: "Unauthorized",
          status: 401,
        })
      );
      await reaction;
    });

    expect(commonApi.commonApiPost).toHaveBeenCalledTimes(1);
    expect(requestAuthMock).not.toHaveBeenCalled();
    expect(rollbackMock).toHaveBeenCalledTimes(1);
  });

  it("allows an explicit retry after recovery changes the auth state", async () => {
    (commonApi.commonApiPost as jest.Mock)
      .mockRejectedValueOnce(
        createStructuredReactionError({
          message: "Unauthorized",
          status: 401,
        })
      )
      .mockResolvedValueOnce({});
    requestAuthMock.mockImplementationOnce(async () => {
      mockGetAuthJwt.mockReturnValue("auth-token-after-recovery");
      return { success: true };
    });

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });
    expect(commonApi.commonApiPost).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(commonApi.commonApiPost).toHaveBeenCalledTimes(2);
    expect(requestAuthMock).toHaveBeenCalledTimes(1);
    expect(
      dropReactionMonitoring.recordReactionRequestSucceeded
    ).toHaveBeenCalledTimes(1);
  });

  it("maps rate-limit status when the structured body is blank", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        body: "   ",
        message: "   ",
        status: 429,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(setToastMock).toHaveBeenCalledWith({
      message: "You are reacting too quickly. Try again in a moment.",
      type: "error",
    });
  });

  it("includes retry-after guidance for rate-limit quick react failures", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        body: JSON.stringify({ error: "Rate limit exceeded" }),
        headers: new Headers({ "retry-after": "2" }),
        message: "Rate limit exceeded",
        status: 429,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(setToastMock).toHaveBeenCalledWith({
      message: "You are reacting too quickly. Try again in 2 seconds.",
      type: "error",
    });
    expect(rollbackMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces the safe status-text message when the structured body is missing", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      createStructuredReactionError({
        message: "Service Unavailable",
        status: 503,
      })
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(setToastMock).toHaveBeenCalledWith({
      message: "Service Unavailable",
      type: "error",
    });
  });

  it("ignores a stale failure after a newer reaction starts", async () => {
    useSequentialMutationIds();
    mockLatestOnlyMonitoringResults();

    const firstRollback = jest.fn();
    const secondRollback = jest.fn();
    applyOptimisticDropUpdateMock
      .mockReturnValueOnce({ rollback: firstRollback })
      .mockReturnValueOnce({ rollback: secondRollback });

    const firstRequest = createDeferred<ApiDrop>();
    const secondRequest = createDeferred<ApiDrop>();
    (commonApi.commonApiPost as jest.Mock)
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    let firstReaction!: Promise<void>;
    let secondReaction!: Promise<void>;
    await act(async () => {
      firstReaction = result.current.react(":smile:");
      secondReaction = result.current.react(":wave:");
    });

    expect(firstRollback).not.toHaveBeenCalled();
    expect(secondRollback).not.toHaveBeenCalled();

    await act(async () => {
      firstRequest.reject(new Error("first request failed"));
      await firstReaction;
    });

    expect(setToastMock).not.toHaveBeenCalled();
    expect(firstRollback).not.toHaveBeenCalled();
    expect(secondRollback).not.toHaveBeenCalled();
    expect(
      dropReactionMonitoring.recordReactionRollbackApplied
    ).not.toHaveBeenCalled();

    await act(async () => {
      secondRequest.reject(new Error("second request failed"));
      await secondReaction;
    });

    expect(setToastMock).toHaveBeenCalledWith({
      message: "second request failed",
      type: "error",
    });
    expect(secondRollback).toHaveBeenCalledTimes(1);
    expect(fetchDropByIdBatched).toHaveBeenCalledWith("drop-1");
    expect(
      dropReactionMonitoring.recordReactionRollbackApplied
    ).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale success after a newer reaction starts", async () => {
    useSequentialMutationIds();
    mockLatestOnlyMonitoringResults();

    const onSuccess = jest.fn();
    const firstRollback = jest.fn();
    const secondRollback = jest.fn();
    applyOptimisticDropUpdateMock
      .mockReturnValueOnce({ rollback: firstRollback })
      .mockReturnValueOnce({ rollback: secondRollback });

    const firstRequest = createDeferred<ApiDrop>();
    const secondRequest = createDeferred<ApiDrop>();
    (commonApi.commonApiPost as jest.Mock)
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, {
        source: "quick-react",
        onSuccess,
      })
    );

    let firstReaction!: Promise<void>;
    let secondReaction!: Promise<void>;
    await act(async () => {
      firstReaction = result.current.react(":smile:");
      secondReaction = result.current.react(":wave:");
    });

    expect(firstRollback).not.toHaveBeenCalled();

    await act(async () => {
      firstRequest.resolve({} as ApiDrop);
      await firstReaction;
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(secondRollback).not.toHaveBeenCalled();

    await act(async () => {
      secondRequest.reject(new Error("second request failed"));
      await secondReaction;
    });

    expect(secondRollback).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("shows a toast and rolls back the latest failure", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      new Error("network down")
    );

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(setToastMock).toHaveBeenCalledWith({
      message: "network down",
      type: "error",
    });
    expect(rollbackMock).toHaveBeenCalledTimes(1);
    expect(fetchDropByIdBatched).toHaveBeenCalledWith("drop-1");
    expect(
      dropReactionMonitoring.recordReactionRollbackApplied
    ).toHaveBeenCalledTimes(1);
  });

  it("skips canonical cache refresh when the failed reaction drop is unavailable", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      new Error("network down")
    );
    (fetchDropByIdBatched as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() =>
      useDropReaction(mockDrop, { source: "quick-react" })
    );

    await act(async () => {
      await result.current.react(":smile:");
    });

    expect(fetchDropByIdBatched).toHaveBeenCalledWith("drop-1");
    expect(updateDropInCachedDrops).not.toHaveBeenCalled();
    expect(applyOptimisticDropUpdateMock).toHaveBeenCalledTimes(1);
  });
});
