import { fireEvent, render, screen } from "@testing-library/react";
import BrainMobileViewContent from "@/components/brain/mobile/BrainMobileViewContent";
import { BrainView } from "@/components/brain/mobile/brainMobileViews";

const mockBrainMobileAbout = jest.fn(() => <div data-testid="about" />);
jest.mock("@/components/brain/mobile/BrainMobileAbout", () => ({
  __esModule: true,
  default: (props: any) => mockBrainMobileAbout(props),
}));

const mockBrainMobileWaves = jest.fn(
  ({ onOpenQuickVote }: { readonly onOpenQuickVote: () => void }) => (
    <button type="button" data-testid="waves" onClick={onOpenQuickVote}>
      waves
    </button>
  )
);
jest.mock("@/components/brain/mobile/BrainMobileWaves", () => ({
  __esModule: true,
  default: (props: any) => mockBrainMobileWaves(props),
}));

const mockBrainMobileMessages = jest.fn(() => <div data-testid="messages" />);
jest.mock("@/components/brain/mobile/BrainMobileMessages", () => ({
  __esModule: true,
  default: () => mockBrainMobileMessages(),
}));

const mockBrainNotifications = jest.fn(() => (
  <div data-testid="notifications" />
));
jest.mock("@/components/brain/notifications/NotificationsContainer", () => ({
  __esModule: true,
  default: () => mockBrainNotifications(),
}));

const mockMyStreamWaveLeaderboard = jest.fn(() => (
  <div data-testid="leaderboard" />
));
jest.mock("@/components/brain/my-stream/MyStreamWaveLeaderboard", () => ({
  __esModule: true,
  default: (props: any) => mockMyStreamWaveLeaderboard(props),
}));

const mockMyStreamWaveOutcome = jest.fn(() => <div data-testid="outcome" />);
jest.mock("@/components/brain/my-stream/MyStreamWaveOutcome", () => ({
  __esModule: true,
  default: (props: any) => mockMyStreamWaveOutcome(props),
}));

const mockMyStreamWaveSales = jest.fn(() => <div data-testid="sales" />);
jest.mock("@/components/brain/my-stream/MyStreamWaveSales", () => ({
  __esModule: true,
  default: (props: any) => mockMyStreamWaveSales(props),
}));

const mockMyStreamWaveMyVotes = jest.fn(() => <div data-testid="my-votes" />);
jest.mock("@/components/brain/my-stream/votes/MyStreamWaveMyVotes", () => ({
  __esModule: true,
  default: (props: any) => mockMyStreamWaveMyVotes(props),
}));

const mockMyStreamWaveFAQ = jest.fn(() => <div data-testid="faq" />);
jest.mock("@/components/brain/my-stream/MyStreamWaveFAQ", () => ({
  __esModule: true,
  default: (props: any) => mockMyStreamWaveFAQ(props),
}));

const mockWaveWinners = jest.fn(() => <div data-testid="winners" />);
jest.mock("@/components/waves/winners/WaveWinners", () => ({
  __esModule: true,
  WaveWinners: (props: any) => mockWaveWinners(props),
}));

describe("BrainMobileViewContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children for the default view", () => {
    render(
      <BrainMobileViewContent
        activeView={BrainView.DEFAULT}
        activeWaveId="1"
        isCurationWave={false}
        isMemesWave={false}
        isRankWave={false}
        onDropClick={jest.fn()}
        onOpenQuickVote={jest.fn()}
        wave={null}
      >
        <div data-testid="children">child</div>
      </BrainMobileViewContent>
    );

    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  it("renders the about view with the active wave id", () => {
    render(
      <BrainMobileViewContent
        activeView={BrainView.ABOUT}
        activeWaveId="wave-123"
        isCurationWave={false}
        isMemesWave={false}
        isRankWave={false}
        onDropClick={jest.fn()}
        onOpenQuickVote={jest.fn()}
        wave={null}
      >
        <div>child</div>
      </BrainMobileViewContent>
    );

    expect(screen.getByTestId("about")).toBeInTheDocument();
    expect(mockBrainMobileAbout).toHaveBeenCalledWith(
      expect.objectContaining({
        activeWaveId: "wave-123",
      })
    );
  });

  it("renders shell views and forwards the quick-vote opener", () => {
    const onOpenQuickVote = jest.fn();
    const { rerender } = render(
      <BrainMobileViewContent
        activeView={BrainView.WAVES}
        activeWaveId="1"
        isCurationWave={false}
        isMemesWave={false}
        isRankWave={false}
        onDropClick={jest.fn()}
        onOpenQuickVote={onOpenQuickVote}
        wave={null}
      >
        <div>child</div>
      </BrainMobileViewContent>
    );

    fireEvent.click(screen.getByTestId("waves"));
    expect(onOpenQuickVote).toHaveBeenCalledTimes(1);

    rerender(
      <BrainMobileViewContent
        activeView={BrainView.MESSAGES}
        activeWaveId="1"
        isCurationWave={false}
        isMemesWave={false}
        isRankWave={false}
        onDropClick={jest.fn()}
        onOpenQuickVote={onOpenQuickVote}
        wave={null}
      >
        <div>child</div>
      </BrainMobileViewContent>
    );
    expect(screen.getByTestId("messages")).toBeInTheDocument();

    rerender(
      <BrainMobileViewContent
        activeView={BrainView.NOTIFICATIONS}
        activeWaveId="1"
        isCurationWave={false}
        isMemesWave={false}
        isRankWave={false}
        onDropClick={jest.fn()}
        onOpenQuickVote={onOpenQuickVote}
        wave={null}
      >
        <div>child</div>
      </BrainMobileViewContent>
    );
    expect(screen.getByTestId("notifications")).toBeInTheDocument();
  });

  it("renders leaderboard and forwards wave props when available", () => {
    const onDropClick = jest.fn();
    const wave = { id: "wave-1" } as any;

    render(
      <BrainMobileViewContent
        activeView={BrainView.LEADERBOARD}
        activeWaveId="1"
        isCurationWave={false}
        isMemesWave={false}
        isRankWave={true}
        onDropClick={onDropClick}
        onOpenQuickVote={jest.fn()}
        wave={wave}
      >
        <div>child</div>
      </BrainMobileViewContent>
    );

    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(mockMyStreamWaveLeaderboard).toHaveBeenCalledWith(
      expect.objectContaining({
        onDropClick,
        wave,
      })
    );
  });

  it("renders sales when the wave is curation-enabled", () => {
    render(
      <BrainMobileViewContent
        activeView={BrainView.SALES}
        activeWaveId="1"
        isCurationWave={true}
        isMemesWave={false}
        isRankWave={false}
        onDropClick={jest.fn()}
        onOpenQuickVote={jest.fn()}
        wave={{ id: "wave-1" } as any}
      >
        <div>child</div>
      </BrainMobileViewContent>
    );

    expect(screen.getByTestId("sales")).toBeInTheDocument();
    expect(mockMyStreamWaveSales).toHaveBeenCalledWith(
      expect.objectContaining({ waveId: "wave-1" })
    );
  });

  it("renders winners with the padded wrapper", () => {
    const onDropClick = jest.fn();
    const wave = { id: "wave-1" } as any;
    const { container } = render(
      <BrainMobileViewContent
        activeView={BrainView.WINNERS}
        activeWaveId="1"
        isCurationWave={false}
        isMemesWave={false}
        isRankWave={true}
        onDropClick={onDropClick}
        onOpenQuickVote={jest.fn()}
        wave={wave}
      >
        <div>child</div>
      </BrainMobileViewContent>
    );

    expect(screen.getByTestId("winners")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("tw-px-2", "sm:tw-px-4");
    expect(mockWaveWinners).toHaveBeenCalledWith(
      expect.objectContaining({ onDropClick, wave })
    );
  });

  it("renders outcome, my votes, and faq when their prerequisites are met", () => {
    const onDropClick = jest.fn();
    const wave = { id: "wave-1" } as any;
    const { rerender } = render(
      <BrainMobileViewContent
        activeView={BrainView.OUTCOME}
        activeWaveId="1"
        isCurationWave={false}
        isMemesWave={true}
        isRankWave={true}
        onDropClick={onDropClick}
        onOpenQuickVote={jest.fn()}
        wave={wave}
      >
        <div>child</div>
      </BrainMobileViewContent>
    );

    expect(screen.getByTestId("outcome")).toBeInTheDocument();
    expect(mockMyStreamWaveOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ wave })
    );

    rerender(
      <BrainMobileViewContent
        activeView={BrainView.MY_VOTES}
        activeWaveId="1"
        isCurationWave={false}
        isMemesWave={true}
        isRankWave={true}
        onDropClick={onDropClick}
        onOpenQuickVote={jest.fn()}
        wave={wave}
      >
        <div>child</div>
      </BrainMobileViewContent>
    );
    expect(screen.getByTestId("my-votes")).toBeInTheDocument();
    expect(mockMyStreamWaveMyVotes).toHaveBeenCalledWith(
      expect.objectContaining({ onDropClick, wave })
    );

    rerender(
      <BrainMobileViewContent
        activeView={BrainView.FAQ}
        activeWaveId="1"
        isCurationWave={false}
        isMemesWave={true}
        isRankWave={true}
        onDropClick={onDropClick}
        onOpenQuickVote={jest.fn()}
        wave={wave}
      >
        <div>child</div>
      </BrainMobileViewContent>
    );
    expect(screen.getByTestId("faq")).toBeInTheDocument();
    expect(mockMyStreamWaveFAQ).toHaveBeenCalledWith(
      expect.objectContaining({ wave })
    );
  });

  it.each([
    {
      activeView: BrainView.LEADERBOARD,
      isCurationWave: false,
      isMemesWave: false,
      isRankWave: false,
      wave: { id: "wave-1" } as any,
    },
    {
      activeView: BrainView.SALES,
      isCurationWave: false,
      isMemesWave: false,
      isRankWave: false,
      wave: { id: "wave-1" } as any,
    },
    {
      activeView: BrainView.WINNERS,
      isCurationWave: false,
      isMemesWave: false,
      isRankWave: true,
      wave: null,
    },
    {
      activeView: BrainView.FAQ,
      isCurationWave: false,
      isMemesWave: false,
      isRankWave: true,
      wave: { id: "wave-1" } as any,
    },
  ])(
    "returns null when $activeView is unavailable",
    ({ activeView, isCurationWave, isMemesWave, isRankWave, wave }) => {
      const { container } = render(
        <BrainMobileViewContent
          activeView={activeView}
          activeWaveId="1"
          isCurationWave={isCurationWave}
          isMemesWave={isMemesWave}
          isRankWave={isRankWave}
          onDropClick={jest.fn()}
          onOpenQuickVote={jest.fn()}
          wave={wave}
        >
          <div>child</div>
        </BrainMobileViewContent>
      );

      expect(container.firstChild).toBeNull();
    }
  );
});
