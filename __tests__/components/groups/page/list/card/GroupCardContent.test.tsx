import { fireEvent, render, screen } from "@testing-library/react";
import { AuthContext } from "@/components/auth/Auth";
import GroupCardContent from "@/components/groups/page/list/card/GroupCardContent";
import { GroupCardState } from "@/components/groups/page/list/card/GroupCard";

jest.mock("@/components/groups/page/list/card/GroupCardConfigs", () => () => (
  <div data-testid="configs" />
));

const group: any = {
  id: "group-1",
  name: "Collectors",
};

function renderContent({
  connected = false,
  setState,
}: {
  readonly connected?: boolean;
  readonly setState?: (state: GroupCardState) => void;
} = {}) {
  return render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: connected ? { handle: "alice" } : null,
        } as any
      }
    >
      <GroupCardContent
        group={group}
        haveActiveGroupVoteAll={false}
        setState={setState}
      />
    </AuthContext.Provider>
  );
}

describe("GroupCardContent", () => {
  it("shows the group source and configuration", () => {
    renderContent();

    expect(
      screen.getByText("Source: filters + optional manual list")
    ).toBeInTheDocument();
    expect(screen.getByTestId("configs")).toBeInTheDocument();
  });

  it("keeps vote-all controls independent from card navigation", () => {
    const setState = jest.fn();
    renderContent({ connected: true, setState });

    fireEvent.click(screen.getByRole("button", { name: "Rep all" }));
    fireEvent.click(screen.getByRole("button", { name: "NIC all" }));

    expect(setState).toHaveBeenNthCalledWith(1, GroupCardState.REP);
    expect(setState).toHaveBeenNthCalledWith(2, GroupCardState.NIC);
  });
});
