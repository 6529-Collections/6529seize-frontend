import React, { type ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import Follower from "@/components/utils/followers/Follower";
import { AuthContext } from "@/components/auth/Auth";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, fill, sizes, unoptimized, ...props }: any) =>
    React.createElement("img", { alt: alt ?? "", ...props }),
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
  identity: {
    id: "1",
    handle: "alice",
    level: 5,
    cic: 0,
    pfp: "pic.png",
    primary_address: "0xalice",
  },
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
  expect(
    screen.getByRole("link", { name: "View alice's profile" })
  ).toHaveAttribute("href", "/alice");
  expect(screen.getByAltText("alice's profile image")).toBeInTheDocument();
  expect(screen.getByTestId("cic")).toHaveTextContent("5");
});

test.each([
  ["null", null],
  ["undefined", undefined],
])(
  "falls back to primary address when follower handle is %s",
  (_label, missingHandle) => {
    const follower = {
      identity: {
        id: "3",
        handle: missingHandle,
        level: 2,
        cic: 0,
        pfp: "pic.png",
        primary_address: "0xabc",
      },
    } as any;

    render(<Follower follower={follower} />);

    const profileLink = screen.getByRole("link", {
      name: "View 0xabc's profile",
    });
    expect(profileLink).toHaveAttribute("href", "/0xabc");
    expect(profileLink).toHaveAttribute("aria-label", "View 0xabc's profile");
    expect(profileLink).toHaveTextContent("0xabc");
    expect(screen.getByAltText("0xabc's profile image")).toBeInTheDocument();
  }
);

test("shows placeholder when no pfp", () => {
  const follower = {
    identity: {
      id: "2",
      handle: "bob",
      level: 1,
      cic: 0,
      pfp: "",
      primary_address: "0xbob",
    },
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
