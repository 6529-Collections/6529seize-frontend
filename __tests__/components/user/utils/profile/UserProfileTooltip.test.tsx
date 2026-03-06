import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import UserProfileTooltip from "@/components/user/utils/profile/UserProfileTooltip";
import { AuthContext } from "@/components/auth/Auth";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { createDirectMessageWave } from "@/helpers/waves/waves.helpers";
import { navigateToDirectMessage } from "@/helpers/navigation.helpers";

const userFollowBtnMock = jest.fn(
  ({
    onDirectMessage,
  }: {
    readonly onDirectMessage?: (() => void) | undefined;
  }) => (
    <div data-testid="follow-btn">
      {onDirectMessage ? (
        <button
          type="button"
          aria-label="Send direct message"
          onClick={onDirectMessage}
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
  default: (props: unknown) => userFollowBtnMock(props as never),
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
  default: ({ followersCount }: { readonly followersCount: number }) => (
    <div data-testid="stats-row">{followersCount}</div>
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

const renderTooltip = (authOverrides: Record<string, unknown> = {}) => {
  const authValue = {
    connectedProfile: { handle: "alice" },
    activeProfileProxy: null,
    setToast: jest.fn(),
    ...authOverrides,
  } as any;

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <UserProfileTooltip user="bob" />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

describe("UserProfileTooltip", () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

  it("renders a DM action for another profile", async () => {
    const user = userEvent.setup();

    renderTooltip();

    expect(screen.getByTestId("pfp")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
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

  it("does not render follow or DM actions on your own profile", () => {
    renderTooltip({
      connectedProfile: { handle: "bob" },
    });

    expect(screen.queryByTestId("follow-btn")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send direct message" })
    ).not.toBeInTheDocument();
  });

  it("hides the DM action when acting through a proxy", () => {
    renderTooltip({
      activeProfileProxy: { id: "proxy-1" },
    });

    expect(screen.getByTestId("follow-btn")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send direct message" })
    ).not.toBeInTheDocument();
  });
});
