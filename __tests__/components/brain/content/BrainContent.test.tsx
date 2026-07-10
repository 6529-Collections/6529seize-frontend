import { render, screen, fireEvent } from "@testing-library/react";
import BrainContent from "@/components/brain/content/BrainContent";
import { ActiveDropAction } from "@/types/dropInteractionTypes";

let mockIsApp = false;
let mockIsKeyboardVisible = false;

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: mockIsApp }),
}));

jest.mock("@/hooks/useNativeKeyboard", () => ({
  useNativeKeyboard: () => ({ isVisible: mockIsKeyboardVisible }),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ spaces: { mobileNavSpace: 72 } }),
}));

jest.mock("@/components/brain/content/input/BrainContentInput", () => ({
  __esModule: true,
  default: ({ activeDrop, onCancelReplyQuote }: any) => (
    <div data-testid="input">
      {activeDrop?.id ?? "no-drop"}
      <button onClick={onCancelReplyQuote}>cancel</button>
    </div>
  ),
}));

describe("BrainContent", () => {
  beforeEach(() => {
    mockIsApp = false;
    mockIsKeyboardVisible = false;
  });

  it("renders children without the old pinned waves slot", () => {
    render(
      <BrainContent activeDrop={null} onCancelReplyQuote={jest.fn()}>
        child
      </BrainContent>
    );
    expect(screen.getByText("child")).toBeInTheDocument();
    expect(screen.queryByTestId("pinned")).toBeNull();
  });

  it("passes props to BrainContentInput", () => {
    const onCancel = jest.fn();
    render(
      <BrainContent
        activeDrop={
          {
            id: "x",
            action: ActiveDropAction.REPLY,
            drop: { id: "x", wave: { id: "w" } } as any,
            partId: 0,
          } as any
        }
        onCancelReplyQuote={onCancel}
      >
        child
      </BrainContent>
    );
    expect(screen.getByTestId("input")).toHaveTextContent("x");
    fireEvent.click(screen.getByText("cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("positions the native composer from the shared keyboard inset", () => {
    mockIsApp = true;
    mockIsKeyboardVisible = true;

    render(
      <BrainContent
        activeDrop={
          {
            id: "x",
            action: ActiveDropAction.REPLY,
            drop: { id: "x", wave: { id: "w" } } as any,
            partId: 0,
          } as any
        }
        onCancelReplyQuote={jest.fn()}
      >
        child
      </BrainContent>
    );

    const composer = screen.getByTestId("input").parentElement;

    expect(composer).not.toBeNull();
    expect(composer).toHaveClass("tw-fixed");
    expect(composer?.style.bottom).toBe(
      "calc(var(--native-keyboard-inset-bottom, 0px) + 0px)"
    );
    expect(composer?.style.transitionProperty).toBe("bottom");
    expect(composer?.style.transitionDuration).toBe(
      "var(--native-keyboard-layout-transition-duration, 0ms)"
    );
  });

  it("keeps the web composer on its existing positioning path", () => {
    render(
      <BrainContent
        activeDrop={
          {
            id: "x",
            action: ActiveDropAction.REPLY,
            drop: { id: "x", wave: { id: "w" } } as any,
            partId: 0,
          } as any
        }
        onCancelReplyQuote={jest.fn()}
      >
        child
      </BrainContent>
    );

    const composer = screen.getByTestId("input").parentElement;

    expect(composer).not.toBeNull();
    expect(composer).toHaveClass("tw-absolute", "tw-bottom-0");
    expect(composer?.style.bottom).toBe("");
    expect(composer?.style.transitionProperty).toBe("");
    expect(composer?.style.transitionDuration).toBe("");
  });
});
