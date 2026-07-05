import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupsSelectActiveGroup from "@/components/groups/select/GroupsSelectActiveGroup";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  keepPreviousData: "keepPreviousData",
}));

jest.mock("@/contexts/ActiveGroupContext", () => ({
  useActiveGroup: jest.fn(),
}));

let capturedProps: any = null;
jest.mock("@/components/groups/select/item/GroupItem", () => (props: any) => {
  capturedProps = props;
  return (
    <div
      data-testid="group-item"
      onClick={() => props.onActiveGroupId("new-id")}
    />
  );
});

const { useQuery: useQueryMock } = jest.requireMock("@tanstack/react-query");
const { useActiveGroup: useActiveGroupMock } = jest.requireMock(
  "@/contexts/ActiveGroupContext"
);

function renderComponent(activeId: string) {
  capturedProps = null;
  const setActiveGroupId = jest.fn();
  useActiveGroupMock.mockReturnValue({
    activeGroupId: activeId,
    setActiveGroupId,
  });
  return {
    setActiveGroupId,
    ...render(<GroupsSelectActiveGroup activeGroupId={activeId} />),
  };
}

describe("GroupsSelectActiveGroup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading text when group data is not loaded", () => {
    (useQueryMock as jest.Mock).mockImplementation(() => ({ data: null }));

    renderComponent("1");

    expect(
      screen.getByText("Loading...", { selector: "div" })
    ).toBeInTheDocument();
    expect(capturedProps).toBeNull();
  });

  it("renders members count and updates active group on item click", async () => {
    const groupData = {
      id: "1",
      name: "Group",
      created_at: 0,
      created_by: { handle: "bob" },
      group: {},
      visible: true,
      is_private: false,
    } as any;
    (useQueryMock as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === QueryKey.GROUP) {
        return { data: groupData };
      }
      if (queryKey[0] === QueryKey.COMMUNITY_MEMBERS_TOP) {
        return { data: { count: 3 } };
      }
      return { data: null };
    });

    const { setActiveGroupId } = renderComponent("1");

    await waitFor(() =>
      expect(screen.getByText(/Members:/)).toBeInTheDocument()
    );
    expect(capturedProps.group).toEqual(groupData);

    const user = userEvent.setup();
    await user.click(screen.getByTestId("group-item"));
    expect(setActiveGroupId).toHaveBeenCalledWith("new-id");
  });
});
