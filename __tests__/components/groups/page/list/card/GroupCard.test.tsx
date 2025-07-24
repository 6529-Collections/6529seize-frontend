import React from "react";
import { render, fireEvent } from "@testing-library/react";
import GroupCard, {
  GroupCardState,
} from "../../../../../../components/groups/page/list/card/GroupCard";
import { AuthContext } from "@/components/auth/Auth";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

jest.mock(
  "@/components/groups/page/list/card/GroupCardView",
  () => (props: any) =>
    (
      <div
        data-testid="view"
        onClick={() => props.setState && props.setState(GroupCardState.REP)}
      />
    )
);
jest.mock(
  "@/components/groups/page/list/card/vote-all/GroupCardVoteAll",
  () => (props: any) => <div data-testid={`vote-${props.matter}`} />
);

const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push });

describe("GroupCard", () => {
  const group: any = {
    id: "g1",
    name: "g",
    created_by: { handle: "h" },
    group: {
      tdh: {},
      rep: {},
      cic: {},
      level: {},
      owns_nfts: [],
      identity_group_id: null,
      identity_group_identities_count: 0,
      excluded_identity_group_id: null,
      excluded_identity_group_identities_count: 0,
    },
    created_at: 0,
    visible: true,
    is_private: false,
  };

  function renderComp(opts: any = {}) {
    return render(
      <AuthContext.Provider
        value={{ connectedProfile: { handle: "me" } } as any}>
        <GroupCard group={group} {...opts} />
      </AuthContext.Provider>
    );
  }

  it("navigates to community view when idle", () => {
    renderComp();
    fireEvent.click(document.querySelector("div.tw-col-span-1")!);
    expect(push).toHaveBeenCalledWith(`/network?page=1&group=${group.id}`);
  });

  it("calls setActiveGroupIdVoteAll when view is clicked", () => {
    const setActive = jest.fn();
    const { container } = renderComp({
      activeGroupIdVoteAll: null,
      setActiveGroupIdVoteAll: setActive,
    });

    // Click the view to trigger state change
    fireEvent.click(container.querySelector('[data-testid="view"]')!);

    // Should call the callback to notify parent of state change
    expect(setActive).toHaveBeenCalledWith(group.id);
  });
});
