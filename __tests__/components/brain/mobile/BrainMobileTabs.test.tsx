import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import BrainMobileTabs from "@/components/brain/mobile/BrainMobileTabs";

enum BrainView {
  DEFAULT = "DEFAULT",
  ABOUT = "ABOUT",
  LEADERBOARD = "LEADERBOARD",
  WINNERS = "WINNERS",
  OUTCOME = "OUTCOME",
  MY_VOTES = "MY_VOTES",
  FAQ = "FAQ",
  WAVES = "WAVES",
  MESSAGES = "MESSAGES",
  NOTIFICATIONS = "NOTIFICATIONS",
}

const push = jest.fn();

jest.mock("next/navigation", () => ({ 
  useRouter: () => ({ push }), 
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null)
  }),
  usePathname: () => "/brain"
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
  useAuth: () => ({ connectedProfile: { handle: "alice" } }),
}));

const leaderboardMock = jest.fn();
jest.mock("@/components/brain/my-stream/MyStreamWaveTabsLeaderboard", () => ({
  __esModule: true,
  default: (props: any) => {
    leaderboardMock(props);
    return <div data-testid="leaderboard" />;
  },
}));

(HTMLElement.prototype as any).scrollIntoView = jest.fn();

const { useWave } = require("@/hooks/useWave");
const { useUnreadIndicator } = require("@/hooks/useUnreadIndicator");
const { useUnreadNotifications } = require("@/hooks/useUnreadNotifications");

describe("BrainMobileTabs", () => {
  const onViewChange = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isRankWave: false,
    });
    (useUnreadIndicator as jest.Mock).mockReturnValue({ hasUnread: false });
    (useUnreadNotifications as jest.Mock).mockReturnValue({
      haveUnreadNotifications: false,
    });
  });

  it("renders back button and navigates to My Stream", async () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isRankWave: false,
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
    expect(push).toHaveBeenCalledWith("/my-stream");
    expect(onViewChange).toHaveBeenCalledWith(BrainView.DEFAULT);
  });

  it("shows unread indicators and handles message/notification clicks", async () => {
    (useWave as jest.Mock).mockReturnValue({
      isMemesWave: false,
      isRankWave: false,
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
        wave={{ id: "1" } as any}
      />
    );

    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    expect(leaderboardMock).toHaveBeenCalledWith(
      expect.objectContaining({
        wave: { id: "1" },
        activeView: BrainView.ABOUT,
        onViewChange,
      })
    );
    expect(screen.getByText("My Votes")).toBeInTheDocument();
    expect(screen.getByText("Outcome")).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
  });
});
