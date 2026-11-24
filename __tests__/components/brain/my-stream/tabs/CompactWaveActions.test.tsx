import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import CompactWaveActions, {
  CompactWaveActionsProvider,
} from "@/components/brain/my-stream/tabs/CompactWaveActions";
import type { CompactMenuItem } from "@/components/compact-menu";

const items: CompactMenuItem[] = [
  {
    id: "extra-wave-action",
    label: "Open wave activity",
    href: "/waves/wave/activity",
  },
  {
    id: "display-time-zone",
    label: "Show times in UTC for now",
    checked: true,
  },
  { id: "toggle-view-mode", label: "Switch to gallery view" },
  { id: "create-subwave", label: "New subwave" },
  { id: "wave-link", label: "Share wave" },
  { id: "search-messages", label: "Search messages" },
  { id: "submission-help", label: "How to Submit" },
  { id: "wave-details", label: "Wave details" },
];

it("groups phone actions without losing extra actions and exposes the UTC toggle state", () => {
  render(<CompactWaveActions phone items={items} />);
  fireEvent.click(screen.getByRole("button", { name: "More wave actions" }));
  const sheet = screen.getByRole("dialog", { name: "More wave actions" });
  expect(
    Array.from(sheet.querySelectorAll("[data-menu-item-id]"), (item) =>
      item.getAttribute("data-menu-item-id")
    )
  ).toEqual([
    "wave-details",
    "search-messages",
    "wave-link",
    "submission-help",
    "display-time-zone",
    "extra-wave-action",
    "toggle-view-mode",
    "create-subwave",
  ]);
  expect(within(sheet).getAllByRole("separator")).toHaveLength(2);
  expect(
    within(sheet)
      .getByRole("button", { name: "Show times in UTC for now", pressed: true })
      .querySelector("svg")
  ).toBeInTheDocument();
  expect(
    within(sheet).getByRole("link", { name: "Open wave activity" })
  ).toHaveAttribute("href", "/waves/wave/activity");
});

it("keeps non-phone action order and styling unchanged", () => {
  render(<CompactWaveActions items={items} />);
  fireEvent.click(screen.getByRole("button", { name: "More wave actions" }));
  const sheet = screen.getByRole("dialog", { name: "More wave actions" });
  expect(
    Array.from(sheet.querySelectorAll("[data-menu-item-id]"), (item) =>
      item.getAttribute("data-menu-item-id")
    )
  ).toEqual(items.map((item) => item.id));
  expect(within(sheet).queryByRole("separator")).not.toBeInTheDocument();
});

it("does not add dividers for absent groups", () => {
  render(<CompactWaveActions phone items={[items[4]!]} />);
  fireEvent.click(screen.getByRole("button", { name: "More wave actions" }));
  expect(
    screen.getByRole("button", { name: "Share wave" })
  ).toBeInTheDocument();
  expect(screen.queryByRole("separator")).not.toBeInTheDocument();
});

it("keeps the phone sheet and current actions when its header is replaced", async () => {
  const previousSearch = jest.fn();
  const currentSearch = jest.fn();
  const withSearch = (onSelect: () => void) =>
    items.map((item) =>
      item.id === "search-messages"
        ? { ...item, onSelect, deferUntilClosed: true }
        : item
    );
  function FirstHeader() {
    return <CompactWaveActions phone items={withSearch(previousSearch)} />;
  }
  function FinalHeader() {
    return <CompactWaveActions phone items={withSearch(currentSearch)} />;
  }
  const { rerender } = render(
    <CompactWaveActionsProvider>
      <FirstHeader />
    </CompactWaveActionsProvider>
  );
  fireEvent.click(screen.getByRole("button", { name: "More wave actions" }));
  const originalSheet = screen.getByRole("dialog", {
    name: "More wave actions",
  });
  const originalSearch = within(originalSheet).getByRole("button", {
    name: "Search messages",
  });
  rerender(
    <CompactWaveActionsProvider>
      <FinalHeader />
    </CompactWaveActionsProvider>
  );
  expect(screen.getByRole("dialog", { name: "More wave actions" })).toBe(
    originalSheet
  );
  expect(
    within(originalSheet).getByRole("button", { name: "Search messages" })
  ).toBe(originalSearch);
  fireEvent.click(originalSearch);
  await waitFor(() => expect(currentSearch).toHaveBeenCalledTimes(1));
  expect(previousSearch).not.toHaveBeenCalled();
});
