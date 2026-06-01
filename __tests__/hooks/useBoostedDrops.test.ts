import { renderHook } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { useBoostedDrops } from "@/hooks/useBoostedDrops";
import { fetchGlobalBoostedDropsV2 } from "@/services/api/wave-drops-v2-api";
import { TIME_WINDOW_MS, TimeWindow } from "@/types/boosted-drops.types";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchGlobalBoostedDropsV2: jest.fn(),
}));

const useQueryMock = useQuery as jest.Mock;
const fetchGlobalBoostedDropsV2Mock =
  fetchGlobalBoostedDropsV2 as jest.MockedFunction<
    typeof fetchGlobalBoostedDropsV2
  >;

type QueryOptions = {
  readonly queryKey: readonly unknown[];
  readonly queryFn: (context: { readonly signal?: AbortSignal }) => unknown;
};

describe("useBoostedDrops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    useQueryMock.mockImplementation((options: QueryOptions) => {
      return { data: [] };
    });
    fetchGlobalBoostedDropsV2Mock.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses the global v2 boosted drops fetch with a minimum boost filter", async () => {
    let capturedOptions: QueryOptions | undefined;
    useQueryMock.mockImplementation((options: QueryOptions) => {
      capturedOptions = options;
      return { data: [] };
    });

    renderHook(() => useBoostedDrops({ limit: 50 }));

    expect(capturedOptions?.queryKey).toEqual([
      expect.any(String),
      {
        global: true,
        limit: 50,
        minBoosts: 3,
        timeWindow: TimeWindow.DAY,
      },
    ]);

    await capturedOptions?.queryFn({});

    expect(fetchGlobalBoostedDropsV2Mock).toHaveBeenCalledWith({
      limit: 50,
      countOnlyBoostsAfter: 1_000_000 - TIME_WINDOW_MS[TimeWindow.DAY],
      minBoosts: 3,
      signal: undefined,
    });
  });
});
