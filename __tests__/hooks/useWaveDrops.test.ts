import { act, renderHook } from "@testing-library/react";
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
      getQueryCache: jest.fn(() => ({
        find: jest.fn(() => undefined),
        findAll: jest.fn(() => []),
      })),
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
    const { signal } = new AbortController();
    await options.queryFn({ pageParam: 42, signal });

    expect(fetchWaveDropsFeedV2Mock).toHaveBeenCalledWith({
      waveId: "wave-1",
      limit: 12,
      serialNoLimit: 42,
      searchStrategy: ApiDropSearchStrategy.Older,
      dropType: ApiDropType.Winner,
      signal,
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
    const { signal } = new AbortController();
    const page = await options.queryFn({ pageParam: null, signal });

    expect(fetchWaveDropsFeedV2Mock).toHaveBeenCalledWith({
      waveId: "wave-1",
      limit: 20,
      serialNoLimit: null,
      searchStrategy: undefined,
      dropType: undefined,
      signal,
    });
    expect(page.drops).toEqual([mediaDrop]);
    expect(page.nextSerialNo).toBe(1);
  });

  describe("media-only page scan", () => {
    const textDrop = (serialNo: number) => ({
      id: `text-${serialNo}`,
      serial_no: serialNo,
      parts: [{ media: [] }],
    });
    const runQueryFn = (signal = new AbortController().signal) => {
      renderHook(() => useWaveDrops({ waveId: "wave-1", containsMedia: true }));
      const options = useInfiniteQueryMock.mock.calls[0][0];
      return options.queryFn({ pageParam: null, signal });
    };

    it("keeps scanning older feed pages until one has media", async () => {
      const mediaDrop = {
        id: "media",
        serial_no: 18,
        parts: [{ media: [{ url: "image.png" }] }],
      };
      fetchWaveDropsFeedV2Mock
        .mockResolvedValueOnce({ drops: [textDrop(30), textDrop(29)] })
        .mockResolvedValueOnce({ drops: [textDrop(20), textDrop(19)] })
        .mockResolvedValueOnce({ drops: [mediaDrop, textDrop(17)] });

      const page = await runQueryFn();

      expect(fetchWaveDropsFeedV2Mock).toHaveBeenCalledTimes(3);
      expect(fetchWaveDropsFeedV2Mock.mock.calls.map(([args]) => args.serialNoLimit)).toEqual([
        null,
        29,
        19,
      ]);
      expect(page).toEqual({ drops: [mediaDrop], nextSerialNo: 17 });
    });

    it("stops at a hard request cap and resumes from where it stopped", async () => {
      let serialNo = 1000;
      fetchWaveDropsFeedV2Mock.mockImplementation(async () => {
        serialNo -= 2;
        return { drops: [textDrop(serialNo + 1), textDrop(serialNo)] };
      });

      const page = await runQueryFn();

      expect(fetchWaveDropsFeedV2Mock).toHaveBeenCalledTimes(10);
      expect(page).toEqual({ drops: [], nextSerialNo: 980 });
    });

    it("stops scanning when the feed is exhausted", async () => {
      fetchWaveDropsFeedV2Mock
        .mockResolvedValueOnce({ drops: [textDrop(3)] })
        .mockResolvedValueOnce({ drops: [] });

      await expect(runQueryFn()).resolves.toEqual({ drops: [] });
      expect(fetchWaveDropsFeedV2Mock).toHaveBeenCalledTimes(2);
    });

    it("treats a feed that makes no progress as the end of the list", async () => {
      fetchWaveDropsFeedV2Mock
        .mockResolvedValueOnce({ drops: [textDrop(5)] })
        .mockResolvedValueOnce({ drops: [textDrop(5)] });

      await expect(runQueryFn()).resolves.toEqual({ drops: [] });
      expect(fetchWaveDropsFeedV2Mock).toHaveBeenCalledTimes(2);
    });

    it("does not start another request once the query is cancelled", async () => {
      const controller = new AbortController();
      fetchWaveDropsFeedV2Mock.mockImplementation(async () => {
        controller.abort();
        return { drops: [textDrop(30)] };
      });

      await expect(runQueryFn(controller.signal)).rejects.toBeDefined();
      expect(fetchWaveDropsFeedV2Mock).toHaveBeenCalledTimes(1);
    });

    it("does not scan past the first feed page when media is not required", async () => {
      fetchWaveDropsFeedV2Mock.mockResolvedValue({ drops: [textDrop(3)] });
      renderHook(() => useWaveDrops({ waveId: "wave-1" }));
      const options = useInfiniteQueryMock.mock.calls[0][0];

      const page = await options.queryFn({
        pageParam: null,
        signal: new AbortController().signal,
      });

      expect(fetchWaveDropsFeedV2Mock).toHaveBeenCalledTimes(1);
      expect(page.drops).toHaveLength(1);
    });
  });

  it("debounces refetch for same-wave websocket updates and ignores others", async () => {
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
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });
    expect(refetch).not.toHaveBeenCalled();

    socketCallbacks.get(WsMessageType.DROP_UPDATE)?.({
      wave: { id: "wave-1" },
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });
    // Nothing is cached for the list yet, so the first-page refresh falls back
    // to the full refetch.
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

  it("leaves ATTACHMENT_STATUS_UPDATE to the app-wide realtime updater", () => {
    const {
      useWebSocketMessage,
    } = require("@/services/websocket/useWebSocketMessage");
    const subscribedTypes: WsMessageType[] = [];
    (useWebSocketMessage as jest.Mock).mockImplementation((type) => {
      subscribedTypes.push(type);
    });

    renderHook(() => useWaveDrops({ waveId: "wave-1" }));

    expect(subscribedTypes).toContain(WsMessageType.DROP_UPDATE);
    expect(subscribedTypes).not.toContain(
      WsMessageType.ATTACHMENT_STATUS_UPDATE
    );
  });
});
