import { useDropVoteSummary } from "@/components/waves/drop/useDropVoteSummary";
import { useQuery } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";

jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));
jest.mock("@/hooks/useDebouncedQueryRefetch", () => ({
  useDebouncedQueryRefetch: jest.fn(() => jest.fn()),
}));
jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));

const useQueryMock = jest.mocked(useQuery);
const refetch = jest.fn();
const distribution = {
  positive_total: 100,
  negative_total: 0,
  positive_votes: [],
  negative_votes: [],
};

const renderSummary = (enabled = true) =>
  renderHook(() =>
    useDropVoteSummary({ dropId: "drop-1", waveId: "wave-1", enabled })
  );

describe("useDropVoteSummary", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    refetch.mockResolvedValue(undefined);
  });

  it("distinguishes the first load from unavailable data", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isFetching: true,
      refetch,
    } as ReturnType<typeof useQuery>);

    expect(renderSummary().result.current).toEqual({ status: "loading" });
  });

  it("provides retry when the request fails or omits the optional summary", () => {
    useQueryMock.mockReturnValue({
      data: {},
      isError: true,
      isFetching: false,
      refetch,
    } as ReturnType<typeof useQuery>);

    const { result } = renderSummary();
    expect(result.current.status).toBe("unavailable");
    act(() => {
      if (result.current.status === "unavailable") {
        result.current.retry();
      }
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("preserves valid data when a background refresh fails", () => {
    useQueryMock.mockReturnValue({
      data: { vote_distribution: distribution },
      isError: true,
      isFetching: false,
      refetch,
    } as ReturnType<typeof useQuery>);

    expect(renderSummary().result.current).toEqual({
      status: "ready",
      voteDistribution: distribution,
      retry: expect.any(Function),
    });
  });

  it("does not expose cached data for an ineligible drop", () => {
    useQueryMock.mockReturnValue({
      data: { vote_distribution: distribution },
      isFetching: false,
      refetch,
    } as ReturnType<typeof useQuery>);

    expect(renderSummary(false).result.current).toEqual({
      status: "disabled",
    });
  });
});
