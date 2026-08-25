import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import UserPageHeaderClient from "@/components/user/user-page-header/UserPageHeaderClient";
import { AuthContext } from "@/components/auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useIdentity } from "@/hooks/useIdentity";
import { useProfileBlockState } from "@/hooks/content-moderation/useProfileBlockState";

jest.mock("next/dynamic", () => () => () => <div />);
jest.mock(
  "@/components/user/user-page-header/banner/UserPageHeaderBanner",
  () => () => <div data-testid="banner" />
);
jest.mock(
  "@/components/user/user-page-header/pfp/UserPageHeaderPfp",
  () => () => <div data-testid="pfp" />
);
jest.mock(
  "@/components/user/user-page-header/pfp/UserPageHeaderPfpWrapper",
  () =>
    ({ children }: any) => <div data-testid="wrapper">{children}</div>
);
jest.mock(
  "@/components/user/user-page-header/about/UserPageHeaderAbout",
  () => () => <div data-testid="about" />
);
jest.mock(
  "@/components/user/user-page-header/name/UserPageHeaderName",
  () =>
    ({ titleAccessory }: { readonly titleAccessory?: React.ReactNode }) => (
      <div data-testid="name">{titleAccessory}</div>
    )
);
jest.mock(
  "@/components/user/user-page-header/stats/UserPageHeaderStats",
  () => () => <div data-testid="stats" />
);
jest.mock(
  "@/components/user/user-page-header/UserPageHeaderSubscriptionStatus",
  () =>
    ({
      layout = "card",
    }: {
      readonly layout?: "card" | "subtle" | "wide-row";
    }) => <div data-testid="subscription-status" data-layout={layout} />
);
jest.mock("@/components/user/utils/UserFollowBtn", () => ({
  __esModule: true,
  default: ({
    onDirectMessage,
    showFollowButton = true,
    showMuteButton = true,
  }: {
    readonly onDirectMessage?: (() => void) | undefined;
    readonly showFollowButton?: boolean | undefined;
    readonly showMuteButton?: boolean | undefined;
  }) => (
    <div data-testid="profile-actions">
      {onDirectMessage ? <button type="button">Direct Message</button> : null}
      {showMuteButton ? <button type="button">Mute</button> : null}
      {showFollowButton ? <div data-testid="follow" /> : null}
    </div>
  ),
}));
jest.mock("@/components/user/utils/level/UserLevel", () => () => (
  <div data-testid="level" />
));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));
jest.mock("@/hooks/content-moderation/useProfileBlockState", () => ({
  useProfileBlockState: jest.fn(() => ({
    isBlocked: false,
    isLoading: false,
    isUnblocking: false,
    unblock: jest.fn(),
  })),
}));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

const profile: any = { handle: "bob", level: 1 };
const useParamsMock = useParams as jest.Mock;
const useRouterMock = useRouter as jest.Mock;
(useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0x1" });
useParamsMock.mockReturnValue({ user: "bob" });
useRouterMock.mockReturnValue({ push: jest.fn() });
(useIdentity as jest.Mock).mockReturnValue({ profile });

const auth = {
  connectedProfile: { handle: "alice" },
  activeProfileProxy: null,
  setToast: jest.fn(),
} as any;
const ownProfileAuth = {
  connectedProfile: { handle: "bob" },
  activeProfileProxy: null,
  setToast: jest.fn(),
} as any;
const proxiedOwnProfileAuth = {
  ...ownProfileAuth,
  activeProfileProxy: { handle: "proxy" },
} as any;

describe("UserPageHeader", () => {
  beforeEach(() => {
    (useIdentity as jest.Mock).mockReturnValue({ profile });
    (useProfileBlockState as jest.Mock).mockReturnValue({
      isBlocked: false,
      isLoading: false,
      isUnblocking: false,
      unblock: jest.fn(),
    });
    (useQuery as jest.Mock).mockReturnValue({
      isFetched: true,
      data: [{ statement_type: "BIO", statement_group: "GENERAL" }],
    });
  });

  it("renders follow button and about section", () => {
    render(
      <AuthContext.Provider value={auth}>
        <UserPageHeaderClient
          profile={profile}
          handleOrWallet="bob"
          fallbackMainAddress="0x1"
          defaultBanner1="#000000"
          defaultBanner2="#111111"
          initialStatements={[
            {
              statement_type: "BIO",
              statement_group: "GENERAL",
            } as any,
          ]}
          profileEnabledAt="2024-01-01T00:00:00Z"
          followersCount={5}
          cmsWebsiteHref={null}
        />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId("follow")).toBeInTheDocument();
    expect(screen.getByTestId("about")).toBeInTheDocument();
    expect(screen.queryByTestId("subscription-status")).not.toBeInTheDocument();
  });

  it("keeps DM available and replaces follow and mute with a compact block indicator", () => {
    const unblock = jest.fn();
    (useIdentity as jest.Mock).mockReturnValue({
      profile: {
        ...profile,
        id: "profile-bob",
        primary_wallet: "0xbob",
      },
    });
    (useProfileBlockState as jest.Mock).mockReturnValue({
      isBlocked: true,
      isLoading: false,
      isUnblocking: false,
      unblock,
    });

    render(
      <AuthContext.Provider value={auth}>
        <UserPageHeaderClient
          profile={{
            ...profile,
            id: "profile-bob",
            primary_wallet: "0xbob",
          }}
          handleOrWallet="bob"
          fallbackMainAddress="0x1"
          defaultBanner1="#000000"
          defaultBanner2="#111111"
          initialStatements={[]}
          profileEnabledAt="2024-01-01T00:00:00Z"
          followersCount={5}
          cmsWebsiteHref={null}
        />
      </AuthContext.Provider>
    );

    expect(screen.queryByTestId("follow")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Direct Message" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mute" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Unblock" }));
    expect(unblock).toHaveBeenCalledTimes(1);
  });

  it("does not render follow or DM actions on your own profile", () => {
    render(
      <AuthContext.Provider value={ownProfileAuth}>
        <UserPageHeaderClient
          profile={profile}
          handleOrWallet="bob"
          fallbackMainAddress="0x1"
          defaultBanner1="#000000"
          defaultBanner2="#111111"
          initialStatements={[
            {
              statement_type: "BIO",
              statement_group: "GENERAL",
            } as any,
          ]}
          profileEnabledAt="2024-01-01T00:00:00Z"
          followersCount={5}
          cmsWebsiteHref={null}
        />
      </AuthContext.Provider>
    );

    expect(screen.queryByTestId("follow")).not.toBeInTheDocument();
    const subscriptionStatuses = screen.getAllByTestId("subscription-status");
    expect(subscriptionStatuses).toHaveLength(2);
    expect(
      subscriptionStatuses.filter(
        (subscriptionStatus) =>
          subscriptionStatus.dataset["layout"] === "subtle"
      )
    ).toHaveLength(1);
    expect(
      subscriptionStatuses.filter(
        (subscriptionStatus) =>
          subscriptionStatus.dataset["layout"] === "wide-row"
      )
    ).toHaveLength(1);
    const preferencesButtons = screen.getAllByRole("link", {
      name: "Preferences",
    });
    expect(preferencesButtons).toHaveLength(3);
    expect(preferencesButtons[0]).toHaveClass(
      "tw-size-11",
      "!tw-bg-transparent",
      "min-[840px]:tw-hidden"
    );
    preferencesButtons.slice(1).forEach((preferencesButton) => {
      expect(preferencesButton).toHaveClass(
        "!tw-border-white/10",
        "!tw-bg-iron-950",
        "tw-shadow-md",
        "tw-shadow-black/40"
      );
    });
    preferencesButtons.forEach((preferencesButton) => {
      expect(preferencesButton).toHaveAttribute("href", "/preferences");
    });
  });

  it("links to preferences from your own profile", () => {
    render(
      <AuthContext.Provider value={ownProfileAuth}>
        <UserPageHeaderClient
          profile={profile}
          handleOrWallet="bob"
          fallbackMainAddress="0x1"
          defaultBanner1="#000000"
          defaultBanner2="#111111"
          initialStatements={[]}
          profileEnabledAt="2024-01-01T00:00:00Z"
          followersCount={5}
          cmsWebsiteHref={null}
        />
      </AuthContext.Provider>
    );

    screen
      .getAllByRole("link", { name: "Preferences" })
      .forEach((preferencesLink) => {
        expect(preferencesLink).toHaveAttribute("href", "/preferences");
      });
  });

  it("does not show preferences when viewing another profile", () => {
    render(
      <AuthContext.Provider value={auth}>
        <UserPageHeaderClient
          profile={profile}
          handleOrWallet="bob"
          fallbackMainAddress="0x1"
          defaultBanner1="#000000"
          defaultBanner2="#111111"
          initialStatements={[]}
          profileEnabledAt="2024-01-01T00:00:00Z"
          followersCount={5}
          cmsWebsiteHref={null}
        />
      </AuthContext.Provider>
    );

    expect(
      screen.queryByRole("link", { name: "Preferences" })
    ).not.toBeInTheDocument();
  });

  it("does not show preferences while using a profile proxy", () => {
    render(
      <AuthContext.Provider value={proxiedOwnProfileAuth}>
        <UserPageHeaderClient
          profile={profile}
          handleOrWallet="bob"
          fallbackMainAddress="0x1"
          defaultBanner1="#000000"
          defaultBanner2="#111111"
          initialStatements={[]}
          profileEnabledAt="2024-01-01T00:00:00Z"
          followersCount={5}
          cmsWebsiteHref={null}
        />
      </AuthContext.Provider>
    );

    expect(
      screen.queryByRole("link", { name: "Preferences" })
    ).not.toBeInTheDocument();
  });

  it("renders profile website link when a primary CMS site exists", () => {
    render(
      <AuthContext.Provider value={auth}>
        <UserPageHeaderClient
          profile={profile}
          handleOrWallet="bob"
          fallbackMainAddress="0x1"
          defaultBanner1="#000000"
          defaultBanner2="#111111"
          initialStatements={[]}
          profileEnabledAt="2024-01-01T00:00:00Z"
          followersCount={5}
          cmsWebsiteHref="/bob/index.html"
        />
      </AuthContext.Provider>
    );

    expect(
      screen.getByRole("link", { name: "Open bob website" })
    ).toHaveAttribute("href", "/bob/index.html");
  });

  it("does not render profile website link without a primary CMS site", () => {
    render(
      <AuthContext.Provider value={auth}>
        <UserPageHeaderClient
          profile={profile}
          handleOrWallet="bob"
          fallbackMainAddress="0x1"
          defaultBanner1="#000000"
          defaultBanner2="#111111"
          initialStatements={[]}
          profileEnabledAt="2024-01-01T00:00:00Z"
          followersCount={5}
          cmsWebsiteHref={null}
        />
      </AuthContext.Provider>
    );

    expect(
      screen.queryByRole("link", { name: "Open bob website" })
    ).not.toBeInTheDocument();
  });
});
