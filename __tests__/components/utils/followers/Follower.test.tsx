import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import Follower from "@/components/utils/followers/Follower";
import { AuthContext } from "@/components/auth/Auth";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

jest.mock("@/helpers/Helpers", () => ({ cicToType: jest.fn(() => "UNKNOWN") }));

jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="cic">{props.level}</div>,
  UserCICAndLevelSize: { SMALL: "SMALL" },
}));

jest.mock("@/components/user/utils/UserFollowBtn", () => ({
  __esModule: true,
  default: ({ handle }: any) => <button type="button">Follow {handle}</button>,
  UserFollowBtnSize: { SMALL: "SMALL" },
}));

const baseFollower: any = {
  identity: { handle: "alice", level: 5, cic: 0, pfp: "pic.png" },
};

const renderWithAuth = (ui: ReactElement, connectedProfile: any = null) =>
  render(
    <AuthContext.Provider
      value={{
        connectedProfile,
        fetchingProfile: false,
        receivedProfileProxies: [],
        activeProfileProxy: null,
        connectionStatus: "NOT_CONNECTED" as any,
        showWaves: false,
        requestAuth: async () => ({ success: false }),
        setToast: jest.fn(),
        setActiveProfileProxy: jest.fn(),
      }}
    >
      {ui}
    </AuthContext.Provider>
  );

test("renders follower info with image", () => {
  render(<Follower follower={baseFollower} />);
  expect(screen.getByRole("link")).toHaveAttribute("href", "/alice");
  expect(screen.getByAltText("alice's profile")).toBeInTheDocument();
  expect(screen.getByTestId("cic")).toHaveTextContent("5");
});

test("shows placeholder when no pfp", () => {
  const follower = {
    identity: { handle: "bob", level: 1, cic: 0, pfp: "" },
  } as any;
  const { container } = render(<Follower follower={follower} />);
  expect(container.querySelector("img")).toBeNull();
});

test("shows follow button for logged-out users when enabled", () => {
  renderWithAuth(<Follower follower={baseFollower} showFollowButton />);
  expect(
    screen.getByRole("button", { name: "Follow alice" })
  ).toBeInTheDocument();
});

test("hides follow button for the connected user", () => {
  renderWithAuth(<Follower follower={baseFollower} showFollowButton />, {
    handle: "ALICE",
  });
  expect(screen.queryByRole("button", { name: "Follow alice" })).toBeNull();
});
