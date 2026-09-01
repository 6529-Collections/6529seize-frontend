import WavesView from "@/components/waves/WavesView";
import { render, screen } from "@testing-library/react";

const mockUseMyStreamOptional = jest.fn();
const mockUsePathname = jest.fn();
const mockUseDeviceInfo = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => mockUseMyStreamOptional(),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => mockUseDeviceInfo(),
}));

jest.mock("@/components/brain/content/BrainContent", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => (
    <div data-testid="brain-content">{children}</div>
  ),
}));

jest.mock("@/components/brain/my-stream/MyStreamWave", () => ({
  __esModule: true,
  default: ({ waveId }: { readonly waveId: string }) => (
    <div data-testid="active-wave">{waveId}</div>
  ),
}));

jest.mock("@/components/community-curations/CommunityCurations", () => ({
  __esModule: true,
  default: () => <div data-testid="community-curations" />,
}));

describe("WavesView", () => {
  beforeEach(() => {
    mockUseDeviceInfo.mockReturnValue({ isApp: false });
    mockUsePathname.mockReturnValue("/waves");
    mockUseMyStreamOptional.mockReturnValue({ activeWave: { id: null } });
  });

  it("does not flash community content while a routed wave is hydrating", () => {
    mockUsePathname.mockReturnValue("/waves/wave-123");

    render(<WavesView />);

    expect(
      screen.getByTestId("wave-view-loading-placeholder")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("community-curations")).not.toBeInTheDocument();
  });

  it("does not show a stale active wave while route state is changing", () => {
    mockUsePathname.mockReturnValue("/waves/wave-456");
    mockUseMyStreamOptional.mockReturnValue({
      activeWave: { id: "wave-123" },
    });

    render(<WavesView />);

    expect(
      screen.getByTestId("wave-view-loading-placeholder")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("active-wave")).not.toBeInTheDocument();
  });

  it("renders the active wave once it matches the route", () => {
    mockUsePathname.mockReturnValue("/waves/wave-123");
    mockUseMyStreamOptional.mockReturnValue({
      activeWave: { id: "wave-123" },
    });

    render(<WavesView />);

    expect(screen.getByTestId("active-wave")).toHaveTextContent("wave-123");
    expect(
      screen.queryByTestId("wave-view-loading-placeholder")
    ).not.toBeInTheDocument();
  });

  it("keeps community content on the waves index", () => {
    render(<WavesView />);

    expect(screen.getByTestId("community-curations")).toBeInTheDocument();
    expect(
      screen.queryByTestId("wave-view-loading-placeholder")
    ).not.toBeInTheDocument();
  });
});
