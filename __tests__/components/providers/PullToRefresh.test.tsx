import PullToRefresh from "@/components/providers/PullToRefresh";
import { RefreshProvider } from "@/contexts/RefreshContext";
import {
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

    if (originalScrollYDescriptor === undefined) {
      delete (globalThis as { scrollY?: unknown }).scrollY;
    } else {
      Object.defineProperty(globalThis, "scrollY", originalScrollYDescriptor);
    }
  });

  it("publishes a matching fixed-overlay offset while pulling and releasing", () => {
    const triggerZone = document.createElement("div");
    document.body.appendChild(triggerZone);
    const triggerZoneRef: RefObject<HTMLElement | null> = {
      current: triggerZone,
    };

    const { unmount } = render(
      <RefreshProvider>
        <PullToRefresh triggerZoneRef={triggerZoneRef} />
      </RefreshProvider>
    );

    act(() => {
      dispatchTouchEvent({
        clientY: 0,
        target: triggerZone,
        type: "touchstart",
      });
      dispatchTouchEvent({
        clientY: 120,
        target: triggerZone,
        type: "touchmove",
      });
    });

    expect(document.body.style.transform).toBe("translateY(60px)");
    expect(document.body.style.transition).toBe("none");
    expect(
      document.documentElement.style.getPropertyValue(
        PULL_TO_REFRESH_FIXED_OVERLAY_OFFSET_PROPERTY
      )
    ).toBe("60px");
    expect(
      document.documentElement.style.getPropertyValue(
        PULL_TO_REFRESH_FIXED_OVERLAY_TRANSITION_DURATION_PROPERTY
      )
    ).toBe("0ms");

    act(() => {
      dispatchTouchEvent({ target: triggerZone, type: "touchend" });
    });

    expect(document.body.style.transform).toBe("");
    expect(document.body.style.transition).toBe("transform 0.3s ease-out");
    expect(
      document.documentElement.style.getPropertyValue(
        PULL_TO_REFRESH_FIXED_OVERLAY_OFFSET_PROPERTY
      )
    ).toBe("0px");
    expect(
      document.documentElement.style.getPropertyValue(
        PULL_TO_REFRESH_FIXED_OVERLAY_TRANSITION_DURATION_PROPERTY
      )
    ).toBe("300ms");

    unmount();
    triggerZone.remove();
  });
});
