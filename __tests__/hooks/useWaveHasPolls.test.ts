import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useWaveHasPolls, useWavePollSummary } from "@/hooks/useWaveHasPolls";
import { fetchWavePollsV2 } from "@/services/api/wave-drops-v2-api";
import { renderHook } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";

jest.mock("@tanstack/react-query");
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchWavePollsV2: jest.fn(),
}));

const useQueryMock = useQuery as jest.Mock;
const fetchWavePollsV2Mock = fetchWavePollsV2 as jest.MockedFunction<
  typeof fetchWavePollsV2
>;

describe("useWavePollSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useQueryMock.mockReturnValue({ data: undefined });
  });

  it("returns poll availability and unanswered count from open_unanswered", async () => {
    fetchWavePollsV2Mock.mockResolvedValue({
      open_unanswered: 7,
      data: [],
      count: 3,
      page: 1,
      next: false,
    });

    renderHook(() => useWavePollSummary({ waveId: "wave-1" }));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.WAVE_POLLS,
          expect.objectContaining({
            scope: "poll-summary",
            waveId: "wave-1",
          }),
        ],
      })
    );

    const options = useQueryMock.mock.calls[0][0];
    await expect(
      options.queryFn({ signal: new AbortController().signal })
    ).resolves.toEqual({
      hasPolls: true,
      unansweredPolls: 7,
    });
  });

  it("accepts unanswered_polls as a fallback API field", async () => {
    fetchWavePollsV2Mock.mockResolvedValue({
      unanswered_polls: 5,
      data: [],
      count: 0,
      page: 1,
      next: false,
    } as any);

    renderHook(() => useWavePollSummary({ waveId: "wave-1" }));

    const options = useQueryMock.mock.calls[0][0];
    await expect(
      options.queryFn({ signal: new AbortController().signal })
    ).resolves.toEqual({
      hasPolls: false,
      unansweredPolls: 5,
    });
  });

  it("keeps the legacy boolean hook return shape", () => {
    useQueryMock.mockReturnValue({
      data: { hasPolls: true, unansweredPolls: 2 },
    });

    const { result } = renderHook(() => useWaveHasPolls({ waveId: "wave-1" }));

    expect(result.current).toBe(true);
  });
});
