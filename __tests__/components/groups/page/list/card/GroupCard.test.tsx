import React from "react";
import { render, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupCard, {
  GroupCardState,
} from "@/components/groups/page/list/card/GroupCard";
import { AuthContext } from "@/components/auth/Auth";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

jest.mock(
  "@/components/groups/page/list/card/GroupCardView",
  () => (props: any) => (
    <div data-testid="view">
      {props.setState && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            props.setState(GroupCardState.REP);
          }}
        >
          Rep all
        </button>
      )}
    </div>
  )
);
jest.mock(
  "@/components/groups/page/list/card/vote-all/GroupCardVoteAll",
  () => (props: any) => <div data-testid={`vote-${props.matter}`} />
);

const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push });

beforeEach(() => {
  push.mockClear();
});

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
        value={{ connectedProfile: { handle: "me" } } as any}
      >
        <GroupCard group={group} {...opts} />
      </AuthContext.Provider>
    );
  }

  it("exposes a native whole-card link when idle", () => {
    const { getByRole } = renderComp();
    expect(getByRole("link", { name: "Open g" })).toHaveAttribute(
      "href",
      `/network?page=1&group=${group.id}`
    );
  });

  it("navigates to community view when pressing Enter", async () => {
    const user = userEvent.setup();
    const { getByRole } = renderComp();
    const cardLink = getByRole("link", { name: "Open g" });

    cardLink.focus();
    await user.keyboard("{Enter}");

    expect(push).toHaveBeenCalledWith(`/network?page=1&group=${group.id}`);
  });

  it("navigates to community view when pressing Space", async () => {
    const user = userEvent.setup();
    const { getByRole } = renderComp();
    const cardLink = getByRole("link", { name: "Open g" });

    cardLink.focus();
    await user.keyboard(" ");

    expect(push).toHaveBeenCalledWith(`/network?page=1&group=${group.id}`);
  });

  it("does not navigate when a nested action is clicked", () => {
    const setActive = jest.fn();
    function CardHarness() {
      const [activeGroupId, setActiveGroupId] = React.useState<string | null>(
        null
      );
      return (
        <AuthContext.Provider
          value={{ connectedProfile: { handle: "me" } } as any}
        >
          <GroupCard
            group={group}
            activeGroupIdVoteAll={activeGroupId}
            setActiveGroupIdVoteAll={(value) => {
              setActive(value);
              setActiveGroupId(value);
            }}
          />
        </AuthContext.Provider>
      );
    }
    const { getByRole, queryByRole } = render(<CardHarness />);

    fireEvent.click(getByRole("button", { name: "Rep all" }));

    expect(setActive).toHaveBeenCalledWith(group.id);
    expect(push).not.toHaveBeenCalled();
    expect(queryByRole("link", { name: "Open g" })).not.toBeInTheDocument();
  });

  it("does not activate whole-card navigation for placeholders", () => {
    const { getByTestId, queryByRole } = render(
      <AuthContext.Provider value={{ connectedProfile: null } as any}>
        <GroupCard titlePlaceholder="Loading group" />
      </AuthContext.Provider>
    );

    fireEvent.click(getByTestId("view"));

    expect(push).not.toHaveBeenCalled();
    expect(
      queryByRole("link", { name: "Open Loading group" })
    ).not.toBeInTheDocument();
  });
});
