import { renderHook } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));
jest.mock("@/services/api/common-api");

const useQueryMock = useQuery as jest.Mock;
const fetchMock = commonApiFetch as jest.Mock;

describe("useWaveDecisions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useQueryMock.mockReturnValue({
      data: { data: [] },
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });
  });

  it("configures a single-page query and sorts loaded decisions", () => {
    const unsortedDecision = {
      decision_time: 2,
      winners: [{ place: 2 }, { place: 1 }],
    };

    useQueryMock.mockReturnValue({
      data: {
        data: [
          { decision_time: 3, winners: [{ place: 3 }, { place: 1 }] },
          unsortedDecision,
          { decision_time: 1, winners: [{ place: 1 }] },
        ],
      },
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    const { result } = renderHook(() => useWaveDecisions({ waveId: "w1" }));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [QueryKey.WAVE_DECISIONS, { waveId: "w1" }],
        enabled: true,
      })
    );
    expect(
      result.current.decisionPoints.map((point) => point.decision_time)
    ).toEqual([1, 2, 3]);
    expect(
      result.current.decisionPoints[1]?.winners.map((winner) => winner.place)
    ).toEqual([1, 2]);
  });

  it("requests the first page of decisions", async () => {
    fetchMock.mockResolvedValue({
      data: [],
    });

    renderHook(() => useWaveDecisions({ waveId: "w1" }));

    const options = useQueryMock.mock.calls[0][0];
    await options.queryFn();

    expect(fetchMock).toHaveBeenCalledWith({
      endpoint: "waves/w1/decisions",
      params: {
        sort_direction: "DESC",
        sort: "decision_time",
        page: "1",
        page_size: "100",
      },
    });
  });
});
