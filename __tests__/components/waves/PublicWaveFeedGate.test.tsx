import { render, screen } from "@testing-library/react";

import styles from "@/components/waves/PublicWaveFeedGate.module.css";
import PublicWaveFeedGate from "@/components/waves/PublicWaveFeedGate";
import WaveChatLoading from "@/components/waves/WaveChatLoading";
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

  it("retains public HTML alongside the quiet loader until chat renders", () => {
    render(
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        <InteractiveFeed />
      </PublicWaveFeedGate>
    );

    expect(screen.getByText("Server public feed")).toBeInTheDocument();
    expect(screen.getByTestId("wave-chat-loading")).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
    const interactiveSurface =
      screen.getByText("Interactive feed").parentElement;
    expect(interactiveSurface).toHaveAttribute("inert");
    expect(interactiveSurface).toHaveAttribute("aria-hidden", "true");

    expect(screen.getByText("Server public feed")).toBeInTheDocument();
  });

  it("exposes one status while the covered interactive chat has its own loader", () => {
    render(
      <PublicWaveFeedGate
        waveId="wave-1"
        fallback={<div>Server public feed</div>}
      >
        <WaveChatLoading showHeader={false} />
      </PublicWaveFeedGate>
    );
    expect(screen.getAllByRole("status", { hidden: true })).toHaveLength(2);
    expect(screen.getAllByRole("status")).toHaveLength(1);
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
    expect(html).toContain("wave-chat-loading");
    expect(html).toContain(`class="${styles["publicFeed"]}"`);
    expect(html).not.toContain(styles["enhanced"]);
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
