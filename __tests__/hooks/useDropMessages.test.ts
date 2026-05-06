import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WsMessageType } from "@/helpers/Types";
import {
  __resetDropReactionMonitoringForTests,
  beginReactionMutation,
} from "@/utils/monitoring/dropReactionMonitoring";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";

// Setup mock for useInfiniteQuery so tests can control its behaviour
const useInfiniteQueryMock = jest.fn();
jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useInfiniteQuery: (...args: any[]) => useInfiniteQueryMock(...args),
  };
});

let mockConnectedProfileId: string | null = "profile-1";
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile:
      mockConnectedProfileId === null ? null : { id: mockConnectedProfileId },
  }),
}));

const { useDropMessages } = require("@/hooks/useDropMessages");
import React from "react";

// Mock all dependencies
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn().mockResolvedValue({ drops: [], wave: null }),
}));

const { commonApiFetch } = require("@/services/api/common-api");
const commonApiFetchMock = commonApiFetch as jest.Mock;

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

const createWrapper = (queryClient = createQueryClient()) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockConnectedProfileId = "profile-1";
  __resetDropReactionMonitoringForTests();
  commonApiFetchMock.mockResolvedValue({ drops: [], wave: null });
  useInfiniteQueryMock.mockReset();
  useInfiniteQueryMock.mockReturnValue({
    data: { pages: [] },
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    refetch: jest.fn(),
  } as Partial<UseInfiniteQueryResult>);
});

afterEach(() => {
  jest.restoreAllMocks();
  __resetDropReactionMonitoringForTests();
});

describe("useDropMessages", () => {
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

  it("should return expected hook properties", () => {
    const { result } = renderHook(
      () => useDropMessages("wave-123", "drop-456"),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveProperty("drops");
    expect(result.current).toHaveProperty("hasNextPage");
    expect(result.current).toHaveProperty("fetchNextPage");
    expect(result.current).toHaveProperty("isFetching");
    expect(result.current).toHaveProperty("isFetchingNextPage");
    expect(result.current).toHaveProperty("refetch");
  });

  it("should have empty drops initially", () => {
    const { result } = renderHook(
      () => useDropMessages("wave-123", "drop-456"),
      { wrapper: createWrapper() }
    );

    expect(Array.isArray(result.current.drops)).toBe(true);
  });

  it("manualFetch triggers next page when available", async () => {
    const fetchNextPage = jest.fn();
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage,
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    } as Partial<UseInfiniteQueryResult>);

    const {
      useWebSocketMessage,
    } = require("@/services/websocket/useWebSocketMessage");
    (useWebSocketMessage as jest.Mock).mockReturnValue({ isConnected: true });

    const { result } = renderHook(() => useDropMessages("wave-1", "drop-1"), {
      wrapper: createWrapper(),
    });

    await result.current.manualFetch();
    expect(fetchNextPage).toHaveBeenCalled();
  });

  it("reconciles in-flight query responses with the profile that started the request", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000);
    const currentUser = profile("profile-1", "current-user");
    const queryClient = createQueryClient();
    queryClient.setQueryData([QueryKey.DROPS, { waveId: "wave-1" }], {
      pages: [
        {
          drops: [
            {
              id: "drop-profile-switch",
              context_profile_context: contextProfileContext(":joy:"),
              reactions: [reactionEntry(":joy:", [currentUser])],
            },
          ],
        },
      ],
    });

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
    const response = deferred<any>();
    commonApiFetchMock.mockReturnValue(response.promise);

    const { rerender } = renderHook(() => useDropMessages("wave-1", "drop-1"), {
      wrapper: createWrapper(queryClient),
    });

    const options = useInfiniteQueryMock.mock.calls[0][0];
    const resultPromise = options.queryFn({ pageParam: null });

    mockConnectedProfileId = "profile-2";
    rerender();
    response.resolve({
      wave: { id: "wave-1" },
      drops: [
        {
          id: "drop-profile-switch",
          context_profile_context: contextProfileContext(":wave:"),
          reactions: [
            reactionEntry(":wave:", [
              profile("profile-1", "server-current-user"),
              profile("profile-2", "server-wave"),
            ]),
          ],
        },
      ],
    });

    const result = await resultPromise;

    expect(result.drops[0].context_profile_context.reaction).toBe(":joy:");
    expect(result.drops[0].reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "server-wave")]),
      reactionEntry(":joy:", [currentUser]),
    ]);
  });

  it("websocket callback debounces refetch", () => {
    jest.useFakeTimers();
    const refetch = jest.fn().mockResolvedValue(undefined);
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch,
    } as Partial<UseInfiniteQueryResult>);

    const wsCallbacks = new Map<unknown, (message: any) => void>();
    const {
      useWebSocketMessage,
    } = require("@/services/websocket/useWebSocketMessage");
    (useWebSocketMessage as jest.Mock).mockImplementation((type, cb) => {
      wsCallbacks.set(type, cb);
      return { isConnected: true };
    });

    const { unmount } = renderHook(() => useDropMessages("wave-x", "drop-y"), {
      wrapper: createWrapper(),
    });

    wsCallbacks.get(WsMessageType.DROP_UPDATE)?.({ wave: { id: "wave-x" } });
    jest.advanceTimersByTime(1000);
    expect(refetch).toHaveBeenCalled();
    unmount();
    jest.useRealTimers();
  });
});
it("ignores websocket messages when dropId is null", () => {
  const refetch = jest.fn().mockResolvedValue(undefined);
  useInfiniteQueryMock.mockReturnValue({
    data: { pages: [] },
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    refetch,
  } as Partial<UseInfiniteQueryResult>);

  const wsCallbacks = new Map<unknown, (message: any) => void>();
  const {
    useWebSocketMessage,
  } = require("@/services/websocket/useWebSocketMessage");
  (useWebSocketMessage as jest.Mock).mockImplementation((type, cb) => {
    wsCallbacks.set(type, cb);
    return { isConnected: true };
  });

  renderHook(() => useDropMessages("wave-1", null), {
    wrapper: createWrapper(),
  });

  wsCallbacks.get(WsMessageType.DROP_UPDATE)?.({ wave: { id: "wave-1" } });
  expect(refetch).not.toHaveBeenCalled();
});
