import { act, renderHook } from "@testing-library/react";
import { useWaveChatPrefetch } from "@/hooks/competitions/useWaveChatPrefetch";

let mockPathname = "/waves/wave/competitions/competition";
const mockPrefetch = jest.fn();
const mockIsFetching = jest.fn(() => 0);
const mockRouter = { prefetch: mockPrefetch };
const mockClient = { isFetching: mockIsFetching };
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => mockRouter,
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockClient,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = "/waves/wave/competitions/competition";
  mockIsFetching.mockReturnValue(0);
});

it("does no speculative work on mount and gives foreground loading priority", () => {
  const { result } = renderHook(useWaveChatPrefetch);
  expect(mockPrefetch).not.toHaveBeenCalled();
  mockIsFetching.mockReturnValue(1);
  act(() => result.current());
  expect(mockPrefetch).not.toHaveBeenCalled();
  mockIsFetching.mockReturnValue(0);
  act(() => result.current());
  expect(mockPrefetch).toHaveBeenCalledWith(
    "/waves/wave?tab=chat&competition=competition"
  );
});

it("prefetches the current competition's shared Chat destination", () => {
  const { result, rerender } = renderHook(useWaveChatPrefetch);
  mockPathname = "/waves/wave/competitions/another";
  rerender();
  act(() => result.current());
  expect(mockPrefetch).toHaveBeenCalledWith(
    "/waves/wave?tab=chat&competition=another"
  );
});

it("does not prefetch from an ordinary wave Chat route", () => {
  mockPathname = "/waves/wave";
  const { result } = renderHook(useWaveChatPrefetch);
  act(() => result.current());
  expect(mockPrefetch).not.toHaveBeenCalled();
});
