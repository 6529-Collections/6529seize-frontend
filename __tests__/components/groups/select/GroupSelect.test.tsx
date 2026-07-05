import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupSelect from "@/components/groups/select/GroupSelect";
import { AuthContext } from "@/components/auth/Auth";

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(),
  keepPreviousData: "keepPreviousData",
}));

jest.mock("@/contexts/ActiveGroupContext", () => ({
  useActiveGroup: jest.fn(),
}));

let identityProps: any = null;
jest.mock("@/components/utils/input/identity/IdentitySearch", () => ({
  __esModule: true,
  IdentitySearchSize: { SM: "SM" },
  default: (props: any) => {
    identityProps = props;
    return <div data-testid="identity" />;
  },
}));

let groupItemsProps: any = null;
jest.mock("@/components/groups/select/GroupItems", () => (props: any) => {
  groupItemsProps = props;
  return <div data-testid="items" />;
});

let activeGroupProps: any = null;
jest.mock(
  "@/components/groups/select/GroupsSelectActiveGroup",
  () => (props: any) => {
    activeGroupProps = props;
    return <div data-testid="active" />;
  }
);

const { useInfiniteQuery: useQueryMock } = jest.requireMock(
  "@tanstack/react-query"
);
const { useActiveGroup: useActiveGroupMock } = jest.requireMock(
  "@/contexts/ActiveGroupContext"
);

function renderComponent(
  auth: any = { connectedProfile: { handle: "bob" }, activeProfileProxy: null }
) {
  return render(
    <AuthContext.Provider value={auth}>
      <GroupSelect />
    </AuthContext.Provider>
  );
}

describe("GroupSelect", () => {
  beforeEach(() => {
    identityProps = null;
    groupItemsProps = null;
    activeGroupProps = null;
    jest.clearAllMocks();
  });

  it("renders active group section and passes groups", async () => {
    const groups = [{ id: "1", created_at: 1 } as any];
    (useQueryMock as jest.Mock).mockReturnValue({ data: { pages: [groups] } });
    (useActiveGroupMock as jest.Mock).mockReturnValue({
      activeGroupId: "g1",
      setActiveGroupId: jest.fn(),
    });

    renderComponent();

    expect(screen.getByTestId("active")).toBeInTheDocument();
    await waitFor(() => expect(groupItemsProps.groups).toEqual(groups));
  });

  it("sets identity from my groups button and updates group name input", async () => {
    (useQueryMock as jest.Mock).mockReturnValue({ data: { pages: [[]] } });
    (useActiveGroupMock as jest.Mock).mockReturnValue({
      activeGroupId: null,
      setActiveGroupId: jest.fn(),
    });

    const { container } = renderComponent();
    const input = screen.getByLabelText("By Group Name") as HTMLInputElement;
    await userEvent.type(input, "group");
    expect(input).toHaveValue("group");

    await userEvent.click(screen.getByRole("button", { name: "My groups" }));
    expect(identityProps.identity).toBe("bob");

    const clear = container.querySelector(
      "svg.tw-cursor-pointer"
    ) as HTMLElement;
    await userEvent.click(clear);
    expect(input).toHaveValue("");
  });
});
