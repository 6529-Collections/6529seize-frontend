import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompactMenu } from "@/components/compact-menu";

describe("CompactMenu focus", () => {
  it("preserves active-item autofocus by default and supports keyboard selection", async () => {
    const user = userEvent.setup();
    const select = jest.fn();
    render(
      <CompactMenu
        trigger="Options"
        activeItemId="second"
        onItemSelect={select}
        items={[
          { id: "first", label: "First" },
          { id: "second", label: "Second" },
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Options" }));
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Second" })).toHaveFocus()
    );
    await user.keyboard("{ArrowUp}{Enter}");
    expect(select).toHaveBeenCalledWith("first");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(screen.getByRole("button", { name: "Options" })).toHaveFocus();
  });

  it("opens neutrally with a pointer and exposes link items to keyboard navigation", async () => {
    const user = userEvent.setup();
    render(
      <CompactMenu
        trigger="Create"
        autoFocusItem={false}
        items={[{ id: "linked", label: "Linked action", href: "/waves" }]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Create" }));
    const menu = screen.getByRole("menu");
    const link = screen.getByRole("menuitem", { name: "Linked action" });
    await waitFor(() => expect(menu).toHaveFocus());
    expect(menu).not.toHaveAttribute("aria-activedescendant");
    expect(link).not.toHaveFocus();
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/waves");

    await user.keyboard("{ArrowDown}");
    expect(menu).toHaveAttribute("aria-activedescendant", link.id);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(screen.getByRole("button", { name: "Create" })).toHaveFocus();
  });
});
