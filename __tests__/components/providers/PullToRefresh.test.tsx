import PullToRefresh from "@/components/providers/PullToRefresh";
import { RefreshProvider } from "@/contexts/RefreshContext";
import {
  PULL_TO_REFRESH_ACTIVE_ATTRIBUTE,
  PULL_TO_REFRESH_FIXED_OVERLAY_OFFSET_PROPERTY,
  PULL_TO_REFRESH_FIXED_OVERLAY_TRANSITION_DURATION_PROPERTY,
} from "@/helpers/pull-to-refresh.helpers";
import { act, render } from "@testing-library/react";
import type { RefObject } from "react";

const dispatchTouchEvent = ({
  clientY,
  target,
  type,
}: {
  readonly clientY?: number | undefined;
  readonly target: HTMLElement;
  readonly type: string;
}) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", {
    value: typeof clientY === "number" ? [{ clientY }] : [],
  });

  target.dispatchEvent(event);
};

const expectPullState = ({
  active,
  offset,
  transitionDuration,
}: {
  readonly active: boolean;
  readonly offset: string;
  readonly transitionDuration: string;
}) => {
  expect(
    document.documentElement.style.getPropertyValue(
      PULL_TO_REFRESH_FIXED_OVERLAY_OFFSET_PROPERTY
    )
  ).toBe(offset);
  expect(
    document.documentElement.style.getPropertyValue(
      PULL_TO_REFRESH_FIXED_OVERLAY_TRANSITION_DURATION_PROPERTY
    )
  ).toBe(transitionDuration);
  if (active) {
    expect(document.documentElement).toHaveAttribute(
      PULL_TO_REFRESH_ACTIVE_ATTRIBUTE,
      "true"
    );
  } else {
    expect(document.documentElement).not.toHaveAttribute(
      PULL_TO_REFRESH_ACTIVE_ATTRIBUTE
    );
  }
};

const renderPullToRefresh = ({
  useContentTarget = false,
}: {
  readonly useContentTarget?: boolean;
} = {}) => {
  const content = document.createElement("div");
  const triggerZone = document.createElement("div");
  const host = useContentTarget ? content : document.body;
  host.appendChild(triggerZone);
  if (useContentTarget) {
    document.body.appendChild(content);
  }

  const triggerZoneRef: RefObject<HTMLElement | null> = {
    current: triggerZone,
  };
  const contentRef: RefObject<HTMLElement | null> | undefined = useContentTarget
    ? { current: content }
    : undefined;
  const renderResult = render(
    <RefreshProvider>
      <PullToRefresh contentRef={contentRef} triggerZoneRef={triggerZoneRef} />
    </RefreshProvider>
  );

  return {
    content,
    target: contentRef?.current ?? document.body,
    triggerZone,
    unmount: () => {
      renderResult.unmount();
      if (useContentTarget) {
        content.remove();
      } else {
        triggerZone.remove();
      }
    },
  };
};

const startPull = (target: HTMLElement, pullToY: number) => {
  act(() => {
    dispatchTouchEvent({
      clientY: 0,
      target,
      type: "touchstart",
    });
    dispatchTouchEvent({
      clientY: pullToY,
      target,
      type: "touchmove",
    });
  });
};

describe("PullToRefresh", () => {
  let originalScrollYDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalScrollYDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "scrollY"
    );
    Object.defineProperty(globalThis, "scrollY", {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  afterEach(() => {
    document.body.style.transform = "";
    document.body.style.transition = "";
    document.documentElement.style.removeProperty(
      PULL_TO_REFRESH_FIXED_OVERLAY_OFFSET_PROPERTY
    );
    document.documentElement.style.removeProperty(
      PULL_TO_REFRESH_FIXED_OVERLAY_TRANSITION_DURATION_PROPERTY
    );
    document.documentElement.removeAttribute(PULL_TO_REFRESH_ACTIVE_ATTRIBUTE);
    jest.useRealTimers();

    if (originalScrollYDescriptor === undefined) {
      delete (globalThis as { scrollY?: unknown }).scrollY;
    } else {
      Object.defineProperty(globalThis, "scrollY", originalScrollYDescriptor);
    }
  });

  it("publishes pull offset while using document body as the fallback target", () => {
    const pull = renderPullToRefresh();

    startPull(pull.triggerZone, 120);

    expect(document.body.style.transform).toBe("translateY(60px)");
    expect(document.body.style.transition).toBe("none");
    expectPullState({
      active: true,
      offset: "60px",
      transitionDuration: "0ms",
    });

    act(() => {
      dispatchTouchEvent({ target: pull.triggerZone, type: "touchend" });
    });

    expect(document.body.style.transform).toBe("");
    expect(document.body.style.transition).toBe("transform 0.3s ease-out");
    expectPullState({
      active: true,
      offset: "0px",
      transitionDuration: "300ms",
    });

    pull.unmount();
  });

  it("transforms a provided content target instead of document body", () => {
    const pull = renderPullToRefresh({ useContentTarget: true });

    startPull(pull.triggerZone, 120);

    expect(pull.content.style.transform).toBe("translateY(60px)");
    expect(pull.content.style.transition).toBe("none");
    expect(document.body.style.transform).toBe("");

    pull.unmount();
  });

  it("keeps overlay offset during committed refresh and then clears active state", () => {
    jest.useFakeTimers();
    const pull = renderPullToRefresh();

    startPull(pull.triggerZone, 200);
    act(() => {
      dispatchTouchEvent({ target: pull.triggerZone, type: "touchend" });
    });

    expect(document.body.style.transform).toBe("translateY(56px)");
    expect(document.body.style.transition).toBe("transform 0.3s ease-out");
    expectPullState({
      active: true,
      offset: "56px",
      transitionDuration: "300ms",
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(document.body.style.transform).toBe("");
    expectPullState({
      active: true,
      offset: "0px",
      transitionDuration: "300ms",
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expectPullState({
      active: false,
      offset: "0px",
      transitionDuration: "300ms",
    });

    pull.unmount();
  });

  it("clears overlay offset on touch cancel and unmount", () => {
    const canceledPull = renderPullToRefresh();

    startPull(canceledPull.triggerZone, 120);
    act(() => {
      dispatchTouchEvent({
        target: canceledPull.triggerZone,
        type: "touchcancel",
      });
    });

    expect(document.body.style.transform).toBe("");
    expect(document.body.style.transition).toBe("");
    expectPullState({
      active: false,
      offset: "0px",
      transitionDuration: "0ms",
    });
    canceledPull.unmount();

    const unmountedPull = renderPullToRefresh();
    startPull(unmountedPull.triggerZone, 120);
    unmountedPull.unmount();

    expect(document.body.style.transform).toBe("");
    expect(document.body.style.transition).toBe("");
    expectPullState({
      active: false,
      offset: "0px",
      transitionDuration: "0ms",
    });
  });
});
