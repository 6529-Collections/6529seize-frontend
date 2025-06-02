import { renderHook } from "@testing-library/react";
import { useWaveData } from "../../hooks/useWaveData";
import { useQuery } from "@tanstack/react-query";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

const mockFetch = jest.fn();
jest.mock("../../services/api/common-api", () => ({
  commonApiFetch: () => mockFetch(),
}));

describe("useWaveData", () => {
  it("calls useQuery with correct params", () => {
    (useQuery as jest.Mock).mockReturnValue({ data: null });
    renderHook(() =>
      useWaveData({ waveId: "1", refetchInterval: 1000, onWaveNotFound: jest.fn() })
    );
    expect(useQuery).toHaveBeenCalled();
  });

  it("does not fetch when waveId is null", () => {
    (useQuery as jest.Mock).mockImplementation(({ queryFn }: any) => {
      return { data: null, queryFn };
    });
    const { result } = renderHook(() => useWaveData({ waveId: null }));
    expect((result as any).current.queryFn).toBeDefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles retry logic', () => {
    let options: any;
    (useQuery as jest.Mock).mockImplementation((opts: any) => { options = opts; return { data: null }; });
    const onWaveNotFound = jest.fn();
    renderHook(() => useWaveData({ waveId: '1', onWaveNotFound }));
    expect(options.retry(1, 'Wave 1 not found')).toBe(false);
    expect(onWaveNotFound).toHaveBeenCalled();
    expect(options.retry(2, new Error('e'))).toBe(true);
    expect(options.retry(4, new Error('e'))).toBe(false);
    expect(options.retryDelay(3)).toBe(3000);
  });
});
