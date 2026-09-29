import { fireEvent, render, screen } from "@testing-library/react";
import { ActiveWaveVotes } from "@/components/waves/discovery/ActiveWaveVotes";
import { useActiveWaveVotes } from "@/hooks/useActiveWaveVotes";
jest.mock("@/hooks/useActiveWaveVotes");
const mockVotes = jest.mocked(useActiveWaveVotes);
const refetch = jest.fn();
function state(overrides: object = {}) {
  return {
    isPending: false,
    isError: false,
    hasNextPage: false,
    refetch,
    data: { pages: [{ count: 0, data: [] }] },
    ...overrides,
  } as ReturnType<typeof useActiveWaveVotes>;
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
