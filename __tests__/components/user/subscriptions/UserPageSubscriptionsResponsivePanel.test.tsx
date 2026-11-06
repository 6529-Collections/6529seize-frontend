import UserPageSubscriptionsResponsivePanel from "@/components/user/subscriptions/UserPageSubscriptionsResponsivePanel";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

jest.mock("@/hooks/useMediaQuery");

const mockUseMediaQuery = jest.mocked(useMediaQuery);

function RetainedContent() {
  const [page, setPage] = useState(1);
  return <button onClick={() => setPage(page + 1)}>Page {page}</button>;
}

function Panel() {
  return (
    <UserPageSubscriptionsResponsivePanel
      id="profile-subscriptions-history"
      title="Subscription History"
    >
      <RetainedContent />
    </UserPageSubscriptionsResponsivePanel>
  );
}

afterEach(() => jest.restoreAllMocks());

beforeEach(() => {
  jest.clearAllMocks();
  mockUseMediaQuery.mockReturnValue(true);
  jest.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: query === "(max-width: 1023px)",
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  window.history.replaceState({}, "", "/");
});

it("opens a named sheet, retains its content on close, and restores focus", async () => {
  const user = userEvent.setup();
  render(<Panel />);
  const opener = screen.getByRole("button", { name: "Subscription History" });
  expect(
    screen.queryByRole("button", { name: "Page 1" })
  ).not.toBeInTheDocument();
  await user.click(opener);
  const sheet = screen.getByRole("dialog", { name: "Subscription History" });
  await waitFor(() => expect(within(sheet).getByRole("heading")).toHaveFocus());
  await user.click(within(sheet).getByRole("button", { name: "Page 1" }));
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  );
  await waitFor(() => expect(opener).toHaveFocus());
  await user.click(opener);
  expect(screen.getByRole("button", { name: "Page 2" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Close" }));
  await waitFor(() => expect(opener).toHaveFocus());
});

it("opens mobile hash links, including repeated links after closing", async () => {
  const user = userEvent.setup();
  window.history.replaceState({}, "", "/#profile-subscriptions-history");
  render(
    <>
      <a href="#profile-subscriptions-history">History link</a>
      <Panel />
    </>
  );
  await screen.findByRole("dialog", { name: "Subscription History" });
  await user.click(screen.getByRole("button", { name: "Close" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  );
  await user.click(screen.getByRole("link", { name: "History link" }));
  expect(
    await screen.findByRole("dialog", { name: "Subscription History" })
  ).toBeVisible();
});

it("renders inline on desktop and releases the open sheet when crossing lg", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<Panel />);
  await user.click(
    screen.getByRole("button", { name: "Subscription History" })
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  act(() => {
    mockUseMediaQuery.mockReturnValue(false);
    rerender(<Panel />);
  });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "Subscription History" })
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Subscription History" })
  ).not.toBeInTheDocument();
});
