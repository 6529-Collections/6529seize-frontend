import { render, screen } from "@testing-library/react";
import MyStreamWavePolls from "@/components/brain/my-stream/MyStreamWavePolls";
import type { ApiWave } from "@/generated/models/ApiWave";

let mockMovedToChain = false;
const mockMovedFor = jest.fn((_wave?: unknown) => mockMovedToChain);
jest.mock("@/hooks/useWavesMovePhase", () => ({
  useWaveMovedToChain: (wave?: unknown) => mockMovedFor(wave),
}));
jest.mock("@/hooks/useWavePollDrops", () => ({
  useWavePollDrops: () => ({
    drops: [],
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isError: false,
    isFetching: false,
    isFetchingNextPage: false,
    refetch: jest.fn(),
  }),
}));
jest.mock("@/hooks/waves/useApprovalWaveStatus", () => ({
  useApprovalWaveStatus: () => ({
    winningThreshold: null,
    winningThresholdMinDurationMs: null,
  }),
}));
jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: () => ({ current: null }),
}));
jest.mock("@/components/waves/drops/Drop", () => ({
  __esModule: true,
  default: () => null,
  DropLocation: { WAVE: "WAVE" },
}));
jest.mock("@/components/utils/select/dropdown/CommonDropdown", () => ({
  __esModule: true,
  default: () => null,
}));

const wave = { id: "wave-1", stays_on_site: false } as unknown as ApiWave;
const LINE = "Polls made on the 6529 Network don't show on 6529.io yet.";

describe("MyStreamWavePolls after the switch-on", () => {
  afterEach(() => {
    mockMovedToChain = false;
  });

  it("says polls made on the 6529 Network don't show here yet, in a wave that moved", () => {
    mockMovedToChain = true;
    render(<MyStreamWavePolls wave={wave} onDropClick={jest.fn()} />);
    expect(screen.getByText(LINE)).toBeInTheDocument();
    expect(mockMovedFor).toHaveBeenCalledWith(wave);
  });

  it("says nothing of the kind anywhere else", () => {
    render(<MyStreamWavePolls wave={wave} onDropClick={jest.fn()} />);
    expect(screen.queryByText(LINE)).toBeNull();
  });
});
