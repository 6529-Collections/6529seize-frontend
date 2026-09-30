import { fireEvent, render, screen } from "@testing-library/react";
import { ActiveWaveVotes } from "@/components/waves/discovery/ActiveWaveVotes";
import type { InfiniteData } from "@tanstack/react-query";
import type { ApiActiveWaveVotesPage } from "@/generated/models/ApiActiveWaveVotesPage";
import { useActiveWaveVotes } from "@/hooks/useActiveWaveVotes";
jest.mock("@/hooks/useActiveWaveVotes");
const mockVotes = jest.mocked(useActiveWaveVotes);
const refetch = jest.fn();
function state({
  isPending = false,
  isError = false,
  hasNextPage = false,
  isFetchingNextPage = false,
} = {}): ReturnType<typeof useActiveWaveVotes> {
  const data: InfiniteData<ApiActiveWaveVotesPage> = {
    pages: [{ count: 0, data: [], page: 1, next: false }],
    pageParams: [1],
  };
  const shared = {
    data,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: isFetchingNextPage,
    isLoading: false as const,
    isPending: false as const,
    isLoadingError: false as const,
    isInitialLoading: false,
    isPaused: false,
    isPlaceholderData: false as const,
    isRefetching: false,
    isStale: false,
    isEnabled: true,
    refetch,
    fetchStatus: "idle" as const,
    promise: Promise.resolve(data),
    fetchNextPage: jest.fn(),
    fetchPreviousPage: jest.fn(),
    hasNextPage,
    hasPreviousPage: false,
    isFetchNextPageError: false as const,
    isFetchingNextPage,
    isFetchPreviousPageError: false as const,
    isFetchingPreviousPage: false,
  };
  if (isPending) {
    return {
      ...shared,
      data: undefined,
      status: "pending",
      isPending: true,
      isLoading: true,
      isInitialLoading: true,
      error: null,
      isError: false,
      isRefetchError: false,
      isSuccess: false,
    };
  }
  return isError
    ? {
        ...shared,
        status: "error",
        error: new Error("Unavailable"),
        isError: true,
        isRefetchError: true,
        isSuccess: false,
      }
    : {
        ...shared,
        status: "success",
        error: null,
        isError: false,
        isRefetchError: false,
        isSuccess: true,
      };
}

it("shows an error and retry without presenting cached zero as empty", () => {
  mockVotes.mockReturnValue(state({ isError: true }));
  render(<ActiveWaveVotes />);
  expect(screen.getByRole("alert")).toBeVisible();
  expect(
    screen.queryByText("No active TDH votes right now.")
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(refetch).toHaveBeenCalled();
});
it("shows an empty status only after a successful request", () => {
  mockVotes.mockReturnValue(state());
  render(<ActiveWaveVotes />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "No active TDH votes right now."
  );
});
it("marks pagination busy while fetching more votes", () => {
  mockVotes.mockReturnValue(
    state({ hasNextPage: true, isFetchingNextPage: true })
  );
  render(<ActiveWaveVotes />);
  expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("button")).toBeDisabled();
});

it("shows accessible shimmer loading without a visible loading message", () => {
  mockVotes.mockReturnValue(state({ isPending: true }));
  const { rerender } = render(<ActiveWaveVotes />);
  expect(screen.getByRole("region", { name: "Active Votes" })).toHaveAttribute(
    "aria-busy",
    "true"
  );
  expect(screen.getByRole("status")).toHaveClass("tw-sr-only");
  expect(
    screen.queryByText("No active TDH votes right now.")
  ).not.toBeInTheDocument();
  mockVotes.mockReturnValue(state());
  rerender(<ActiveWaveVotes />);
  expect(screen.getByRole("region", { name: "Active Votes" })).toHaveAttribute(
    "aria-busy",
    "false"
  );
  expect(screen.queryByText("Loading waves…")).not.toBeInTheDocument();
});
