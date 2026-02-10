import { TabToggleWithOverflow } from "@/components/common/TabToggleWithOverflow";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("TabToggleWithOverflow", () => {
  const options = [
    { key: "a", label: "A" },
    { key: "b", label: "B" },
    { key: "c", label: "C" },
    { key: "d", label: "D" },
  ];

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const ensureButtonFocused = async (button: HTMLElement) => {
    await act(async () => {
      button.focus();
      await delay(50);
      if (document.activeElement !== button) {
        button.focus();
      }
    });
  };

  it("shows overflow items and handles selection", async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    render(
      <TabToggleWithOverflow
        options={options}
        activeKey="a"
        onSelect={onSelect}
        maxVisibleTabs={2}
      />
    );

    // visible tabs
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();

    // open overflow dropdown
    await user.click(screen.getByRole("button", { name: "More tabs" }));
    const optionC = screen.getByRole("menuitem", { name: "C" });
    expect(optionC).toBeInTheDocument();

    await user.click(optionC);
    expect(onSelect).toHaveBeenCalledWith("c");
    await waitFor(() =>
      expect(
        screen.queryByRole("menuitem", { name: "C" })
      ).not.toBeInTheDocument()
    );
  });

  it("shows active label when active tab is in overflow", () => {
    render(
      <TabToggleWithOverflow
        options={options}
        activeKey="d"
        onSelect={() => {}}
        maxVisibleTabs={2}
      />
    );

    // Button label should show active label
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("applies ARIA roles to visible tabs", () => {
    render(
      <TabToggleWithOverflow
        options={options}
        activeKey="a"
        onSelect={() => {}}
        maxVisibleTabs={2}
      />
    );

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("toggles the overflow menu with keyboard interactions", async () => {
    const user = userEvent.setup();
    render(
      <TabToggleWithOverflow
        options={options}
        activeKey="a"
        onSelect={() => {}}
        maxVisibleTabs={2}
      />
    );

    const moreButton = screen.getByRole("button", { name: "More tabs" });
    expect(moreButton).toHaveAttribute("aria-expanded", "false");

    await waitFor(() => {
      const activeTab = screen.getByRole("tab", { name: "A" });
      expect(activeTab).toHaveFocus();
    });

    await ensureButtonFocused(moreButton);

    await waitFor(() => expect(moreButton).toHaveFocus(), { timeout: 2000 });

    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(moreButton).toHaveAttribute("aria-expanded", "true")
    );
    const optionC = await screen.findByRole("menuitem", { name: "C" });
    expect(optionC).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(moreButton).toHaveAttribute("aria-expanded", "false")
    );
    await waitFor(() => {
      expect(
        screen.queryByRole("menuitem", { name: "C" })
      ).not.toBeInTheDocument();
    });

    await ensureButtonFocused(moreButton);

    await waitFor(() => expect(moreButton).toHaveFocus(), { timeout: 2000 });
    await user.keyboard(" ");
    await waitFor(() =>
      expect(moreButton).toHaveAttribute("aria-expanded", "true")
    );
    await screen.findByRole("menuitem", { name: "C" });
  });

  it("indicates overflow active state via data attribute when opened", async () => {
    const user = userEvent.setup();
    render(
      <TabToggleWithOverflow
        options={options}
        activeKey="d"
        onSelect={() => {}}
        maxVisibleTabs={2}
      />
    );

    const moreButton = screen.getByRole("button", { name: "More tabs" });
    await user.click(moreButton);

    expect(screen.getByRole("menuitem", { name: "D" })).toHaveAttribute(
      "data-active",
      "true"
    );
    expect(screen.getByRole("menuitem", { name: "C" })).toHaveAttribute(
      "data-active",
      "false"
    );
  });
});
