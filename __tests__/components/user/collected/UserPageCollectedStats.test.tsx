import UserPageCollectedStats from "@/components/user/collected/UserPageCollectedStats";
import type { UserPageStatsInitialData } from "@/components/user/stats/userPageStats.types";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";

type MotionSectionProps = ComponentProps<"section">;
type MotionDivProps = ComponentProps<"div">;
type MotionSpanProps = ComponentProps<"span">;

jest.mock("framer-motion", () => ({
  __esModule: true,
  AnimatePresence: ({ children }: { readonly children: ReactNode }) => children,
  motion: {
    section: ({ children, ...props }: MotionSectionProps) => (
      <section {...props}>{children}</section>
    ),
    div: ({ children, ...props }: MotionDivProps) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: MotionSpanProps) => (
      <span {...props}>{children}</span>
    ),
  },
  useReducedMotion: () => false,
}));

jest.mock("@/components/user/stats/tags/UserPageStatsTags", () => ({
  __esModule: true,
  default: () => <div data-testid="tags" />,
}));

jest.mock("@/components/user/stats/UserPageStatsDetailsContent", () => ({
  __esModule: true,
  default: () => <div data-testid="details" />,
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const apiMock = commonApiFetch as jest.Mock;

const profile = {
  wallets: [{ wallet: "0x1" }],
  consolidation_key: "key",
} as any;

const buildInitialStatsData = (
  overrides: Partial<UserPageStatsInitialData> = {}
): UserPageStatsInitialData => ({
  initialActiveAddress: null,
  initialSeasons: [{} as any],
  initialTdh: {} as any,
  initialOwnerBalance: {} as any,
  initialBalanceMemes: [{} as any],
  ...overrides,
});

const renderWithQueryClient = (ui: ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("UserPageCollectedStats", () => {
  beforeEach(() => {
    apiMock.mockClear();
    apiMock.mockResolvedValue({});
  });

  it("opens and closes details locally", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <UserPageCollectedStats
        profile={profile}
        activeAddress={null}
        initialStatsData={buildInitialStatsData()}
      />
    );

    expect(screen.queryByTestId("details")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(screen.getByRole("button", { name: "Hide Details" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByTestId("details")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide Details" }));
    expect(screen.getByRole("button", { name: "Details" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.queryByTestId("details")).not.toBeInTheDocument();
  });

  it("fetches address-specific stats when collected address changes", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <UserPageCollectedStats
          profile={profile}
          activeAddress={null}
          initialStatsData={buildInitialStatsData()}
        />
      </QueryClientProvider>
    );

    expect(apiMock).not.toHaveBeenCalled();

    rerender(
      <QueryClientProvider client={queryClient}>
        <UserPageCollectedStats
          profile={profile}
          activeAddress={"0x0000000000000000000000000000000000000001"}
          initialStatsData={buildInitialStatsData()}
        />
      </QueryClientProvider>
    );

    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(3));

    const endpoints = apiMock.mock.calls.map((call) => call[0].endpoint);
    expect(endpoints).toEqual([
      "tdh/wallet/0x0000000000000000000000000000000000000001",
      "owners-balances/wallet/0x0000000000000000000000000000000000000001",
      "owners-balances/wallet/0x0000000000000000000000000000000000000001/memes",
    ]);
  });

  it("fetches seasons and stats on mount when initial data is missing", async () => {
    renderWithQueryClient(
      <UserPageCollectedStats
        profile={profile}
        activeAddress={null}
        initialStatsData={buildInitialStatsData({
          initialSeasons: [],
          initialTdh: undefined,
          initialOwnerBalance: undefined,
          initialBalanceMemes: [],
        })}
      />
    );

    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(3));

    const endpoints = apiMock.mock.calls.map((call) => call[0].endpoint);
    expect(endpoints).toEqual([
      "new_memes_seasons",
      "tdh/consolidation/key",
      "owners-balances/consolidation/key",
    ]);
  });
});
