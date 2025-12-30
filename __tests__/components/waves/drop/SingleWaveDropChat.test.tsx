import { SingleWaveDropChat } from "@/components/waves/drop/SingleWaveDropChat";
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
  default: (props: any) => (
    <button
      data-testid="creator"
      type="button"
      onClick={props.onCancelReplyQuote}
      data-part={props.activeDrop?.partId}
      data-action={props.activeDrop?.action}
    />
  ),
  DropMode: { BOTH: "BOTH" },
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
  beforeEach(() => {
    mockKeyboardVisible = false;
  });

  it("handles reply and reset actions", () => {
    const wave: any = { id: "w1" };
    const drop: any = { id: "d1" };
    render(<SingleWaveDropChat wave={wave} drop={drop} />);

    expect(capturedProps.waveId).toBe("w1");
    expect(capturedProps.dropId).toBe("d1");

    act(() => capturedProps.onReply({ drop, partId: 2 }));
    expect(document.querySelector('[data-part="2"]')).toBeInTheDocument();

    fireEvent.click(document.querySelector('[data-testid="creator"]')!);
    expect(document.querySelector('[data-part="1"]')).toBeInTheDocument();
  });

  it("applies safe-area-inset-bottom padding when keyboard is hidden", () => {
    mockKeyboardVisible = false;

    const wave: any = { id: "w1" };
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

    const wave: any = { id: "w1" };
    const drop: any = { id: "d1" };
    render(<SingleWaveDropChat wave={wave} drop={drop} />);

    const wrapper = document.querySelector(
      '[data-testid="wrapper"]'
    ) as HTMLElement;
    const container = wrapper?.parentElement as HTMLElement;

    expect(container.style.paddingBottom).toBe("0px");
  });
});
