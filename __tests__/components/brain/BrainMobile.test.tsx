import { act, render, screen, waitFor } from "@testing-library/react";
import BrainMobile, { BrainView } from "@/components/brain/BrainMobile";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

let mockSearchParams = new URLSearchParams();
let mockPathname = "/";
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}));

let isApp = true;
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp }),
}));

let dropData: any = null;
let waveData: any = null;

jest.mock("@tanstack/react-query", () => ({
  keepPreviousData: {},
  useQuery: jest.fn(() => ({ data: dropData })),
}));

jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: () => ({ data: waveData }),
}));

const mockUseWave = jest.fn();
jest.mock("@/hooks/useWave", () => ({
  useWave: (...args: any[]) => mockUseWave(...args),
}));

jest.mock("@/hooks/useWaveTimers", () => ({
  useWaveTimers: () => ({
    voting: { isCompleted: false },
    decisions: { firstDecisionDone: true },
  }),
}));

jest.mock("@/components/brain/BrainDesktopDrop", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="drop" onClick={props.onClose}>
      drop
    </div>
  ),
}));

let latestTabsProps: any = null;
jest.mock("@/components/brain/mobile/BrainMobileTabs", () => ({
  __esModule: true,
  default: (props: any) => {
    latestTabsProps = props;
    return <div data-testid="tabs" />;
  },
}));

jest.mock("@/components/brain/mobile/BrainMobileAbout", () => ({
  __esModule: true,
  default: () => <div data-testid="about" />,
}));

jest.mock("@/components/brain/mobile/BrainMobileWaves", () => ({
  __esModule: true,
  default: () => <div data-testid="waves" />,
}));

jest.mock("@/components/brain/mobile/BrainMobileMessages", () => ({
  __esModule: true,
  default: () => <div data-testid="messages" />,
}));

jest.mock("@/components/brain/notifications", () => ({
  __esModule: true,
  default: () => <div data-testid="notifications" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveLeaderboard", () => ({
  __esModule: true,
  default: () => <div data-testid="leaderboard" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveOutcome", () => ({
  __esModule: true,
  default: () => <div data-testid="outcome" />,
}));

const mockMyStreamWaveSales = jest.fn(() => <div data-testid="sales" />);
jest.mock("@/components/brain/my-stream/MyStreamWaveSales", () => ({
  __esModule: true,
  default: (props: any) => mockMyStreamWaveSales(props),
}));

jest.mock("@/components/waves/winners/WaveWinners", () => ({
  __esModule: true,
  WaveWinners: () => <div data-testid="winners" />,
}));

jest.mock("@/components/brain/my-stream/votes/MyStreamWaveMyVotes", () => ({
  __esModule: true,
  default: () => <div data-testid="myvotes" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveFAQ", () => ({
  __esModule: true,
  default: () => <div data-testid="faq" />,
}));

// Tests

describe("BrainMobile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockPathname = "/";
    mockPush.mockClear();
    dropData = null;
    waveData = null;
    isApp = true;
    latestTabsProps = null;
    mockUseWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: true,
    });
  });

  it("renders BrainDesktopDrop when drop is open", () => {
    mockSearchParams.set("drop", "d1");
    dropData = { id: "d1" };
    render(<BrainMobile>child</BrainMobile>);
    expect(screen.getByTestId("drop")).toBeInTheDocument();
  });

  it("shows notifications view when path matches", async () => {
    mockPathname = "/notifications";
    render(<BrainMobile>child</BrainMobile>);
    await waitFor(() => {
      expect(screen.getByTestId("notifications")).toBeInTheDocument();
    });
  });

  it("shows tabs only when wave active or not in app", async () => {
    isApp = true;
    render(<BrainMobile>child</BrainMobile>);
    expect(screen.queryByTestId("tabs")).toBeNull();

    mockSearchParams.set("wave", "1");
    const { rerender } = render(<BrainMobile>child</BrainMobile>);
    await waitFor(() => expect(screen.getByTestId("tabs")).toBeInTheDocument());
    rerender(<div />);
  });

  it("renders the Sales view for curation waves and falls back when unavailable", async () => {
    mockSearchParams.set("wave", "1");
    waveData = { id: "1", wave: { type: "RANK" } };
    mockUseWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: true,
      isRankWave: true,
    });

    const { rerender } = render(<BrainMobile>child</BrainMobile>);

    await waitFor(() => expect(screen.getByTestId("tabs")).toBeInTheDocument());

    act(() => {
      latestTabsProps.onViewChange(BrainView.SALES);
    });

    expect(screen.getByTestId("sales")).toBeInTheDocument();
    expect(mockMyStreamWaveSales).toHaveBeenCalledWith({ waveId: "1" });

    mockUseWave.mockReturnValue({
      isMemesWave: false,
      isCurationWave: false,
      isRankWave: true,
    });
    rerender(<BrainMobile>child</BrainMobile>);

    await waitFor(() => {
      expect(screen.queryByTestId("sales")).toBeNull();
      expect(screen.getByText("child")).toBeInTheDocument();
    });
  });
});
