import { fireEvent, render, screen } from "@testing-library/react";
import { JoinedWavesListRecovery } from "@/components/brain/left-sidebar/waves/JoinedWavesListRecovery";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

it("offers manual pagination and disables it during a request", () => {
  const onLoadMore = jest.fn();
  const props = {
    hasError: false,
    hasNextPage: true,
    isFetching: false,
    onLoadMore,
    onRetry: jest.fn(),
  };
  const { rerender } = render(<JoinedWavesListRecovery {...props} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Load more joined waves" })
  );
  expect(onLoadMore).toHaveBeenCalledTimes(1);
  rerender(<JoinedWavesListRecovery {...props} isFetching />);
  expect(screen.getByRole("button")).toBeDisabled();
  expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
});

it("announces an incomplete list and retries without replacing its existing rows", () => {
  const retry = jest.fn();
  render(
    <JoinedWavesListRecovery
      hasError
      hasNextPage={false}
      isFetching={false}
      onLoadMore={jest.fn()}
      onRetry={retry}
    />
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Some joined waves could not be loaded."
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Retry loading joined waves" })
  );
  expect(retry).toHaveBeenCalledTimes(1);
});
