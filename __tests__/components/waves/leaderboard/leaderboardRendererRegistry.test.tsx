import { render, renderHook } from "@testing-library/react";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { DefaultWaveLeaderboardDrop } from "@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop";
import { DefaultWaveSmallLeaderboardDrop } from "@/components/waves/small-leaderboard/DefaultWaveSmallLeaderboardDrop";
import { useWaveLeaderboardRendererSet } from "@/components/waves/leaderboard/leaderboardRendererRegistry";
import { useWaveProposalCardPresentation } from "@/hooks/waves/useWaveProposalCardPresentation";

jest.mock("@/components/content-moderation/ContentModerationDropGate", () => ({
  __esModule: true,
  default: ({
    children,
    compact,
  }: {
    readonly children: React.ReactNode;
    readonly compact?: boolean;
  }) => (
    <div data-testid={compact ? "moderation-gate-compact" : "moderation-gate"}>
      {children}
    </div>
  ),
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));

jest.mock("@/hooks/waves/useWaveProposalCardPresentation", () => ({
  useWaveProposalCardPresentation: jest.fn(),
}));

jest.mock(
  "@/components/waves/leaderboard/drops/DefaultWaveLeaderboardDrop",
  () => ({
    DefaultWaveLeaderboardDrop: jest.fn(() => (
      <div data-testid="default-leaderboard" />
    )),
  })
);

jest.mock(
  "@/components/waves/small-leaderboard/DefaultWaveSmallLeaderboardDrop",
  () => ({
    DefaultWaveSmallLeaderboardDrop: jest.fn(() => (
      <div data-testid="default-small-leaderboard" />
    )),
  })
);

jest.mock("@/components/memes/drops/MemesLeaderboardDrop", () => ({
  MemesLeaderboardDrop: jest.fn(),
}));

jest.mock(
  "@/components/waves/small-leaderboard/MemesWaveSmallLeaderboardDrop",
  () => ({ MemesWaveSmallLeaderboardDrop: jest.fn() })
);

jest.mock(
  "@/components/waves/small-leaderboard/QuorumWaveSmallLeaderboardDrop",
  () => ({ QuorumWaveSmallLeaderboardDrop: jest.fn() })
);

jest.mock(
  "@/components/waves/leaderboard/drops/QuorumWaveLeaderboardDrop",
  () => ({ QuorumWaveLeaderboardDrop: jest.fn() })
);

const mockUseSeizeSettings = useSeizeSettings as jest.Mock;
const mockUseWaveProposalCardPresentation =
  useWaveProposalCardPresentation as jest.Mock;

describe("useWaveLeaderboardRendererSet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSeizeSettings.mockReturnValue({
      isMemesWave: () => false,
      isCurationWave: () => false,
      isQuorumWave: () => false,
    });
    mockUseWaveProposalCardPresentation.mockReturnValue("default");
  });

  it("keeps standard waves on their existing renderers by default", () => {
    const { result } = renderHook(() =>
      useWaveLeaderboardRendererSet("another-wave")
    );
    const SmallLeaderboardDrop = result.current.SmallLeaderboardDrop;

    expect(result.current.variant).toBe("default");
    const { getByTestId } = render(
      <SmallLeaderboardDrop
        {...({
          drop: { id: "drop-1" },
          onDropClick: jest.fn(),
        } as any)}
      />
    );
    expect(getByTestId("moderation-gate-compact")).toBeInTheDocument();
    expect(DefaultWaveSmallLeaderboardDrop).toHaveBeenCalled();
  });

  it("uses the same proposal-card presentation in full and small lists", () => {
    mockUseWaveProposalCardPresentation.mockReturnValue("proposalCard");
    const { result } = renderHook(() =>
      useWaveLeaderboardRendererSet("network-museum")
    );
    const LeaderboardDrop = result.current.LeaderboardDrop;
    const SmallLeaderboardDrop = result.current.SmallLeaderboardDrop;

    const { getByTestId, getAllByTestId } = render(
      <>
        <LeaderboardDrop
          {...({
            drop: { id: "drop-1" },
            wave: { id: "network-museum" },
            onDropClick: jest.fn(),
          } as any)}
        />
        <SmallLeaderboardDrop
          {...({
            drop: { id: "drop-1" },
            onDropClick: jest.fn(),
          } as any)}
        />
      </>
    );

    expect(getByTestId("moderation-gate")).toBeInTheDocument();
    expect(getAllByTestId("moderation-gate-compact")).toHaveLength(1);

    expect(DefaultWaveLeaderboardDrop).toHaveBeenCalledWith(
      expect.objectContaining({ contentPresentation: "proposalCard" }),
      undefined
    );
    expect(DefaultWaveSmallLeaderboardDrop).toHaveBeenCalledWith(
      expect.objectContaining({ contentPresentation: "proposalCard" }),
      undefined
    );
  });
});
