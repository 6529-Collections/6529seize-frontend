import { render, screen } from "@testing-library/react";
import React from "react";
import { AuthContext } from "@/components/auth/Auth";
import UserPageFollowersModal from "@/components/user/followers/UserPageFollowersModal";
import useFollowersList from "@/hooks/useFollowersList";

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({ title, children }: any) => (
    <section role="dialog" aria-label={title}>
      {children}
    </section>
  ),
}));

jest.mock("@/components/utils/CommonIntersectionElement", () => ({
  __esModule: true,
  default: () => <div data-testid="intersection-sentinel" />,
}));

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

jest.mock("@/hooks/useFollowersList");

const mockedUseFollowersList = useFollowersList as jest.Mock;

const renderModal = () =>
  render(
    <AuthContext.Provider
      value={{
        connectedProfile: null,
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
      <UserPageFollowersModal
        profileId="profile-1"
        isOpen={true}
        onClose={jest.fn()}
      />
    </AuthContext.Provider>
  );

describe("UserPageFollowersModal", () => {
  beforeEach(() => {
    mockedUseFollowersList.mockReturnValue({
      followers: [
        {
          identity: {
            id: "1",
            handle: "alice",
            level: 5,
            pfp: "alice.png",
            primary_address: "0xalice",
          },
        },
      ],
      isFetching: false,
      onBottomIntersection: jest.fn(),
    });
  });

  it("uses the localized followers title and forwards list state", () => {
    renderModal();

    expect(
      screen.getByRole("dialog", { name: "Followers" })
    ).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Followers" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View alice's profile" })
    ).toHaveAttribute("href", "/alice");
    expect(mockedUseFollowersList).toHaveBeenCalledWith({
      profileId: "profile-1",
      enabled: true,
    });
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
  ])(
    "falls back to primary address when follower handle is %s",
    (_label, missingHandle) => {
      mockedUseFollowersList.mockReturnValue({
        followers: [
          {
            identity: {
              id: "2",
              handle: missingHandle,
              level: 2,
              pfp: "fallback.png",
              primary_address: "0xabc",
            },
          },
        ],
        isFetching: false,
        onBottomIntersection: jest.fn(),
      });

      renderModal();

      const profileLink = screen.getByRole("link", {
        name: "View 0xabc's profile",
      });
      expect(profileLink).toHaveAttribute("href", "/0xabc");
      expect(profileLink).toHaveAttribute("aria-label", "View 0xabc's profile");
      expect(profileLink).toHaveTextContent("0xabc");
      expect(screen.getByAltText("0xabc's profile image")).toBeInTheDocument();
    }
  );
});
