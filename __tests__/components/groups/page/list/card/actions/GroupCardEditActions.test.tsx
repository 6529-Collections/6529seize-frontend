import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupCardEditActions from "@/components/groups/page/list/card/actions/GroupCardEditActions";
import { AuthContext } from "@/components/auth/Auth";

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  motion: { div: (props: any) => <div {...props} /> },
}));

jest.mock(
  "@/components/groups/page/list/card/actions/delete/GroupCardDelete",
  () => () => <div data-testid="delete" />
);

describe("GroupCardEditActions", () => {
  const group: any = { created_by: { handle: "alice" } };
  const onEditClick = jest.fn();

  function renderComp(handle?: string) {
    return render(
      <AuthContext.Provider
        value={{ connectedProfile: handle ? { handle } : null } as any}
      >
        <GroupCardEditActions group={group} onEditClick={onEditClick} />
      </AuthContext.Provider>
    );
  }

  it("shows edit title and delete for owner", async () => {
    const user = userEvent.setup();
    renderComp("alice");
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByTestId("delete")).toBeInTheDocument();
  });

  it("uses a compact icon inside a 24px action target", () => {
    const { container } = renderComp("alice");
    const button = screen.getByRole("button", { name: "Open options" });
    const icon = container.querySelector("svg");

    expect(button).toHaveClass("tw-h-6", "tw-w-6");
    expect(icon).toHaveClass("tw-h-4", "tw-w-4");
  });

  it("calls onEditClick when option selected", async () => {
    const user = userEvent.setup();
    renderComp("bob");
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("menuitem"));
    expect(onEditClick).toHaveBeenCalledWith(group);
  });

  it("uses unique ids for each options menu", async () => {
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={{ connectedProfile: null } as any}>
        <GroupCardEditActions group={group} onEditClick={onEditClick} />
        <GroupCardEditActions group={group} onEditClick={onEditClick} />
      </AuthContext.Provider>
    );

    const buttons = screen.getAllByRole("button", { name: "Open options" });
    const buttonIds = buttons.map((button) => button.id);
    const menuIds = buttons.map((button) =>
      button.getAttribute("aria-controls")
    );

    expect(new Set(buttonIds).size).toBe(buttons.length);
    expect(new Set(menuIds).size).toBe(buttons.length);

    await user.click(buttons[0]!);
    const firstMenu = screen.getByRole("menu");
    const firstMenuItemId = screen.getByRole("menuitem").id;
    expect(firstMenu).toHaveAttribute("id", menuIds[0]);
    expect(firstMenu).toHaveAttribute("aria-labelledby", buttonIds[0]);

    await user.click(buttons[0]!);
    await user.click(buttons[1]!);
    const secondMenu = screen.getByRole("menu");
    const secondMenuItemId = screen.getByRole("menuitem").id;
    expect(secondMenu).toHaveAttribute("id", menuIds[1]);
    expect(secondMenu).toHaveAttribute("aria-labelledby", buttonIds[1]);
    expect(secondMenuItemId).not.toBe(firstMenuItemId);
  });
});
