import { render, screen } from "@testing-library/react";

import PublicWaveFeedGate from "@/components/waves/PublicWaveFeedGate";
import { MyStreamWaveTab } from "@/types/waves.types";

let mockContentTab = MyStreamWaveTab.CHAT;
jest.mock("@/components/brain/ContentTabContext", () => ({
  useContentTab: () => ({ activeContentTab: mockContentTab }),
}));

import { usePublicWaveFeedReady } from "@/components/waves/PublicWaveFeedReady";
import { renderToString } from "react-dom/server";

let mockActiveWaveId: string | null = "wave-1";
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => ({ activeWave: { id: mockActiveWaveId } }),
}));

function InteractiveFeed({ ready = false }: { readonly ready?: boolean }) {
  usePublicWaveFeedReady(ready);
  return <button type="button">Interactive feed</button>;
}

describe("PublicWaveFeedGate", () => {
  beforeEach(() => {
    mockActiveWaveId = "wave-1";
    mockContentTab = MyStreamWaveTab.CHAT;
    jest.clearAllMocks();
  });

  it("keeps the fallback visible while the interactive feed is loading", () => {
    render(
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        <InteractiveFeed />
      </PublicWaveFeedGate>
    );

    expect(screen.getByText("Server public feed")).toBeInTheDocument();
    const interactiveSurface =
      screen.getByText("Interactive feed").parentElement;
    expect(interactiveSurface).toHaveAttribute("inert");
    expect(interactiveSurface).toHaveAttribute("aria-hidden", "true");

    expect(screen.getByText("Server public feed")).toBeInTheDocument();
  });

  it("keeps the server feed until the consuming chat has rendered, then hands off", () => {
    const { rerender } = render(
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        <InteractiveFeed />
      </PublicWaveFeedGate>
    );

    expect(screen.getByText("Server public feed")).toBeInTheDocument();
    rerender(
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        <InteractiveFeed ready />
      </PublicWaveFeedGate>
    );

    expect(screen.queryByText("Server public feed")).not.toBeInTheDocument();
    const interactiveSurface =
      screen.getByText("Interactive feed").parentElement;
    expect(interactiveSurface).not.toHaveAttribute("inert");
    expect(interactiveSurface).toHaveAttribute("aria-hidden", "false");
  });

  it("keeps post text and links in the server HTML for crawlers without JavaScript", () => {
    const html = renderToString(
      <PublicWaveFeedGate
        waveId="wave-1"
        fallback={<a href="/waves/wave-1?drop=post">Public post text</a>}
      >
        <InteractiveFeed />
      </PublicWaveFeedGate>
    );
    expect(html).toContain("Public post text");
    expect(html).toContain("/waves/wave-1?drop=post");
  });

  it("does not show content for a different active wave after hydration", () => {
    mockActiveWaveId = "wave-2";

    render(
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        <InteractiveFeed />
      </PublicWaveFeedGate>
    );

    expect(screen.queryByText("Server public feed")).not.toBeInTheDocument();
    expect(screen.getByText("Interactive feed")).toBeInTheDocument();
    const interactiveSurface =
      screen.getByText("Interactive feed").parentElement;
    expect(interactiveSurface).not.toHaveAttribute("inert");
    expect(interactiveSurface).toHaveAttribute("aria-hidden", "false");
  });

  it("ignores another wave's readiness when returning to the server fallback wave", () => {
    mockActiveWaveId = "wave-2";
    const { rerender } = render(
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        <InteractiveFeed ready />
      </PublicWaveFeedGate>
    );
    mockActiveWaveId = "wave-1";
    rerender(
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        <InteractiveFeed />
      </PublicWaveFeedGate>
    );
    expect(screen.getByText("Server public feed")).toBeInTheDocument();
  });

  it("does not cover a remembered Leaderboard with the server Chat fallback while its feed is pending", () => {
    mockContentTab = MyStreamWaveTab.LEADERBOARD;
    render(
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        <div>Leaderboard loading</div>
      </PublicWaveFeedGate>
    );
    expect(screen.queryByText("Server public feed")).not.toBeInTheDocument();
    expect(
      screen.getByText("Leaderboard loading").parentElement
    ).not.toHaveAttribute("inert");
  });

  it("requires a fresh readiness signal after returning to an already-ready wave", () => {
    const view = (ready: boolean) => (
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        <InteractiveFeed key={mockActiveWaveId} ready={ready} />
      </PublicWaveFeedGate>
    );
    const { rerender } = render(view(true));
    expect(screen.queryByText("Server public feed")).not.toBeInTheDocument();
    mockActiveWaveId = "wave-2";
    rerender(view(true));
    mockActiveWaveId = "wave-1";
    rerender(view(false));
    expect(screen.getByText("Server public feed")).toBeInTheDocument();
    rerender(view(true));
    expect(screen.queryByText("Server public feed")).not.toBeInTheDocument();
  });

  it("clears readiness when the consuming feed unmounts or begins loading again", () => {
    const view = (child: React.ReactNode) => (
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        {child}
      </PublicWaveFeedGate>
    );
    const { rerender } = render(view(<InteractiveFeed ready />));
    rerender(view(<InteractiveFeed />));
    expect(screen.getByText("Server public feed")).toBeInTheDocument();
    rerender(view(<InteractiveFeed ready />));
    expect(screen.queryByText("Server public feed")).not.toBeInTheDocument();
    rerender(view(<div>Chat loading</div>));
    expect(screen.getByText("Server public feed")).toBeInTheDocument();
  });
});
