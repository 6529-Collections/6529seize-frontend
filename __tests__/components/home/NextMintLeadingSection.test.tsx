import { NextMintLeadingSection } from "@/components/home/next-mint-leading/NextMintLeadingSection";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNowMintingStatus } from "@/hooks/useNowMintingStatus";
import type { ManifoldClaimStatus } from "@/hooks/useManifoldClaim";
import { useWaveDropsLeaderboard } from "@/hooks/useWaveDropsLeaderboard";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));
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

const settingsMock = jest.mocked(useSeizeSettings);
const mintMock = jest.mocked(useNowMintingStatus);
const winnerMock = jest.mocked(useNextMintDrop);
const leaderboardMock = jest.mocked(useWaveDropsLeaderboard);
const getSettings = () => settingsMock.getMockImplementation()!();
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
  settingsMock.mockReturnValue({
    seizeSettings: {
      rememes_submission_tdh_threshold: 0,
      memes_wave_id: "main-stage",
      curation_wave_id: null,
      quorum_wave_id: null,
      announcements_wave_id: null,
      distribution_admin_wallets: [],
      claims_admin_wallets: [],
      auth: {
        structured_signatures_required: false,
        session_v2_migration_deadline: null,
      },
      consolidation: null,
    },
    isMemesWave: jest.fn(),
    isCurationWave: jest.fn(),
    isQuorumWave: jest.fn(),
    isAnnouncementsWave: jest.fn(),
    isMemesSubmission: jest.fn(),
    isLoaded: true,
    isLoading: false,
    loadError: null,
    loadSeizeSettings: jest.fn().mockResolvedValue(undefined),
  });
  mintMock.mockReturnValue({
    nft: { id: 563, name: "Current artwork" },
    status: "active" as ManifoldClaimStatus,
    isDropComplete: false,
    isFetching: false,
  } as ReturnType<typeof useNowMintingStatus>);
  winnerMock.mockReturnValue({
    nextMint: null,
    nextMintTitle: null,
    waveId: "main-stage",
    isReady: true,
    isSettingsLoaded: true,
    isFetching: false,
    isError: false,
    isPaused: false,
    refetch: jest.fn().mockResolvedValue(undefined),
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
    isPaused: false,
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

it.each([false, true])(
  "shows failure and retries only the leaderboard with cached cards=%s",
  (cached) => {
    const leaderboard = {
      ...getLeaderboard(),
      drops: cached ? leaders : [],
      isError: true,
    };
    leaderboardMock.mockReturnValue(leaderboard);
    render(<NextMintLeadingSection />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      cached ? "couldn’t be updated" : "couldn’t load"
    );
    expect(screen.queryAllByRole("article")).toHaveLength(cached ? 3 : 0);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(leaderboard.refetch).toHaveBeenCalledTimes(1);
    expect(getWinner().refetch).not.toHaveBeenCalled();
    expect(getSettings().loadSeizeSettings).not.toHaveBeenCalled();
  }
);

it("recovers failed initial settings without needing a wave ID", () => {
  const settings = {
    ...getSettings(),
    isLoaded: false,
    loadError: new Error("offline"),
  };
  settingsMock.mockReturnValue(settings);
  winnerMock.mockReturnValue({ ...getWinner(), waveId: null, isReady: false });
  leaderboardMock.mockReturnValue({ ...getLeaderboard(), drops: [] });
  render(<NextMintLeadingSection />);
  expect(screen.getByRole("region", { name: "Coming up" })).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "View all" })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(settings.loadSeizeSettings).toHaveBeenCalledTimes(1);
});

it("offers recovery for a paused offline query", () => {
  leaderboardMock.mockReturnValue({
    ...getLeaderboard(),
    drops: [],
    isPaused: true,
    isFetching: true,
  });
  render(<NextMintLeadingSection />);
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
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
