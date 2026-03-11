import { renderHook } from "@testing-library/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import { useWaveDrops } from "@/hooks/useWaveDrops";

jest.mock("@tanstack/react-query");
jest.mock("@/services/api/common-api");
jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;

describe("useWaveDrops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    let socketCallback: ((message: { wave: { id: string } }) => void) | null =
      null;
    const {
      useWebSocketMessage,
    } = require("@/services/websocket/useWebSocketMessage");
    (useWebSocketMessage as jest.Mock).mockImplementation((_, callback) => {
      socketCallback = callback;
    });

    renderHook(() =>
      useWaveDrops({
        waveId: "wave-1",
      })
    );

    socketCallback?.({ wave: { id: "wave-2" } });
    jest.advanceTimersByTime(1000);
    expect(refetch).not.toHaveBeenCalled();

    socketCallback?.({ wave: { id: "wave-1" } });
    jest.advanceTimersByTime(1000);
    expect(refetch).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
