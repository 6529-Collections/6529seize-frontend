import { render, screen } from "@testing-library/react";
import WavesView from "@/components/waves/WavesView";

let activeWaveId: string | null = null;
let isApp = false;

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp }),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => ({ activeWave: { id: activeWaveId } }),
}));

jest.mock("@/components/community-curations/CommunityCurations", () => ({
  __esModule: true,
  default: ({ topContent }: { readonly topContent?: React.ReactNode }) => (
    <div data-testid="profile-feed">{topContent}</div>
  ),
}));

jest.mock("@/components/brain/my-stream/MyStreamWave", () => ({
  __esModule: true,
  default: ({ waveId }: { readonly waveId: string }) => (
    <div data-testid="wave">{waveId}</div>
  ),
}));

jest.mock("@/components/brain/content/BrainContent", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("WavesView", () => {
  beforeEach(() => {
    activeWaveId = null;
    isApp = false;
  });

  it("adds a breakpoint-hidden Wave list link to the profile feed", () => {
    render(<WavesView />);

    expect(screen.getByTestId("profile-feed")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Waves" });
    expect(link).toHaveAttribute("href", "/waves");
    expect(link.closest("nav")).toHaveClass("lg:tw-hidden");
  });

  it("keeps the selected Wave conversation path unchanged", () => {
    activeWaveId = "wave-1";

    render(<WavesView />);

    expect(screen.getByTestId("wave")).toHaveTextContent("wave-1");
    expect(screen.queryByTestId("profile-feed")).toBeNull();
  });
});
