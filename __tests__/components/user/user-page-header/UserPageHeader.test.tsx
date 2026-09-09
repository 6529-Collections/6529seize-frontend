import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import UserPageHeaderClient from "@/components/user/user-page-header/UserPageHeaderClient";
import { AuthContext } from "@/components/auth/Auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useIdentity } from "@/hooks/useIdentity";
import { useProfileBlockState } from "@/hooks/content-moderation/useProfileBlockState";
import { useContentModeratorAccess } from "@/hooks/content-moderation/useContentModeratorAccess";
import { setModeratedProfileStatus } from "@/services/api/content-moderation-api";

let mockIsSuspended = false;
let mockIsModerator = false;

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
jest.mock(
  "@/components/user/user-page-header/ProfileBlockActionMenu",
  () =>
    ({
      moderationAction,
      onBlock,
      showPersonalActions = true,
    }: {
      readonly moderationAction?:
        | { readonly label: string; readonly onSelect: () => void }
        | undefined;
      readonly onBlock: () => void;
      readonly showPersonalActions?: boolean | undefined;
    }) => (
      <div data-testid="profile-actions-menu">
        {showPersonalActions ? (
          <>
            <button type="button">Mute notifications</button>
            <button type="button" onClick={onBlock}>
              Block profile
            </button>
          </>
        ) : null}
        {moderationAction ? (
          <button type="button" onClick={moderationAction.onSelect}>
            {moderationAction.label}
          </button>
        ) : null}
      </div>
    )
);
jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog",
  () =>
    ({
      confirmText,
      isOpen,
      message,
      onConfirm,
      title,
    }: {
      readonly confirmText: string;
      readonly isOpen: boolean;
      readonly message: string;
      readonly onConfirm: () => void;
      readonly title: string;
    }) =>
      isOpen ? (
        <div role="dialog" aria-label={title}>
          <p>{message}</p>
          <button type="button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      ) : null
);
jest.mock("@/components/user/utils/UserFollowBtn", () => ({
  __esModule: true,
  default: ({
    onDirectMessage,
    blocked = false,
    onUnblock,
    showFollowButton = true,
    showMuteButton = true,
    beforeFollowAction,
  }: {
    readonly onDirectMessage?: (() => void) | undefined;
    readonly blocked?: boolean | undefined;
    readonly onUnblock?: (() => void) | undefined;
    readonly showFollowButton?: boolean | undefined;
    readonly showMuteButton?: boolean | undefined;
    readonly beforeFollowAction?: React.ReactNode | undefined;
  }) => (
    <div data-testid="profile-actions">
      {onDirectMessage ? <button type="button">Direct Message</button> : null}
      {showMuteButton ? <button type="button">Mute</button> : null}
      {beforeFollowAction}
      {showFollowButton ? (
        <button
          type="button"
          data-testid="follow"
          onClick={blocked ? onUnblock : undefined}
        >
          {blocked ? "Unblock" : "Follow"}
        </button>
      ) : null}
    </div>
  ),
}));
jest.mock("@/components/user/utils/level/UserLevel", () => () => (
  <div data-testid="level" />
));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));
jest.mock("@/hooks/content-moderation/useProfileBlockState", () => ({
  useProfileBlockState: jest.fn(() => ({
    isBlocked: false,
    canManage: true,
    isLoading: false,
    isBlocking: false,
    isUnblocking: false,
    block: jest.fn().mockResolvedValue(undefined),
    unblock: jest.fn(),
  })),
}));
jest.mock(
  "@/hooks/content-moderation/usePublicProfileModerationStatus",
  () => ({
    usePublicProfileModerationStatus: () => ({
      isSuspended: mockIsSuspended,
    }),
  })
);
jest.mock("@/hooks/content-moderation/useContentModeratorAccess", () => ({
  useContentModeratorAccess: jest.fn(),
}));
jest.mock("@/services/api/content-moderation-api", () => ({
  setModeratedProfileStatus: jest.fn(),
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
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
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
    mockIsSuspended = false;
    mockIsModerator = false;
    jest.clearAllMocks();
    (useContentModeratorAccess as jest.Mock).mockImplementation(() => ({
      data: { moderator: mockIsModerator },
    }));
    (useQueryClient as jest.Mock).mockReturnValue({
      invalidateQueries: jest.fn().mockResolvedValue(undefined),
    });
    (useMutation as jest.Mock).mockImplementation((options) => ({
      isPending: false,
      mutate: (status: unknown) => {
        void Promise.resolve(options.mutationFn(status)).then(
          options.onSuccess,
          options.onError
        );
      },
    }));
    (setModeratedProfileStatus as jest.Mock).mockResolvedValue(undefined);
    auth.requestAuth.mockResolvedValue({ success: true });
    (useIdentity as jest.Mock).mockReturnValue({ profile });
    (useProfileBlockState as jest.Mock).mockReturnValue({
      isBlocked: false,
      canManage: true,
      isLoading: false,
      isBlocking: false,
      isUnblocking: false,
      block: jest.fn().mockResolvedValue(undefined),
      unblock: jest.fn(),
    });
    (useQuery as jest.Mock).mockReturnValue({
      isFetched: true,
      data: [{ statement_type: "BIO", statement_group: "GENERAL" }],
    });
  });

  it("lets only moderators suspend and reinstate a profile without changing personal block state", async () => {
    mockIsModerator = true;
    (useIdentity as jest.Mock).mockReturnValue({
      profile: { ...profile, id: "profile-bob" },
    });
    (useContentModeratorAccess as jest.Mock).mockReturnValue({
      data: { moderator: true },
    });
    const block = jest.fn();
    const unblock = jest.fn();
    (useProfileBlockState as jest.Mock).mockReturnValue({
      isBlocked: true,
      canManage: true,
      isLoading: false,
      isBlocking: false,
      isUnblocking: false,
      block,
      unblock,
    });

    render(
      <AuthContext.Provider value={auth}>
        <UserPageHeaderClient
          profile={{ ...profile, id: "profile-bob" }}
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
      screen.queryByRole("button", { name: "Block profile" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Suspend Profile" }));
    const dialog = screen.getByRole("dialog", { name: "Suspend Profile" });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Suspend Profile" })
    );

    await waitFor(() =>
      expect(setModeratedProfileStatus).toHaveBeenCalledWith("profile-bob", {
        status: "SUSPENDED",
        reason: null,
      })
    );
    expect(block).not.toHaveBeenCalled();
    expect(unblock).not.toHaveBeenCalled();
  });

  it("does not expose profile suspension controls to non-moderators", () => {
    render(
      <AuthContext.Provider value={auth}>
        <UserPageHeaderClient
          profile={{ ...profile, id: "profile-bob" }}
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
      screen.queryByRole("button", { name: "Suspend Profile" })
    ).not.toBeInTheDocument();
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

  it("keeps DM available, moves Unblock into the action row, and confirms it", async () => {
    const unblock = jest.fn().mockResolvedValue(undefined);
    (useIdentity as jest.Mock).mockReturnValue({
      profile: {
        ...profile,
        id: "profile-bob",
        primary_wallet: "0xbob",
      },
    });
    (useProfileBlockState as jest.Mock).mockReturnValue({
      isBlocked: true,
      canManage: true,
      isLoading: false,
      isBlocking: false,
      isUnblocking: false,
      block: jest.fn().mockResolvedValue(undefined),
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

    expect(screen.getByTestId("follow")).toHaveTextContent("Unblock");
    expect(
      screen.getByRole("button", { name: "Direct Message" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mute" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText("Blocked").parentElement).toHaveClass(
      "tw-border-red/35",
      "tw-bg-red/10",
      "tw-text-red"
    );
    fireEvent.click(screen.getByRole("button", { name: "Unblock" }));
    expect(unblock).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "Unblock @bob?" });
    expect(dialog).toHaveTextContent(
      "Their content and activity will be visible again. You won’t automatically follow them."
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Unblock" }));
    await waitFor(() => expect(unblock).toHaveBeenCalledTimes(1));
  });

  it("shows public suspended and viewer-specific blocked states independently", () => {
    mockIsSuspended = true;
    (useProfileBlockState as jest.Mock).mockReturnValue({
      isBlocked: true,
      canManage: true,
      isLoading: false,
      isBlocking: false,
      isUnblocking: false,
      block: jest.fn(),
      unblock: jest.fn(),
    });

    render(
      <AuthContext.Provider value={auth}>
        <UserPageHeaderClient
          profile={{ ...profile, id: "profile-bob" }}
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

    expect(screen.getByText("Suspended")).toBeVisible();
    expect(screen.getByText("Suspended").parentElement).toHaveClass(
      "tw-border-amber-400/35",
      "tw-bg-amber-400/10",
      "tw-text-amber-300"
    );
    expect(screen.getByText("Blocked")).toBeVisible();
  });

  it("offers profile blocking from the action menu and confirms it", async () => {
    const block = jest.fn().mockResolvedValue(undefined);
    (useIdentity as jest.Mock).mockReturnValue({
      profile: {
        ...profile,
        id: "profile-bob",
        primary_wallet: "0xbob",
      },
    });
    (useProfileBlockState as jest.Mock).mockReturnValue({
      isBlocked: false,
      canManage: true,
      isLoading: false,
      isBlocking: false,
      isUnblocking: false,
      block,
      unblock: jest.fn().mockResolvedValue(undefined),
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

    expect(
      within(screen.getByTestId("profile-actions")).queryByRole("button", {
        name: "Mute",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mute notifications" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Block profile" }));
    const dialog = screen.getByRole("dialog", { name: "Block @bob?" });
    expect(dialog).toHaveTextContent(
      "Hide their content, mute their activity and unfollow them. They won’t be notified."
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Block profile" })
    );
    await waitFor(() => expect(block).toHaveBeenCalledTimes(1));
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
      expect(preferencesButton).toHaveAttribute(
        "href",
        "/preferences?from=profile"
      );
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
        expect(preferencesLink).toHaveAttribute(
          "href",
          "/preferences?from=profile"
        );
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
