import { act, render, screen } from "@testing-library/react";

import PublicWaveFeedGate from "@/components/waves/PublicWaveFeedGate";

type TestWaveMessages = {
  readonly isLoading: boolean;
  readonly drops: readonly { readonly id: string }[];
};

let mockActiveWaveId: string | null = "wave-1";
let mockWaveMessages: TestWaveMessages | undefined;
const mockListeners = new Set<() => void>();

const mockTestStore = {
  getData: jest.fn(() => mockWaveMessages),
  subscribe: jest.fn((_waveId: string, listener: () => void) => {
    mockListeners.add(listener);
  }),
  unsubscribe: jest.fn((_waveId: string, listener: () => void) => {
    mockListeners.delete(listener);
  }),
};

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => ({
    activeWave: { id: mockActiveWaveId },
    waveMessagesStore: mockTestStore,
  }),
}));

const publishMessages = (nextMessages: TestWaveMessages | undefined) => {
  mockWaveMessages = nextMessages;
  for (const listener of mockListeners) {
    listener();
  }
};

describe("PublicWaveFeedGate", () => {
  beforeEach(() => {
    mockActiveWaveId = "wave-1";
    mockWaveMessages = undefined;
    mockListeners.clear();
    jest.clearAllMocks();
  });

  it("keeps the fallback visible while the interactive feed is loading", () => {
    render(
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        <button type="button">Interactive feed</button>
      </PublicWaveFeedGate>
    );

    expect(screen.getByText("Server public feed")).toBeInTheDocument();
    const interactiveSurface =
      screen.getByText("Interactive feed").parentElement;
    expect(interactiveSurface).toHaveAttribute("inert");
    expect(interactiveSurface).toHaveAttribute("aria-hidden", "true");

    act(() => {
      publishMessages({ isLoading: true, drops: [] });
    });

    expect(screen.getByText("Server public feed")).toBeInTheDocument();
  });

  it("unmounts the fallback when the interactive feed reaches a terminal state", () => {
    render(
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        <button type="button">Interactive feed</button>
      </PublicWaveFeedGate>
    );

    act(() => {
      publishMessages({ isLoading: false, drops: [{ id: "drop-1" }] });
    });

    expect(screen.queryByText("Server public feed")).not.toBeInTheDocument();
    const interactiveSurface =
      screen.getByText("Interactive feed").parentElement;
    expect(interactiveSurface).not.toHaveAttribute("inert");
    expect(interactiveSurface).toHaveAttribute("aria-hidden", "false");
  });

  it("does not show content for a different active wave after hydration", () => {
    mockActiveWaveId = "wave-2";

    render(
      <PublicWaveFeedGate
        fallback={<div>Server public feed</div>}
        waveId="wave-1"
      >
        <button type="button">Interactive feed</button>
      </PublicWaveFeedGate>
    );

    expect(screen.queryByText("Server public feed")).not.toBeInTheDocument();
    expect(screen.getByText("Interactive feed")).toBeInTheDocument();
    const interactiveSurface =
      screen.getByText("Interactive feed").parentElement;
    expect(interactiveSurface).not.toHaveAttribute("inert");
    expect(interactiveSurface).toHaveAttribute("aria-hidden", "false");
  });
});
