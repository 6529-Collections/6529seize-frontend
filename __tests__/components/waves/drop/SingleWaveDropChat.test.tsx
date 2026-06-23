import { SingleWaveDropChat } from "@/components/waves/drop/SingleWaveDropChat";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { act, fireEvent, render } from "@testing-library/react";

jest.mock("@/hooks/useDeviceInfo", () => () => ({
  isMobileDevice: true,
  hasTouchScreen: true,
  isApp: true,
  isAppleMobile: false,
}));

// Mock useAndroidKeyboard with configurable values
let mockKeyboardVisible = false;

jest.mock("@/hooks/useAndroidKeyboard", () => ({
  useAndroidKeyboard: () => ({
    isVisible: mockKeyboardVisible,
    keyboardHeight: mockKeyboardVisible ? 350 : 0,
    isAndroid: true,
  }),
}));

let capturedProps: any;
let capturedCreatorProps: any;
jest.mock("@/components/waves/drops/wave-drops-all", () => ({
  __esModule: true,
  default: (props: any) => {
    capturedProps = props;
    return <div data-testid="drops-all" />;
  },
}));

jest.mock("@/components/waves/CreateDropWaveWrapper", () => ({
  CreateDropWaveWrapper: ({ children }: any) => (
    <div data-testid="wrapper">{children}</div>
  ),
  CreateDropWaveWrapperContext: { SINGLE_DROP: "SINGLE_DROP" },
}));

jest.mock("@/components/waves/PrivilegedDropCreator", () => ({
  __esModule: true,
  default: (props: any) => {
    capturedCreatorProps = props;
    return (
      <button
        data-testid="creator"
        type="button"
        onClick={props.onCancelReplyQuote}
        data-part={props.activeDrop?.partId}
        data-action={props.activeDrop?.action}
        data-mode={props.fixedDropMode}
      />
    );
  },
  DropMode: { BOTH: "BOTH", CHAT: "CHAT" },
}));

// Mock globalThis.matchMedia for useDeviceInfo hook
Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("SingleWaveDropChat", () => {
  const createWave = (overrides: Record<string, unknown> = {}) =>
    ({
      id: "w1",
      metrics: { muted: false, your_unread_drops_count: 0 },
      wave: { type: ApiWaveType.Rank, winning_threshold: null },
      ...overrides,
    }) as any;

  beforeEach(() => {
    mockKeyboardVisible = false;
    capturedProps = undefined;
    capturedCreatorProps = undefined;
  });

  it("handles reply and reset actions", () => {
    const wave = createWave();
    const drop: any = { id: "d1" };
    render(<SingleWaveDropChat wave={wave} drop={drop} />);

    expect(capturedProps.waveId).toBe("w1");
    expect(capturedProps.dropId).toBe("d1");
    expect(capturedCreatorProps.fixedDropMode).toBe("CHAT");

    act(() => capturedProps.onReply({ drop, partId: 2 }));
    expect(document.querySelector('[data-part="2"]')).toBeInTheDocument();

    fireEvent.click(document.querySelector('[data-testid="creator"]')!);
    expect(document.querySelector('[data-part="1"]')).toBeInTheDocument();
  });

  it("applies safe-area-inset-bottom padding when keyboard is hidden", () => {
    mockKeyboardVisible = false;

    const wave = createWave();
    const drop: any = { id: "d1" };
    render(<SingleWaveDropChat wave={wave} drop={drop} />);

    const wrapper = document.querySelector(
      '[data-testid="wrapper"]'
    ) as HTMLElement;
    const container = wrapper?.parentElement as HTMLElement;

    expect(container.style.paddingBottom).toBe(
      "calc(env(safe-area-inset-bottom))"
    );
  });

  it("applies 0px padding when keyboard is visible", () => {
    mockKeyboardVisible = true;

    const wave = createWave();
    const drop: any = { id: "d1" };
    render(<SingleWaveDropChat wave={wave} drop={drop} />);

    const wrapper = document.querySelector(
      '[data-testid="wrapper"]'
    ) as HTMLElement;
    const container = wrapper?.parentElement as HTMLElement;

    expect(container.style.paddingBottom).toBe("0px");
  });

  it("passes approve wave state to WaveDropsAll", () => {
    const wave = createWave({
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 25,
        max_winners: 1,
        no_of_decisions_done: 1,
      },
    });
    const drop: any = { id: "d1" };
    render(
      <SingleWaveDropChat
        wave={wave}
        drop={drop}
        winningThreshold={25}
        winningThresholdMinDurationMs={120_000}
        isVotingClosed={false}
        isVotingControlsLocked={true}
      />
    );

    expect(capturedProps.winningThreshold).toBe(25);
    expect(capturedProps.winningThresholdMinDurationMs).toBe(120_000);
    expect(capturedProps.isVotingClosed).toBe(false);
    expect(capturedProps.isVotingControlsLocked).toBe(true);
    expect(capturedCreatorProps.fixedDropMode).toBe("CHAT");
  });

  it("keeps chat composer mode for unlocked waves", () => {
    const wave = createWave();
    const drop: any = { id: "d1" };

    render(<SingleWaveDropChat wave={wave} drop={drop} />);

    expect(capturedCreatorProps.fixedDropMode).toBe("CHAT");
  });

  it("locks the composer when voting is closed", () => {
    const wave = createWave();
    const drop: any = { id: "d1" };

    render(
      <SingleWaveDropChat
        wave={wave}
        drop={drop}
        isVotingClosed={true}
        isVotingControlsLocked={false}
      />
    );

    expect(capturedCreatorProps.fixedDropMode).toBe("CHAT");
  });
});
