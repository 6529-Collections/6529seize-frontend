import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import BrainMobileTabs from "@/components/brain/mobile/BrainMobileTabs";

enum BrainView {
  DEFAULT = "DEFAULT",
  ABOUT = "ABOUT",
  LEADERBOARD = "LEADERBOARD",
  SUBMISSIONS = "SUBMISSIONS",
  SALES = "SALES",
  WINNERS = "WINNERS",
  OUTCOME = "OUTCOME",
  MY_VOTES = "MY_VOTES",
  POLLS = "POLLS",
  FAQ = "FAQ",
  WAVES = "WAVES",
  MESSAGES = "MESSAGES",
  NOTIFICATIONS = "NOTIFICATIONS",
}

const push = jest.fn();
const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
  usePathname: () => "/brain",
}));

jest.mock("react-use", () => ({
  createBreakpoint: () => () => "S",
}));

const registerRef = jest.fn();
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ registerRef }),
}));

jest.mock("@/hooks/useWave", () => ({
  useWave: jest.fn(),
}));

jest.mock("@/hooks/useUnreadIndicator", () => ({
  useUnreadIndicator: jest.fn(),
}));

jest.mock("@/hooks/useUnreadNotifications", () => ({
  useUnreadNotifications: jest.fn(),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/hooks/waves/useWaveCurations", () => ({
  useWaveCurations: () => ({ data: [] }),
}));

const leaderboardMock = jest.fn();
jest.mock("@/components/brain/my-stream/MyStreamWaveTabsLeaderboard", () => ({
  __esModule: true,
  default: (props: any) => {
    leaderboardMock(props);
    return (
      <>
        <div data-testid="leaderboard" />
        {props.renderAfterLeaderboard}
      </>
    );
  },
}));

(HTMLElement.prototype as any).scrollIntoView = jest.fn();

const { useWave } = require("@/hooks/useWave");
const { useUnreadIndicator } = require("@/hooks/useUnreadIndicator");
const { useUnreadNotifications } = require("@/hooks/useUnreadNotifications");
const { useAuth } = require("@/components/auth/Auth");

const createWave = () =>
  ({
    id: "1",
    wave: { authenticated_user_eligible_for_admin: false },
  }) as any;

describe("BrainMobileTabs", () => {
  const onViewChange = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: false,
      isApproveWave: false,
    });
    (useUnreadIndicator as jest.Mock).mockReturnValue({ hasUnread: false });
    (useUnreadNotifications as jest.Mock).mockReturnValue({
      haveUnreadNotifications: false,
    });
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { handle: "alice" },
    });
  });

  it("renders back button and navigates to My Stream", async () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: false,
      isApproveWave: false,
    });
    render(
      <BrainMobileTabs
        activeView={BrainView.DEFAULT}
        onViewChange={onViewChange}
        waveActive={true}
        showWavesTab={false}
        showStreamBack={true}
        isApp={false}
      />
    );

    const button = screen.getByRole("button", { name: /my stream/i });
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(push).toHaveBeenCalledWith("/waves");
    expect(onViewChange).toHaveBeenCalledWith(BrainView.DEFAULT);
  });

  it("shows unread indicators and handles message/notification clicks", async () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: false,
      isApproveWave: false,
    });
    (useUnreadIndicator as jest.Mock).mockReturnValue({ hasUnread: true });
    (useUnreadNotifications as jest.Mock).mockReturnValue({
      haveUnreadNotifications: true,
    });

    render(
      <BrainMobileTabs
        activeView={BrainView.DEFAULT}
        onViewChange={onViewChange}
        waveActive={false}
        showWavesTab={true}
        showStreamBack={false}
        isApp={false}
      />
    );

    expect(screen.getByText("Waves")).toBeInTheDocument();
    const messages = screen.getByRole("button", { name: /messages/i });
    const notifications = screen.getByRole("button", {
      name: /notifications/i,
    });
    expect(messages.querySelector(".tw-bg-red")).toBeInTheDocument();
    expect(notifications.querySelector(".tw-bg-red")).toBeInTheDocument();

    await userEvent.click(messages);
    expect(onViewChange).toHaveBeenCalledWith(BrainView.MESSAGES);
    await userEvent.click(notifications);
    expect(onViewChange).toHaveBeenCalledWith(BrainView.NOTIFICATIONS);
  });

  it("renders leaderboard and extra tabs for memes rank wave", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: true,
      isCurationWave: false,
      isRankWave: true,
    });

    render(
      <BrainMobileTabs
        activeView={BrainView.ABOUT}
        onViewChange={onViewChange}
        waveActive={true}
        showWavesTab={false}
        showStreamBack={false}
        isApp={false}
        wave={createWave()}
      />
    );

    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(leaderboardMock).toHaveBeenCalledWith(
      expect.objectContaining({
        wave: expect.objectContaining({ id: "1" }),
        activeView: BrainView.ABOUT,
        onViewChange: expect.any(Function),
      })
    );
    expect(screen.getByText("My Votes")).toBeInTheDocument();
    expect(screen.getByText("Outcome")).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
  });

  it("renders Polls for active waves and switches to it", async () => {
    render(
      <BrainMobileTabs
        activeView={BrainView.ABOUT}
        onViewChange={onViewChange}
        waveActive={true}
        showWavesTab={false}
        showStreamBack={false}
        isApp={false}
        wave={createWave()}
      />
    );

    const polls = screen.getByRole("button", { name: /polls/i });
    expect(polls).toBeInTheDocument();

    await userEvent.click(polls);

    expect(onViewChange).toHaveBeenCalledWith(BrainView.POLLS);
  });

  it("renders My Votes for curation rank wave", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      isRankWave: true,
    });

    render(
      <BrainMobileTabs
        activeView={BrainView.ABOUT}
        onViewChange={onViewChange}
        waveActive={true}
        showWavesTab={false}
        showStreamBack={false}
        isApp={false}
        wave={createWave()}
      />
    );

    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("My Votes")).toBeInTheDocument();
    expect(screen.queryByText("Outcome")).toBeNull();
    expect(screen.queryByText("FAQ")).toBeNull();
  });

  it("renders My Votes for authenticated normal rank wave", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: true,
      isApproveWave: false,
    });

    render(
      <BrainMobileTabs
        activeView={BrainView.ABOUT}
        onViewChange={onViewChange}
        waveActive={true}
        showWavesTab={false}
        showStreamBack={false}
        isApp={false}
        wave={createWave()}
      />
    );

    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(screen.getByText("My Votes")).toBeInTheDocument();
    expect(screen.getByText("Outcome")).toBeInTheDocument();
  });

  it("hides Outcome when outcomes are hidden for rank waves", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: true,
      isApproveWave: false,
    });

    render(
      <BrainMobileTabs
        activeView={BrainView.ABOUT}
        onViewChange={onViewChange}
        waveActive={true}
        showWavesTab={false}
        showStreamBack={false}
        isApp={false}
        wave={createWave()}
        outcomesVisible={false}
      />
    );

    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(screen.queryByText("Outcome")).toBeNull();
    expect(screen.getByText("My Votes")).toBeInTheDocument();
  });

  it("hides My Votes for guests on normal rank waves", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: true,
      isApproveWave: false,
    });
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: null,
    });

    render(
      <BrainMobileTabs
        activeView={BrainView.ABOUT}
        onViewChange={onViewChange}
        waveActive={true}
        showWavesTab={false}
        showStreamBack={false}
        isApp={false}
        wave={createWave()}
      />
    );

    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(screen.queryByText("My Votes")).toBeNull();
    expect(screen.getByText("Outcome")).toBeInTheDocument();
  });

  it("hides My Votes for guests on memes rank wave", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: true,
      isCurationWave: false,
      isRankWave: true,
    });
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: null,
    });

    render(
      <BrainMobileTabs
        activeView={BrainView.ABOUT}
        onViewChange={onViewChange}
        waveActive={true}
        showWavesTab={false}
        showStreamBack={false}
        isApp={false}
        wave={createWave()}
      />
    );

    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(screen.queryByText("My Votes")).toBeNull();
    expect(screen.getByText("Outcome")).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
  });

  it("renders Sales for non-rank curation waves", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      isRankWave: false,
    });

    render(
      <BrainMobileTabs
        activeView={BrainView.ABOUT}
        onViewChange={onViewChange}
        waveActive={true}
        showWavesTab={false}
        showStreamBack={false}
        isApp={false}
        wave={createWave()}
      />
    );

    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.queryByTestId("leaderboard")).toBeNull();
  });

  it("renders leaderboard tabs for approve waves", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: false,
      isApproveWave: true,
    });

    render(
      <BrainMobileTabs
        activeView={BrainView.ABOUT}
        onViewChange={onViewChange}
        waveActive={true}
        showWavesTab={false}
        showStreamBack={false}
        isApp={false}
        wave={createWave()}
      />
    );

    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(screen.getByText("Outcome")).toBeInTheDocument();
    expect(screen.getByText("My Votes")).toBeInTheDocument();
    expect(leaderboardMock).toHaveBeenCalledWith(
      expect.objectContaining({
        wave: expect.objectContaining({ id: "1" }),
        activeView: BrainView.ABOUT,
      })
    );
  });

  it("hides My Votes for guests on normal approve waves", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: false,
      isApproveWave: true,
    });
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: null,
    });

    render(
      <BrainMobileTabs
        activeView={BrainView.ABOUT}
        onViewChange={onViewChange}
        waveActive={true}
        showWavesTab={false}
        showStreamBack={false}
        isApp={false}
        wave={createWave()}
      />
    );

    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(screen.queryByText("My Votes")).toBeNull();
    expect(screen.getByText("Outcome")).toBeInTheDocument();
  });

  it("renders curation tabs without Outcome for approve curation waves", () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      isRankWave: false,
      isApproveWave: true,
    });

    render(
      <BrainMobileTabs
        activeView={BrainView.ABOUT}
        onViewChange={onViewChange}
        waveActive={true}
        showWavesTab={false}
        showStreamBack={false}
        isApp={false}
        wave={createWave()}
      />
    );

    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(screen.getByText("Sales")).toBeInTheDocument();
    expect(screen.getByText("My Votes")).toBeInTheDocument();
    expect(screen.queryByText("Outcome")).toBeNull();
  });
});
