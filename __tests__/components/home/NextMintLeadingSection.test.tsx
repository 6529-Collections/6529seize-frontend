import { NextMintLeadingSection } from "@/components/home/next-mint-leading/NextMintLeadingSection";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import type { ManifoldClaimStatus } from "@/hooks/useManifoldClaim";
import { useWaveDropsLeaderboard } from "@/hooks/useWaveDropsLeaderboard";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import { render, screen } from "@testing-library/react";

jest.mock("@/hooks/useNextMintDrop", () => ({ useNextMintDrop: jest.fn() }));
jest.mock("@/hooks/useNowMintingStatus", () => ({
  useNowMintingStatus: jest.fn(),
}));
jest.mock("@/hooks/useWaveDropsLeaderboard", () => ({
  useWaveDropsLeaderboard: jest.fn(),
  WaveDropsLeaderboardSort: { RATING_PREDICTION: "RATING_PREDICTION" },
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/home/next-mint-leading/LeadingCard", () => ({
  LeadingCard: ({ drop }: { readonly drop: { title: string } }) => (
    <article>{drop.title}</article>
  ),
}));
jest.mock("@/components/home/next-mint-leading/NextMintCard", () => ({
  NextMintCard: ({ drop }: { readonly drop: { title: string } }) => (
    <article aria-label="Next mint">{drop.title}</article>
  ),
}));

const mintMock = jest.mocked(useNowMintingStatus);
const winnerMock = jest.mocked(useNextMintDrop);
const leaderboardMock = jest.mocked(useWaveDropsLeaderboard);
const getMint = () => mintMock.getMockImplementation()!();
const getWinner = () => winnerMock.getMockImplementation()!();
const getLeaderboard = () =>
  leaderboardMock.getMockImplementation()!({ waveId: "main-stage" });
const winner = { id: "winner", title: "Next artwork" } as ApiDropV2View;
const leaders = ["First artwork", "Second artwork", "Third artwork"].map(
  (title, id) =>
    ({ id: String(id), title }) as ReturnType<
      typeof useWaveDropsLeaderboard
    >["drops"][number]
);

beforeEach(() => {
  jest.clearAllMocks();
  mintMock.mockReturnValue({
    nft: { id: 563, name: "Current artwork" },
    status: "active" as ManifoldClaimStatus,
    isDropComplete: false,
    isFetching: false,
  } as ReturnType<typeof useNowMintingStatus>);
  winnerMock.mockReturnValue({
    nextMint: null,
    nextMintTitle: null,
    nextDecisionTime: null,
    waveId: "main-stage",
    isReady: true,
    isSettingsLoaded: true,
    isFetching: false,
    isLoading: false,
  });
  leaderboardMock.mockReturnValue({
    drops: leaders,
    pageMetadata: [],
    queryWindowKey: "home",
    fetchNextPage: jest.fn(),
    fetchPreviousPage: jest.fn(),
    hasNextPage: false,
    hasPreviousPage: false,
    isFetchNextPageError: false,
    isFetchPreviousPageError: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isFetching: false,
    isError: false,
    refetch: jest.fn().mockResolvedValue(undefined),
    manualFetch: jest.fn().mockResolvedValue(undefined),
  });
});

it("shows all leaders while winner and current-artwork details are pending", () => {
  winnerMock.mockReturnValue({ ...getWinner(), isFetching: true });
  mintMock.mockReturnValue({
    ...getMint(),
    nft: undefined,
    status: null,
    isFetching: true,
  });
  render(<NextMintLeadingSection />);
  expect(screen.getAllByRole("article")).toHaveLength(3);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it.each([
  "missing artwork",
  "unknown mint status",
  "same artwork",
  "ended mint",
])("does not label a winner as next mint with %s", (scenario) => {
  winnerMock.mockReturnValue({
    ...getWinner(),
    nextMint: winner,
    nextMintTitle: winner.title ?? null,
  });
  let current = getMint();
  if (scenario === "missing artwork") current = { ...current, nft: undefined };
  if (scenario === "unknown mint status")
    current = { ...current, status: null };
  if (scenario === "same artwork")
    current = { ...current, nft: { ...current.nft!, name: " NEXT ARTWORK " } };
  if (scenario === "ended mint") current = { ...current, isDropComplete: true };
  mintMock.mockReturnValue(current);
  render(<NextMintLeadingSection />);
  expect(
    screen.queryByRole("article", { name: "Next mint" })
  ).not.toBeInTheDocument();
  expect(screen.getByText("Third artwork")).toBeInTheDocument();
});

it("shows the confirmed next mint with two leaders", () => {
  winnerMock.mockReturnValue({
    ...getWinner(),
    nextMint: winner,
    nextMintTitle: winner.title ?? null,
  });
  render(<NextMintLeadingSection />);
  expect(screen.getByRole("article", { name: "Next mint" })).toHaveTextContent(
    "Next artwork"
  );
  expect(screen.queryByText("Third artwork")).not.toBeInTheDocument();
});

it.each(["loaded", "empty", "failed"])(
  "keeps two leader placeholders beside a ready next mint until the request is %s",
  (outcome) => {
    winnerMock.mockReturnValue({
      ...getWinner(),
      nextMint: winner,
      nextMintTitle: winner.title ?? null,
    });
    leaderboardMock.mockReturnValue({
      ...getLeaderboard(),
      drops: [],
      isFetching: true,
    });
    const { rerender } = render(<NextMintLeadingSection />);
    expect(screen.getByRole("article", { name: "Next mint" })).toBeVisible();
    expect(screen.getAllByTestId("coming-up-loading-card")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading upcoming artwork…"
    );

    leaderboardMock.mockReturnValue({
      ...getLeaderboard(),
      drops: outcome === "loaded" ? leaders : [],
      isFetching: false,
      isError: outcome === "failed",
    });
    rerender(<NextMintLeadingSection />);
    expect(screen.getByRole("article", { name: "Next mint" })).toBeVisible();
    expect(screen.queryAllByTestId("coming-up-loading-card")).toHaveLength(0);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(
      outcome === "loaded" ? 3 : 1
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  }
);

it("keeps cached leaders visible beside next mint during refresh", () => {
  winnerMock.mockReturnValue({
    ...getWinner(),
    nextMint: winner,
    nextMintTitle: winner.title ?? null,
  });
  leaderboardMock.mockReturnValue({ ...getLeaderboard(), isFetching: true });
  render(<NextMintLeadingSection />);
  expect(screen.getAllByRole("article")).toHaveLength(3);
  expect(screen.queryAllByTestId("coming-up-loading-card")).toHaveLength(0);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it.each([false, true])(
  "does not add error or retry UI after a failed refresh with cached cards=%s",
  (cached) => {
    leaderboardMock.mockReturnValue({
      ...getLeaderboard(),
      drops: cached ? leaders : [],
      isError: true,
    });
    render(<NextMintLeadingSection />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" })
    ).not.toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(cached ? 3 : 0);
    expect(screen.queryAllByRole("region", { name: "Coming up" })).toHaveLength(
      cached ? 1 : 0
    );
  }
);

it("stays hidden while initial settings are unavailable", () => {
  winnerMock.mockReturnValue({ ...getWinner(), waveId: null, isReady: false });
  leaderboardMock.mockReturnValue({ ...getLeaderboard(), drops: [] });
  render(<NextMintLeadingSection />);
  expect(
    screen.queryByRole("region", { name: "Coming up" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Try again" })
  ).not.toBeInTheDocument();
});

it("keeps the loading state while a request is pending", () => {
  leaderboardMock.mockReturnValue({
    ...getLeaderboard(),
    drops: [],
    isFetching: true,
  });
  render(<NextMintLeadingSection />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Loading upcoming artwork…"
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Try again" })
  ).not.toBeInTheDocument();
});

it("keeps a successful empty result hidden even if optional mint details are pending", () => {
  leaderboardMock.mockReturnValue({ ...getLeaderboard(), drops: [] });
  mintMock.mockReturnValue({
    ...getMint(),
    nft: undefined,
    status: null,
    isFetching: true,
  });
  render(<NextMintLeadingSection />);
  expect(
    screen.queryByRole("region", { name: "Coming up" })
  ).not.toBeInTheDocument();
});
