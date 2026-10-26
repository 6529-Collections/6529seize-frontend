import { render, screen } from "@testing-library/react";
import WavesView from "@/components/waves/WavesView";
import CompetitionRoute from "@/components/competitions/CompetitionRoute";
import { createContext } from "react";

let mockContentState = "ready";
jest.mock("@/hooks/useAuthenticatedContent", () => ({
  useAuthenticatedContent: () => ({ contentState: mockContentState }),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/waves",
  useSearchParams: () => new URLSearchParams(),
}));

let activeWaveId: string | null = null;
let isApp = false;
const mockSelectionContext = createContext<{
  readonly id: string | null;
} | null>(null);

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp }),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    useMyStreamOptional: () => ({
      activeWave: React.useContext(mockSelectionContext) ?? {
        id: activeWaveId,
      },
    }),
  };
});

jest.mock("@/components/community-curations/CommunityCurations", () => ({
  __esModule: true,
  default: ({ topContent }: { readonly topContent?: React.ReactNode }) => (
    <div data-testid="profile-feed">{topContent}</div>
  ),
}));

jest.mock("@/components/waves/WaveRouteShell", () => ({
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

describe.each([
  { entry: "wave", View: WavesView },
  { entry: "competition", View: CompetitionRoute },
])("$entry page selection", ({ View }) => {
  beforeEach(() => {
    mockContentState = "ready";
    activeWaveId = null;
    isApp = false;
  });

  it("keeps auth-loading waves on a wave loader instead of mounting discovery or chat", () => {
    mockContentState = "loading";
    activeWaveId = "wave-1";
    render(<View />);
    expect(
      screen.getByTestId("stream-route-loading-shell")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("profile-feed")).not.toBeInTheDocument();
    expect(screen.queryByTestId("wave")).not.toBeInTheDocument();
  });

  it("adds a breakpoint-hidden Wave list link to the profile feed", () => {
    render(<View />);

    expect(screen.getByTestId("profile-feed")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Waves" });
    expect(link).toHaveAttribute("href", "/waves");
    expect(link.closest("nav")).toHaveClass("lg:tw-hidden");
  });

  it("leaves profile feed navigation to the native app header", () => {
    isApp = true;

    render(<View />);

    expect(screen.queryByTestId("profile-feed")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Waves" })
    ).not.toBeInTheDocument();
  });

  it("keeps the selected Wave conversation path unchanged", () => {
    activeWaveId = "wave-1";

    render(<View />);

    expect(screen.getByTestId("wave")).toHaveTextContent("wave-1");
    expect(screen.queryByTestId("profile-feed")).toBeNull();
  });

  it("follows another wave and the wave list while the entry page stays mounted", () => {
    const entry = (id: string | null) => (
      <mockSelectionContext.Provider value={{ id }}>
        <View />
      </mockSelectionContext.Provider>
    );
    const { rerender } = render(entry("wave-1"));
    rerender(entry("wave-2"));
    expect(screen.getByTestId("wave")).toHaveTextContent("wave-2");
    expect(screen.getByTestId("wave")).not.toHaveTextContent("wave-1");
    rerender(entry(null));
    expect(screen.queryByTestId("wave")).not.toBeInTheDocument();
    expect(screen.getByTestId("profile-feed")).toBeInTheDocument();
  });
});
