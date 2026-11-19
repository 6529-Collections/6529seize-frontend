import { act, render, screen } from "@testing-library/react";
import useDialogKeyboard from "@/hooks/useDialogKeyboard";

let mockIsNative = false;
const mockLock = jest.fn();
const mockReveal = jest.fn();
const mockDisconnect = jest.fn();
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: mockIsNative, isAndroid: false }),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayoutViewportLock: (active: boolean) => mockLock(active),
}));
jest.mock("@/helpers/focused-field-visibility", () => ({
  observeFocusedField: () => ({
    reveal: mockReveal,
    disconnect: mockDisconnect,
  }),
}));

function Dialog({ open = true }: { readonly open?: boolean }) {
  const ref = useDialogKeyboard(open);
  return <div ref={ref} data-testid="viewport" />;
}

describe("useDialogKeyboard", () => {
  const originalViewport = globalThis.visualViewport;
  const originalHeight = globalThis.innerHeight;
  let viewport: EventTarget & {
    height: number;
    offsetTop: number;
    scale: number;
  };
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsNative = false;
    viewport = Object.assign(new EventTarget(), {
      height: 800,
      offsetTop: 0,
      scale: 1,
    });
    Object.defineProperty(globalThis, "visualViewport", {
      configurable: true,
      value: viewport,
    });
    Object.defineProperty(globalThis, "innerHeight", {
      configurable: true,
      value: 800,
    });
  });
  afterEach(() => {
    Object.defineProperty(globalThis, "visualViewport", {
      configurable: true,
      value: originalViewport,
    });
    Object.defineProperty(globalThis, "innerHeight", {
      configurable: true,
      value: originalHeight,
    });
  });

  it("follows browser keyboard resizing and panning without counting the pan twice", () => {
    const { unmount } = render(<Dialog />);
    const element = screen.getByTestId("viewport");
    act(() => {
      viewport.height = 450;
      viewport.offsetTop = 30;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(
      element.style.getPropertyValue("--native-keyboard-inset-bottom")
    ).toBe("320px");
    expect(element.style.getPropertyValue("--dialog-viewport-height")).toBe(
      "450px"
    );
    expect(element.style.top).toBe("30px");
    act(() => {
      viewport.height = 800;
      viewport.offsetTop = 0;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(
      element.style.getPropertyValue("--native-keyboard-inset-bottom")
    ).toBe("");
    expect(element.style.top).toBe("");
    expect(mockLock).toHaveBeenLastCalledWith(false);
    const reveals = mockReveal.mock.calls.length;
    unmount();
    viewport.dispatchEvent(new Event("resize"));
    expect(mockReveal).toHaveBeenCalledTimes(reveals);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(element.hasAttribute("data-keyboard-scroll-container")).toBe(false);
  });

  it("leaves pinch zoom to the browser", () => {
    render(<Dialog />);
    act(() => {
      viewport.scale = 2;
      viewport.height = 300;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(
      screen
        .getByTestId("viewport")
        .style.getPropertyValue("--native-keyboard-inset-bottom")
    ).toBe("");
  });

  it("clears browser compensation when the native platform becomes available", () => {
    viewport.height = 450;
    const { rerender } = render(<Dialog />);
    const element = screen.getByTestId("viewport");
    expect(
      element.style.getPropertyValue("--native-keyboard-inset-bottom")
    ).toBe("350px");
    mockIsNative = true;
    rerender(<Dialog />);
    expect(
      element.style.getPropertyValue("--native-keyboard-inset-bottom")
    ).toBe("");
    expect(element.style.getPropertyValue("--dialog-viewport-height")).toBe("");
    expect(mockLock).toHaveBeenLastCalledWith(true);
  });

  it("uses the native inset and locks the background instead of applying browser compensation", () => {
    mockIsNative = true;
    const { rerender } = render(<Dialog />);
    act(() => {
      viewport.height = 450;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(
      screen
        .getByTestId("viewport")
        .style.getPropertyValue("--native-keyboard-inset-bottom")
    ).toBe("");
    expect(mockLock).toHaveBeenLastCalledWith(true);
    rerender(<Dialog open={false} />);
    expect(mockLock).toHaveBeenLastCalledWith(false);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
