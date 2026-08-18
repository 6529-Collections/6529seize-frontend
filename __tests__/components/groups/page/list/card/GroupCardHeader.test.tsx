import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import GroupCardHeader from "@/components/groups/page/list/card/GroupCardHeader";
import { AuthContext } from "@/components/auth/Auth";

jest.mock(
  "@/components/groups/page/list/card/actions/GroupCardEditActions",
  () => () => <div data-testid="edit" />
);

const baseGroup: any = {
  id: "group-1",
  name: "Collectors",
  created_by: { handle: "alice", pfp: "pic.png" },
  created_at: "2023-01-01",
};

function renderComp(
  opts: {
    handle?: string | null | undefined;
    activeProxy?: boolean | undefined;
    group?: any | undefined;
  } = {}
) {
  const { handle = null, activeProxy = false } = opts;
  const group = "group" in opts ? opts.group : baseGroup;
  return render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: handle ? { handle } : null,
          activeProfileProxy: activeProxy,
        } as any
      }
    >
      <GroupCardHeader
        group={group}
        onEditClick={jest.fn()}
        titlePlaceholder="Loading group"
      />
    </AuthContext.Provider>
  );
}

test("keeps the title as a native group link without a second tab stop", () => {
  renderComp();
  const title = screen.getByRole("link", { name: "Collectors" });

  expect(title).toHaveAttribute("href", "/network?page=1&group=group-1");
  expect(title).toHaveAttribute("tabindex", "-1");
  expect(fireEvent.click(title, { ctrlKey: true })).toBe(true);
  expect(fireEvent.click(title, { metaKey: true })).toBe(true);
  expect(
    title.dispatchEvent(
      new MouseEvent("auxclick", {
        bubbles: true,
        cancelable: true,
        button: 1,
      })
    )
  ).toBe(true);
});

test("renders the title placeholder while loading", () => {
  renderComp({ group: undefined });

  expect(screen.getByText("Loading group")).toBeInTheDocument();
});

test("shows edit actions when connected and not proxied", () => {
  renderComp({ handle: "me" });
  expect(screen.getByTestId("edit")).toBeInTheDocument();
});

test("hides edit actions when proxy active", () => {
  renderComp({ handle: "me", activeProxy: true });
  expect(screen.queryByTestId("edit")).toBeNull();
});
