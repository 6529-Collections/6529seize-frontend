import HighlightDropWrapper from "@/components/drops/view/HighlightDropWrapper";
import { act, render, screen } from "@testing-library/react";

beforeAll(() => {
  if (typeof DOMRect === "undefined") {
    // @ts-ignore
    global.DOMRect = class DOMRect {
      left: number;
      top: number;
      right: number;
      bottom: number;
      width: number;
      height: number;
      constructor(x = 0, y = 0, width = 0, height = 0) {
        this.left = x;
        this.top = y;
        this.width = width;
        this.height = height;
        this.right = x + width;
        this.bottom = y + height;
      }
    } as any;
  }
  if (typeof window.requestAnimationFrame === "undefined") {
    // @ts-ignore
    window.requestAnimationFrame = (cb: FrameRequestCallback) =>
      setTimeout(() => cb(Date.now()), 0) as unknown as number;
    // @ts-ignore
    window.cancelAnimationFrame = (id: number) =>
      clearTimeout(id as unknown as number);
  }
});

let gBCRSpy: jest.SpyInstance;
beforeEach(() => {
  gBCRSpy = jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function () {
      return {
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as unknown as DOMRect;
    });
});

afterEach(() => {
  if (gBCRSpy) gBCRSpy.mockRestore();
});

jest.useFakeTimers();

describe("HighlightDropWrapper", () => {
  it("renders children", () => {
    render(
      <HighlightDropWrapper active={false}>
        <div data-testid="child" />
      </HighlightDropWrapper>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies highlight class when active and fades out after timeout", () => {
    const { container } = render(
      <HighlightDropWrapper active={true} highlightMs={1000} fadeMs={500}>
        <div>drop</div>
      </HighlightDropWrapper>
    );

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveClass("tw-bg-[#25263f]");
    expect(wrapper).toHaveClass("tw-transition-colors");
    expect(wrapper.style.transitionDuration).not.toBe("");

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(wrapper).not.toHaveClass("tw-bg-[#25263f]");
    expect(wrapper).toHaveClass("tw-transition-colors");
    expect(wrapper).toHaveClass("tw-bg-transparent");
    expect(wrapper.style.transitionDuration).not.toBe("");

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(wrapper).not.toHaveClass("tw-bg-[#25263f]");
    expect(wrapper).not.toHaveClass("tw-transition-colors");
    expect(wrapper).not.toHaveClass("tw-bg-transparent");
    expect(wrapper.style.transitionDuration).toBe("");
  });

  it("restarts highlight when reactivated", () => {
    const { rerender, container } = render(
      <HighlightDropWrapper active={true} highlightMs={1000}>
        <div>drop</div>
      </HighlightDropWrapper>
    );

    act(() => {
      jest.advanceTimersByTime(1200);
    });
    expect(container.firstChild).not.toHaveClass("tw-bg-[#25263f]");

    rerender(
      <HighlightDropWrapper active={false} highlightMs={1000}>
        <div>drop</div>
      </HighlightDropWrapper>
    );

    act(() => {
      jest.advanceTimersByTime(1);
    });

    rerender(
      <HighlightDropWrapper active={true} highlightMs={1000}>
        <div>drop</div>
      </HighlightDropWrapper>
    );

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(container.firstChild).toHaveClass("tw-bg-[#25263f]");
    expect(container.firstChild).toHaveClass("tw-transition-colors");
  });

  it("keeps highlight duration even if active resets immediately", () => {
    const { rerender, container } = render(
      <HighlightDropWrapper active={true} highlightMs={1000} fadeMs={500}>
        <div>drop</div>
      </HighlightDropWrapper>
    );

    rerender(
      <HighlightDropWrapper active={false} highlightMs={1000} fadeMs={500}>
        <div>drop</div>
      </HighlightDropWrapper>
    );

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveClass("tw-bg-[#25263f]");
    expect(wrapper).toHaveClass("tw-transition-colors");
    expect(wrapper.style.transitionDuration).not.toBe("");

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(wrapper).not.toHaveClass("tw-bg-[#25263f]");
    expect(wrapper).toHaveClass("tw-transition-colors");
    expect(wrapper).toHaveClass("tw-bg-transparent");
    expect(wrapper.style.transitionDuration).not.toBe("");

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(wrapper).not.toHaveClass("tw-bg-[#25263f]");
    expect(wrapper).not.toHaveClass("tw-transition-colors");
    expect(wrapper).not.toHaveClass("tw-bg-transparent");
    expect(wrapper.style.transitionDuration).toBe("");
  });
});
