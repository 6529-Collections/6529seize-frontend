import { renderHook } from "@testing-library/react";
import { useWaveGalleryDrops } from "@/hooks/useWaveGalleryDrops";

const mockUseWaveDrops = jest.fn();

jest.mock("@/hooks/useWaveDrops", () => ({
  useWaveDrops: (args: unknown) => mockUseWaveDrops(args),
}));

describe("useWaveGalleryDrops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWaveDrops.mockReturnValue({
      drops: [],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });
  });

  it("delegates to useWaveDrops with gallery defaults", () => {
    const { result } = renderHook(() => useWaveGalleryDrops("wave-1"));

    expect(mockUseWaveDrops).toHaveBeenCalledWith({
      waveId: "wave-1",
      containsMedia: true,
      limit: 20,
    });
    expect(result.current.drops).toEqual([]);
  });
});
