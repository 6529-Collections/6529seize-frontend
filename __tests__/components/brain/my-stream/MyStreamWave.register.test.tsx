import { render, waitFor } from "@testing-library/react";
import MyStreamWave from "@/components/brain/my-stream/MyStreamWave";

const mockRegisterWave = jest.fn();
const mockSetQueryData = jest.fn();
const mockSetWaveData = jest.fn();
const mockSetViewMode = jest.fn();
const mockToggleViewMode = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSearchParams = {
  get: jest.fn(),
  toString: jest.fn(),
};
const mockWave = {
  id: "wave-1",
  name: "Wave 1",
  participation: {},
  metrics: {},
} as any;

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    setQueryData: mockSetQueryData,
  }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/waves/wave-1",
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock("react-use", () => ({
  createBreakpoint: () => () => "LG",
}));

jest.mock("@/contexts/TitleContext", () => ({
  useSetWaveData: (waveData: unknown) => mockSetWaveData(waveData),
}));

jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: {
    DROP: "DROP",
  },
}));

jest.mock("@/components/brain/ContentTabContext", () => ({
  useContentTab: () => ({
    activeContentTab: "CHAT",
  }),
}));

jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: () => ({
    data: mockWave,
  }),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    waves: { list: [] },
    directMessages: { list: [] },
    registerWave: mockRegisterWave,
  }),
}));

jest.mock("@/hooks/useWaveViewMode", () => ({
  useWaveViewMode: () => ({
    viewMode: "chat",
    setViewMode: mockSetViewMode,
    toggleViewMode: mockToggleViewMode,
  }),
}));

jest.mock("@/hooks/useWave", () => ({
  useWave: () => ({
    isRankWave: false,
    isMemesWave: false,
    isDm: false,
  }),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveChat", () => ({
  __esModule: true,
  default: () => <div data-testid="chat" />,
}));

jest.mock(
  "@/components/brain/my-stream/curations/MyStreamWaveCurationContent",
  () => ({
    __esModule: true,
    default: () => <div data-testid="curation" />,
  })
);

jest.mock("@/components/brain/my-stream/MyStreamWaveLeaderboard", () => ({
  __esModule: true,
  default: () => <div data-testid="leaderboard" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveSubmissions", () => ({
  __esModule: true,
  default: () => <div data-testid="submissions" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveOutcome", () => ({
  __esModule: true,
  default: () => <div data-testid="outcome" />,
}));

jest.mock("@/components/waves/winners/WaveWinners", () => ({
  WaveWinners: () => <div data-testid="winners" />,
}));

jest.mock("@/components/brain/my-stream/tabs/MyStreamWaveTabs", () => ({
  MyStreamWaveTabs: () => <div data-testid="tabs" />,
}));

jest.mock("@/components/brain/my-stream/votes/MyStreamWaveMyVotes", () => ({
  __esModule: true,
  default: () => <div data-testid="my-votes" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveFAQ", () => ({
  __esModule: true,
  default: () => <div data-testid="faq" />,
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveSales", () => ({
  __esModule: true,
  default: () => <div data-testid="sales" />,
}));

describe("MyStreamWave registration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.get.mockReturnValue(null);
    mockSearchParams.toString.mockReturnValue("");
  });

  it("registers the mounted wave for direct URL loads", async () => {
    render(<MyStreamWave waveId="wave-1" />);

    await waitFor(() => {
      expect(mockRegisterWave).toHaveBeenCalledWith("wave-1", true);
    });
  });
});
