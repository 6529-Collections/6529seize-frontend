import { render, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupCard from "@/components/groups/page/list/card/GroupCard";
import { AuthContext } from "@/components/auth/Auth";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

jest.mock("@/components/groups/page/list/card/GroupCardView", () => () => (
  <div data-testid="view" />
));

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
