import { renderHook } from "@testing-library/react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import { useWaveDrops } from "@/hooks/useWaveDrops";
import { WsMessageType } from "@/helpers/Types";
import {
  __resetDropReactionMonitoringForTests,
  beginReactionMutation,
} from "@/utils/monitoring/dropReactionMonitoring";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";

jest.mock("@tanstack/react-query");
jest.mock("@/services/api/common-api");
let mockConnectedProfileId: string | null = "profile-1";
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile:
      mockConnectedProfileId === null ? null : { id: mockConnectedProfileId },
  }),
}));
jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));
jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback: (scope: any) => void) => {
    const scope = {
      setLevel: jest.fn(),
      setFingerprint: jest.fn(),
      setTag: jest.fn(),
      setExtras: jest.fn(),
    };
    callback(scope);
  }),
  captureException: jest.fn(),
}));

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;
const queryClient = {
  getQueriesData: jest.fn(),
  setQueriesData: jest.fn(),
};
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

describe("useWaveDrops", () => {
  const contextProfileContext = (reaction: string | null) => ({
    rating: 0,
    min_rating: 0,
    max_rating: 0,
    reaction,
    boosted: false,
    bookmarked: false,
    curatable: false,
    curated: false,
  });

  const profile = (id: string, handle = id) => ({ id, handle });

  const reactionEntry = (
    reaction: string,
    profiles = [profile("profile-1")]
  ) => ({
    reaction,
    profiles,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectedProfileId = "profile-1";
    __resetDropReactionMonitoringForTests();
    queryClient.getQueriesData.mockReturnValue([]);
    commonApiFetchMock.mockResolvedValue([]);
    useQueryClientMock.mockReturnValue(queryClient);
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    __resetDropReactionMonitoringForTests();
  });

  it("configures the query key and winner filter correctly", () => {
    renderHook(() =>
      useWaveDrops({
        waveId: "wave-1",
        dropType: ApiDropType.Winner,
        limit: 12,
      })
    );

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.DROPS,
          {
            waveId: "wave-1",
            limit: 12,
            dropType: ApiDropType.Winner,
            containsMedia: false,
            curationId: null,
            context: "wave-drops",
          },
        ],
        enabled: true,
      })
    );
  });

  it("calls the drops endpoint with wave and drop type filters", async () => {
    commonApiFetchMock.mockResolvedValue([]);
    renderHook(() =>
      useWaveDrops({
        waveId: "wave-1",
        dropType: ApiDropType.Winner,
        limit: 12,
      })
    );

    const options = useInfiniteQueryMock.mock.calls[0][0];
    await options.queryFn({ pageParam: 42 });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "drops",
      params: {
        wave_id: "wave-1",
        limit: "12",
        drop_type: ApiDropType.Winner,
        serial_no_less_than: "42",
      },
    });
  });

  it("adds the contains_media filter when requested", async () => {
    commonApiFetchMock.mockResolvedValue([]);
    renderHook(() =>
      useWaveDrops({
        waveId: "wave-1",
        containsMedia: true,
      })
    );

    const options = useInfiniteQueryMock.mock.calls[0][0];
    await options.queryFn({ pageParam: null });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "drops",
      params: {
        wave_id: "wave-1",
        limit: "20",
        contains_media: "true",
      },
    });
  });

  it("reconciles stale refetched drops before React Query stores them", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const currentUser = profile("profile-1", "current-user");
    queryClient.getQueriesData.mockImplementation(
      ({ queryKey }: { queryKey: readonly unknown[] }) =>
        queryKey[0] === QueryKey.DROPS
          ? [
              [
                [QueryKey.DROPS, { waveId: "wave-1" }],
                {
                  pages: [
                    [
                      {
                        id: "drop-refetch-protected",
                        context_profile_context: contextProfileContext(":joy:"),
                        reactions: [reactionEntry(":joy:", [currentUser])],
                      },
                    ],
                  ],
                },
              ],
            ]
          : []
    );

    beginReactionMutation({
      dropId: "drop-refetch-protected",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });
    commonApiFetchMock.mockResolvedValue([
      {
        id: "drop-refetch-protected",
        wave: { id: "wave-1" },
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [
          reactionEntry(":wave:", [profile("profile-2", "server-wave")]),
        ],
      },
    ]);

    renderHook(() =>
      useWaveDrops({
        waveId: "wave-1",
      })
    );

    const options = useInfiniteQueryMock.mock.calls[0][0];
    const drops = await options.queryFn({ pageParam: null });

    expect(drops[0].context_profile_context.reaction).toBe(":joy:");
    expect(drops[0].reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "server-wave")]),
      reactionEntry(":joy:", [currentUser]),
    ]);
  });

  it("reconciles in-flight query responses with the profile that started the request", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const currentUser = profile("profile-1", "current-user");
    queryClient.getQueriesData.mockImplementation(
      ({ queryKey }: { queryKey: readonly unknown[] }) =>
        queryKey[0] === QueryKey.DROPS
          ? [
              [
                [QueryKey.DROPS, { waveId: "wave-1" }],
                {
                  pages: [
                    [
                      {
                        id: "drop-profile-switch",
                        context_profile_context: contextProfileContext(":joy:"),
                        reactions: [reactionEntry(":joy:", [currentUser])],
                      },
                    ],
                  ],
                },
              ],
            ]
          : []
    );

    beginReactionMutation({
      dropId: "drop-profile-switch",
      waveId: "wave-1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });
    const response = deferred<any[]>();
    commonApiFetchMock.mockReturnValue(response.promise);

    const { rerender } = renderHook(() =>
      useWaveDrops({
        waveId: "wave-1",
      })
    );

    const options = useInfiniteQueryMock.mock.calls[0][0];
    const dropsPromise = options.queryFn({ pageParam: null });

    mockConnectedProfileId = "profile-2";
    rerender();
    response.resolve([
      {
        id: "drop-profile-switch",
        wave: { id: "wave-1" },
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [
          reactionEntry(":wave:", [
            profile("profile-1", "server-current-user"),
            profile("profile-2", "server-wave"),
          ]),
        ],
      },
    ]);

    const drops = await dropsPromise;

    expect(drops[0].context_profile_context.reaction).toBe(":joy:");
    expect(drops[0].reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "server-wave")]),
      reactionEntry(":joy:", [currentUser]),
    ]);
  });

  it("debounces refetch for same-wave websocket updates and ignores others", () => {
    jest.useFakeTimers();
    const refetch = jest.fn().mockResolvedValue(undefined);
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch,
    });

    const socketCallbacks = new Map<
      unknown,
      (message: { wave: { id: string } }) => void
    >();
    const {
      useWebSocketMessage,
    } = require("@/services/websocket/useWebSocketMessage");
    (useWebSocketMessage as jest.Mock).mockImplementation((type, callback) => {
      socketCallbacks.set(type, callback);
    });

    renderHook(() =>
      useWaveDrops({
        waveId: "wave-1",
      })
    );

    const socketCallback = socketCallbacks.get(WsMessageType.DROP_UPDATE);

    socketCallback?.({ wave: { id: "wave-2" } });
    jest.advanceTimersByTime(1000);
    expect(refetch).not.toHaveBeenCalled();

    socketCallback?.({
      id: "drop-websocket",
      wave: { id: "wave-1" },
      context_profile_context: contextProfileContext(null),
      reactions: [],
    } as any);
    jest.advanceTimersByTime(1000);
    expect(refetch).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
