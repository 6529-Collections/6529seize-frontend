import { renderHook } from "@testing-library/react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiDropSearchStrategy } from "@/generated/models/ApiDropSearchStrategy";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WsMessageType } from "@/helpers/Types";
import { fetchWaveDropsFeedV2 } from "@/services/api/wave-drops-v2-api";
import { useWaveDrops } from "@/hooks/useWaveDrops";

jest.mock("@tanstack/react-query");
jest.mock("@/services/api/wave-drops-v2-api");
jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const fetchWaveDropsFeedV2Mock = fetchWaveDropsFeedV2 as jest.Mock;
let mockConnectedProfileId: string | null = "viewer-1";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockConnectedProfileId
      ? { id: mockConnectedProfileId }
      : null,
  }),
}));

describe("useWaveDrops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectedProfileId = "viewer-1";
    useQueryClientMock.mockReturnValue({
      getQueryCache: jest.fn(() => ({ findAll: jest.fn(() => []) })),
      setQueriesData: jest.fn(),
      setQueryData: jest.fn(),
    });
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });
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
            viewerProfileId: "viewer-1",
          },
        ],
        enabled: true,
      })
    );
  });

  it("does not reuse placeholder drops across viewer profiles", () => {
    renderHook(() => useWaveDrops({ waveId: "wave-1" }));
    const firstOptions = useInfiniteQueryMock.mock.calls[0][0];
    const previousData = { pages: [{ drops: [{ id: "old-viewer" }] }] };
    const previousQuery = {
      queryKey: [
        QueryKey.DROPS,
        { viewerProfileId: "viewer-1" },
      ],
    };

    expect(
      firstOptions.placeholderData(previousData, previousQuery)
    ).toBe(previousData);

    mockConnectedProfileId = "viewer-2";
    renderHook(() => useWaveDrops({ waveId: "wave-1" }));
    const secondOptions = useInfiniteQueryMock.mock.calls.at(-1)[0];

    expect(
      secondOptions.placeholderData(previousData, previousQuery)
    ).toBeUndefined();
    expect(secondOptions.queryKey[1].viewerProfileId).toBe("viewer-2");
  });

  it("calls the v2 wave drops endpoint with wave and drop type filters", async () => {
    fetchWaveDropsFeedV2Mock.mockResolvedValue({ drops: [] });
    renderHook(() =>
      useWaveDrops({
        waveId: "wave-1",
        dropType: ApiDropType.Winner,
        limit: 12,
      })
    );

    const options = useInfiniteQueryMock.mock.calls[0][0];
    await options.queryFn({ pageParam: 42 });

    expect(fetchWaveDropsFeedV2Mock).toHaveBeenCalledWith({
      waveId: "wave-1",
      limit: 12,
      serialNoLimit: 42,
      searchStrategy: ApiDropSearchStrategy.Older,
      dropType: ApiDropType.Winner,
    });
  });

  it("filters media drops locally when requested", async () => {
    const textDrop = {
      id: "text",
      serial_no: 2,
      parts: [{ media: [] }],
    };
    const mediaDrop = {
      id: "media",
      serial_no: 1,
      parts: [{ media: [{ url: "image.png" }] }],
    };
    fetchWaveDropsFeedV2Mock.mockResolvedValue({
      drops: [textDrop, mediaDrop],
    });
    renderHook(() =>
      useWaveDrops({
        waveId: "wave-1",
        containsMedia: true,
      })
    );

    const options = useInfiniteQueryMock.mock.calls[0][0];
    const page = await options.queryFn({ pageParam: null });

    expect(fetchWaveDropsFeedV2Mock).toHaveBeenCalledWith({
      waveId: "wave-1",
      limit: 20,
      serialNoLimit: null,
      searchStrategy: undefined,
      dropType: undefined,
    });
    expect(page.drops).toEqual([mediaDrop]);
    expect(page.nextSerialNo).toBe(1);
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
      WsMessageType,
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

    socketCallbacks.get(WsMessageType.DROP_UPDATE)?.({
      wave: { id: "wave-2" },
    });
    jest.advanceTimersByTime(1000);
    expect(refetch).not.toHaveBeenCalled();

    socketCallbacks.get(WsMessageType.DROP_UPDATE)?.({
      wave: { id: "wave-1" },
    });
    jest.advanceTimersByTime(1000);
    expect(refetch).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("does not refetch disabled queries for compact updates", () => {
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
      WsMessageType,
      (message: unknown) => void
    >();
    const {
      useWebSocketMessage,
    } = require("@/services/websocket/useWebSocketMessage");
    (useWebSocketMessage as jest.Mock).mockImplementation((type, callback) => {
      socketCallbacks.set(type, callback);
    });

    renderHook(() => useWaveDrops({ waveId: "wave-1", enabled: false }));
    socketCallbacks.get(WsMessageType.DROP_UPDATE_REF)?.({
      author_id: "author-1",
      drop_id: "drop-1",
      wave_id: "wave-1",
      serial_no: 1,
      update_type: WsMessageType.DROP_UPDATE,
    });

    expect(refetch).not.toHaveBeenCalled();
  });
});
