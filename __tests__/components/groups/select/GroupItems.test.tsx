import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupItems from "@/components/groups/select/GroupItems";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";

jest.mock("@/contexts/ActiveGroupContext");

const mockUseActiveGroup = useActiveGroup as unknown as jest.Mock;

let captured: any[] = [];

jest.mock("@/components/groups/select/item/GroupItem", () => ({
  __esModule: true,
  default: (props: any) => {
    captured.push(props);
    return (
      <div
        data-testid={`group-${props.group.id}`}
        onClick={() => props.onActiveGroupId(props.group.id)}
      />
    );
  },
}));

function renderComponent(groups: any[], activeId: string | null = null) {
  captured = [];
  const setActiveGroupId = jest.fn();
  mockUseActiveGroup.mockReturnValue({
    activeGroupId: activeId,
    setActiveGroupId,
  });
  render(<GroupItems groups={groups} />);
  return { setActiveGroupId };
}

describe("GroupItems", () => {
  it("passes active id to items and handles activation", async () => {
    const groups = [{ id: "1" }, { id: "2" }];
    const { setActiveGroupId } = renderComponent(groups, "2");
    expect(captured.map((c) => c.activeGroupId)).toEqual(["2", "2"]);
    const user = userEvent.setup();
    await user.click(screen.getByTestId("group-1"));
    expect(setActiveGroupId).toHaveBeenCalledWith("1");
  });
});
