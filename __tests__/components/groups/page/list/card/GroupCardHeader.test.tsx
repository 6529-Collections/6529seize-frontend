import { fireEvent, render, screen } from "@testing-library/react";
import GroupCardHeader from "@/components/groups/page/list/card/GroupCardHeader";

const baseGroup: any = {
  id: "group-1",
  name: "Collectors",
  created_by: { handle: "alice", pfp: "pic.png" },
  created_at: "2023-01-01",
};

function renderComp(
  opts: {
    group?: any | undefined;
  } = {}
) {
  const group = "group" in opts ? opts.group : baseGroup;
  return render(
    <GroupCardHeader group={group} titlePlaceholder="Loading group" />
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
