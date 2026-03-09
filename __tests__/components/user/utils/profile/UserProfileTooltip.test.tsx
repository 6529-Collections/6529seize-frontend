import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import type { ComponentProps, ContextType } from "react";

import { AuthContext } from "@/components/auth/Auth";
import UserProfileTooltip from "@/components/user/utils/profile/UserProfileTooltip";
import { createDirectMessageWave } from "@/helpers/waves/waves.helpers";
import { navigateToDirectMessage } from "@/helpers/navigation.helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";

type TooltipProps = ComponentProps<typeof UserProfileTooltip>;

type CapturedDropAuthorBadgesProps = {
  readonly profile?: {
    readonly handle?: string | null;
  } | null;
  readonly tooltipIdPrefix?: string;
  readonly onArtistPreviewOpen?: TooltipProps["onArtistPreviewOpen"];
  readonly onWaveCreatorPreviewOpen?: TooltipProps["onWaveCreatorPreviewOpen"];
};

let capturedDropAuthorBadgesProps: CapturedDropAuthorBadgesProps | null = null;

type UserFollowBtnMockProps = {
  readonly onDirectMessage?: (() => void | Promise<void>) | undefined;
};

const userFollowBtnMock = jest.fn(
  ({ onDirectMessage }: UserFollowBtnMockProps) => (
    <div data-testid="follow-btn">
      {onDirectMessage ? (
        <button
          type="button"
          aria-label="Send direct message"
          onClick={() => {
            void onDirectMessage();
          }}
        >
          DM
        </button>
      ) : null}
    </div>
  )
);

jest.mock("@/components/drops/create/utils/DropPfp", () => ({
  __esModule: true,
  default: () => <div data-testid="pfp" />,
}));

jest.mock("@/components/user/utils/UserFollowBtn", () => ({
  __esModule: true,
  default: (props: unknown) =>
    userFollowBtnMock(props as UserFollowBtnMockProps),
  UserFollowBtnSize: {
    SMALL: "SMALL",
    MEDIUM: "MEDIUM",
  },
}));

jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: ({ level }: { readonly level: number }) => (
    <div data-testid="level">{level}</div>
  ),
  UserCICAndLevelSize: {
    SMALL: "SMALL",
    MEDIUM: "MEDIUM",
  },
}));

jest.mock("@/components/user/utils/stats/UserStatsRow", () => ({
  __esModule: true,
  default: ({
    handle,
    followersCount,
  }: {
    readonly handle: string;
    readonly followersCount: number;
  }) => (
    <div
      data-testid="stats-row"
      data-handle={handle}
      data-followers-count={followersCount}
    />
  ),
  UserStatsRowSize: {
    SMALL: "SMALL",
    MEDIUM: "MEDIUM",
  },
}));

jest.mock("@/components/user/utils/profile/UserProfileTooltipTopRep", () => ({
  __esModule: true,
  default: () => <div data-testid="top-rep" />,
}));

jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: (props: CapturedDropAuthorBadgesProps) => {
    capturedDropAuthorBadgesProps = props;
    return (
      <div
        data-testid="author-badges"
        data-profile-handle={props.profile?.handle ?? ""}
        data-tooltip-prefix={props.tooltipIdPrefix ?? ""}
      />
    );
  },
}));

jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: jest.fn(),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/helpers/waves/waves.helpers", () => ({
  createDirectMessageWave: jest.fn(),
}));

jest.mock("@/helpers/navigation.helpers", () => ({
  navigateToDirectMessage: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const useIdentityMock = useIdentity as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;
const createDirectMessageWaveMock = createDirectMessageWave as jest.Mock;
const navigateToDirectMessageMock = navigateToDirectMessage as jest.Mock;
const useRouterMock = useRouter as jest.Mock;

let queryClient: QueryClient;
let mockRouter: { push: jest.Mock; replace: jest.Mock };
let mockProfile: Record<string, unknown>;

const renderTooltip = ({
  authOverrides = {},
  tooltipProps = {},
}: {
  readonly authOverrides?: Record<string, unknown>;
  readonly tooltipProps?: Omit<Partial<TooltipProps>, "user">;
} = {}) => {
  const authValue = {
    connectedProfile: { handle: "alice" },
    activeProfileProxy: null,
    setToast: jest.fn(),
    ...authOverrides,
  } as ContextType<typeof AuthContext>;

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <UserProfileTooltip user="bob" {...tooltipProps} />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

describe("UserProfileTooltip", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    capturedDropAuthorBadgesProps = null;
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
    };

    mockProfile = {
      id: "profile-1",
      handle: "bob",
      display: "bob",
      pfp: "pfp-url",
      primary_wallet: "0xbob",
      tdh: 1,
      tdh_rate: 2.9,
      xtdh: 7.4,
      xtdh_rate: 9.2,
      level: 2,
      cic: 3,
      rep: 4,
    };

    useRouterMock.mockReturnValue(mockRouter);
    useIdentityMock.mockReturnValue({ profile: mockProfile });
    createDirectMessageWaveMock.mockResolvedValue({ id: "wave-1" });

    commonApiFetchMock.mockImplementation(
      async ({ endpoint }: { readonly endpoint: string }) => {
        if (endpoint.includes("/cic/statements")) {
          return [];
        }
        if (endpoint.includes("/rep/ratings/received")) {
          return { rating_stats: [] };
        }
        if (endpoint.includes("identity-subscriptions/incoming/IDENTITY/")) {
          return { count: 5 };
        }

        return {};
      }
    );
  });

  it("renders badges, stats, and a DM action for another profile", async () => {
    const user = userEvent.setup();

    renderTooltip();

    expect(screen.getByTestId("pfp")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByTestId("level")).toHaveTextContent("2");
    expect(screen.getByTestId("top-rep")).toBeInTheDocument();

    const badges = screen.getByTestId("author-badges");
    expect(badges).toHaveAttribute("data-profile-handle", "bob");
    expect(badges.getAttribute("data-tooltip-prefix")).toContain(
      "user-profile-tooltip-author-badges-"
    );

    await waitFor(() => {
      expect(commonApiFetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "identity-subscriptions/incoming/IDENTITY/profile-1",
        })
      );
    });

    expect(screen.getByTestId("stats-row")).toHaveAttribute(
      "data-handle",
      "bob"
    );
    expect(screen.getByTestId("stats-row")).toHaveAttribute(
      "data-followers-count",
      "5"
    );
    expect(screen.getByTestId("follow-btn")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send direct message" })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Send direct message" })
    );

    await waitFor(() => {
      expect(createDirectMessageWaveMock).toHaveBeenCalledWith({
        addresses: ["0xbob"],
      });
    });

    expect(navigateToDirectMessageMock).toHaveBeenCalledWith({
      waveId: "wave-1",
      router: mockRouter,
      isApp: false,
    });
  });

  it("passes preview-open callbacks to author badges when provided", () => {
    const onArtistPreviewOpen = jest.fn();
    const onWaveCreatorPreviewOpen = jest.fn();

    renderTooltip({
      tooltipProps: {
        onArtistPreviewOpen,
        onWaveCreatorPreviewOpen,
      },
    });

    expect(capturedDropAuthorBadgesProps?.onArtistPreviewOpen).toBe(
      onArtistPreviewOpen
    );
    expect(capturedDropAuthorBadgesProps?.onWaveCreatorPreviewOpen).toBe(
      onWaveCreatorPreviewOpen
    );
  });

  it("does not render follow or DM actions on your own profile", () => {
    renderTooltip({
      authOverrides: {
        connectedProfile: { handle: "bob" },
      },
    });

    expect(screen.queryByTestId("follow-btn")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send direct message" })
    ).not.toBeInTheDocument();
  });

  it("hides the DM action when acting through a proxy", () => {
    renderTooltip({
      authOverrides: {
        activeProfileProxy: { id: "proxy-1" },
      },
    });

    expect(screen.getByTestId("follow-btn")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send direct message" })
    ).not.toBeInTheDocument();
  });
});
