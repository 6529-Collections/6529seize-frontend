import { act, fireEvent, render, waitFor } from "@testing-library/react";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import NavItem from "@/components/navigation/NavItem";
import { useAuth } from "@/components/auth/Auth";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";
import {
  MOBILE_BOTTOM_NAV_DOCK_ATTRIBUTE,
  MOBILE_BOTTOM_NAV_ROOT_ATTRIBUTE,
  MOBILE_BOTTOM_NAV_SCROLL_TARGET_SELECTOR,
} from "@/helpers/navigation.helpers";

jest.mock("@/components/navigation/NavItem", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="nav-item" />),
}));
jest.mock("@/components/auth/Auth", () => ({ useAuth: jest.fn() }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: jest.fn(),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/hooks/useWaveData", () => ({ useWaveData: jest.fn() }));
jest.mock("@/hooks/useWave", () => ({ useWave: jest.fn() }));
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const registerRef = jest.fn();
(useLayout as jest.Mock).mockReturnValue({ registerRef });
(useAuth as jest.Mock).mockReturnValue({ connectedProfile: null });
(useSeizeConnectContext as jest.Mock).mockReturnValue({ address: undefined });
(useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });
(useWaveData as jest.Mock).mockReturnValue({ data: null });
(useWave as jest.Mock).mockReturnValue({ isDm: false });

const { usePathname, useSearchParams } = require("next/navigation");
(usePathname as jest.Mock).mockReturnValue("/");
(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

let originalScrollYDescriptor: PropertyDescriptor | undefined;

const getMobileBottomNavScrollTargetAttribute = () => {
  const match = /^\[([^=\]]+)="true"\]$/.exec(
    MOBILE_BOTTOM_NAV_SCROLL_TARGET_SELECTOR
  );
  if (!match?.[1]) {
    throw new Error("Unexpected mobile bottom nav scroll target selector");
  }
  return match[1];
};

const MOBILE_BOTTOM_NAV_SCROLL_TARGET_ATTRIBUTE =
  getMobileBottomNavScrollTargetAttribute();

const flushAnimationFrame = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const expectActivePillLayoutCalc = ({
  compact = false,
  style,
}: {
  readonly compact?: boolean;
  readonly style: string | null;
}) => {
  expect(style).toContain("left: calc(");
  expect(style).toContain("100%");
  expect(style).toContain(compact ? "0.625rem" : "1rem");
};

const createScrollableElement = ({
  tracked,
}: {
  readonly tracked: boolean;
}) => {
  const element = document.createElement("div");
  if (tracked) {
    element.setAttribute(MOBILE_BOTTOM_NAV_SCROLL_TARGET_ATTRIBUTE, "true");
  }
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    value: 120,
  });
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    value: 240,
  });
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    value: 0,
    writable: true,
  });
  document.body.appendChild(element);
  return element;
};

beforeEach(() => {
  jest.clearAllMocks();
  originalScrollYDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "scrollY"
  );
  let animationFrameId = 0;
  const animationFrameTimeouts = new Map<
    number,
    ReturnType<typeof setTimeout>
  >();
  jest
    .spyOn(globalThis, "requestAnimationFrame")
    .mockImplementation((callback: FrameRequestCallback) => {
      const frameId = ++animationFrameId;
      const timeoutId = setTimeout(() => {
        animationFrameTimeouts.delete(frameId);
        callback(0);
      }, 0);
      animationFrameTimeouts.set(frameId, timeoutId);
      return frameId;
    });
  jest
    .spyOn(globalThis, "cancelAnimationFrame")
    .mockImplementation((frameId: number) => {
      const timeoutId = animationFrameTimeouts.get(frameId);
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        animationFrameTimeouts.delete(frameId);
      }
    });
  (useLayout as jest.Mock).mockReturnValue({ registerRef });
  (useAuth as jest.Mock).mockReturnValue({ connectedProfile: null });
  (useSeizeConnectContext as jest.Mock).mockReturnValue({
    address: undefined,
  });
  (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });
  (useWaveData as jest.Mock).mockReturnValue({ data: null });
  (useWave as jest.Mock).mockReturnValue({ isDm: false });
  (usePathname as jest.Mock).mockReturnValue("/");
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
});

afterEach(() => {
  if (originalScrollYDescriptor) {
    Object.defineProperty(globalThis, "scrollY", originalScrollYDescriptor);
  }
  jest.restoreAllMocks();
});

describe("BottomNavigation", () => {
  it("registers mobileNav ref and renders nav items", () => {
    const { container } = render(<BottomNavigation />);

    expect(registerRef).toHaveBeenCalledWith(
      "mobileNav",
      expect.any(HTMLElement)
    );

    const rendered = container.querySelectorAll('[data-testid="nav-item"]');
    const navItemCalls = (NavItem as jest.Mock).mock.calls;

    expect(rendered).toHaveLength(navItemCalls.length);
    expect(navItemCalls).toHaveLength(5);

    const passedItems = navItemCalls.map((call) => call[0].item);
    expect(passedItems.map((item: { name: string }) => item.name)).toEqual([
      "NFTs",
      "Waves",
      "DMs",
      "Join 6529",
      "About",
    ]);
    expect(navItemCalls.every((call) => call[0].variant === "floating")).toBe(
      true
    );
    expect(
      container.querySelector(`[${MOBILE_BOTTOM_NAV_ROOT_ATTRIBUTE}="true"]`)
    ).toBeInTheDocument();
  });

  it("renders a stable nav fallback when search params suspend", () => {
    const pendingSearchParams = new Promise<URLSearchParams>(() => {
      // Keep the promise pending so Suspense stays on the fallback.
    });
    (useSearchParams as jest.Mock).mockImplementation(() => {
      throw pendingSearchParams;
    });

    const { container } = render(<BottomNavigation />);

    expect(container.querySelector("nav")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(container.querySelector("ul")).toBeInTheDocument();
    expect(
      container.querySelector(`[${MOBILE_BOTTOM_NAV_ROOT_ATTRIBUTE}="true"]`)
    ).toBeInTheDocument();
    expect(NavItem).not.toHaveBeenCalled();
  });

  it("uses the floating dock on brain routes", () => {
    (usePathname as jest.Mock).mockReturnValue("/notifications");

    const { container } = render(<BottomNavigation />);

    expect(container.querySelector("nav")).toHaveClass(
      "tw-pointer-events-none"
    );
    expect(container.querySelector("nav")).not.toHaveClass("tw-h-[85px]");
    expect(
      container.querySelector(`[${MOBILE_BOTTOM_NAV_DOCK_ATTRIBUTE}="true"]`)
    ).toBeInTheDocument();
    expect(
      (NavItem as jest.Mock).mock.calls.every(([props]) => {
        return props.variant === "floating" && props.compact === false;
      })
    ).toBe(true);
  });

  it("keeps one active pill mounted while moving it between active items", () => {
    (usePathname as jest.Mock).mockReturnValue("/the-memes");
    const { getByTestId, rerender } = render(<BottomNavigation />);
    const activePill = getByTestId("mobile-dock-active-pill");
    const initialStyle = activePill.getAttribute("style");

    expectActivePillLayoutCalc({ style: initialStyle });
    expect(activePill).toHaveClass("tw-transition-[left,width,height,opacity]");

    (usePathname as jest.Mock).mockReturnValue("/waves");
    rerender(<BottomNavigation />);

    const movedActivePill = getByTestId("mobile-dock-active-pill");
    expect(movedActivePill).toBe(activePill);
    expect(movedActivePill.getAttribute("style")).not.toBe(initialStyle);
    expectActivePillLayoutCalc({
      style: movedActivePill.getAttribute("style"),
    });
  });

  it("hides the active pill when no dock item matches the route", () => {
    (usePathname as jest.Mock).mockReturnValue("/my-handle");
    (useAuth as jest.Mock).mockReturnValue({
      connectedProfile: { handle: "my-handle", normalised_handle: "my-handle" },
    });

    const { getByTestId } = render(<BottomNavigation />);

    expect(getByTestId("mobile-dock-active-pill")).toHaveClass("tw-opacity-0");
  });

  it("compacts the floating dock from window scroll", async () => {
    Object.defineProperty(globalThis, "scrollY", {
      configurable: true,
      value: 0,
      writable: true,
    });

    const { getByTestId } = render(<BottomNavigation />);

    act(() => {
      globalThis.scrollY = 24;
      fireEvent.scroll(globalThis);
    });

    await waitFor(() => {
      expect(
        (NavItem as jest.Mock).mock.calls.slice(-5).every(([props]) => {
          return props.variant === "floating" && props.compact === true;
        })
      ).toBe(true);
    });

    const activePill = getByTestId("mobile-dock-active-pill");
    expect(activePill).toHaveClass("tw-h-10", "tw-w-12");
    expectActivePillLayoutCalc({
      compact: true,
      style: activePill.getAttribute("style"),
    });
  });

  it("compacts the notifications dock on reverse scroll", async () => {
    (usePathname as jest.Mock).mockReturnValue("/notifications");
    Object.defineProperty(globalThis, "scrollY", {
      configurable: true,
      value: 48,
      writable: true,
    });

    render(<BottomNavigation />);

    act(() => {
      globalThis.scrollY = 24;
      fireEvent.scroll(globalThis);
    });

    await waitFor(() => {
      expect(
        (NavItem as jest.Mock).mock.calls.slice(-5).every(([props]) => {
          return props.variant === "floating" && props.compact === true;
        })
      ).toBe(true);
    });
  });

  it("compacts from marked element scroll containers", async () => {
    const scroller = createScrollableElement({ tracked: true });
    render(<BottomNavigation />);

    act(() => {
      scroller.scrollTop = 0;
      fireEvent.scroll(scroller);
    });
    await flushAnimationFrame();

    act(() => {
      scroller.scrollTop = 24;
      fireEvent.scroll(scroller);
    });

    await waitFor(() => {
      expect(
        (NavItem as jest.Mock).mock.calls.slice(-5).every(([props]) => {
          return props.variant === "floating" && props.compact === true;
        })
      ).toBe(true);
    });

    scroller.remove();
  });

  it("ignores unmarked nested scroll containers", async () => {
    const scroller = createScrollableElement({ tracked: false });
    render(<BottomNavigation />);

    act(() => {
      scroller.scrollTop = 0;
      fireEvent.scroll(scroller);
    });
    await flushAnimationFrame();

    act(() => {
      scroller.scrollTop = 24;
      fireEvent.scroll(scroller);
    });
    await flushAnimationFrame();

    expect(
      (NavItem as jest.Mock).mock.calls.slice(-5).every(([props]) => {
        return props.variant === "floating" && props.compact === false;
      })
    ).toBe(true);

    scroller.remove();
  });

  it("resets floating dock compact state when the route view changes", async () => {
    Object.defineProperty(globalThis, "scrollY", {
      configurable: true,
      value: 0,
      writable: true,
    });

    const { rerender } = render(<BottomNavigation />);

    act(() => {
      globalThis.scrollY = 24;
      fireEvent.scroll(globalThis);
    });

    await waitFor(() => {
      expect(
        (NavItem as jest.Mock).mock.calls.slice(-5).every(([props]) => {
          return props.variant === "floating" && props.compact === true;
        })
      ).toBe(true);
    });

    (usePathname as jest.Mock).mockReturnValue("/discover");
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("view=network")
    );

    rerender(<BottomNavigation />);

    await waitFor(() => {
      expect(
        (NavItem as jest.Mock).mock.calls.slice(-5).every(([props]) => {
          return props.variant === "floating" && props.compact === false;
        })
      ).toBe(true);
    });
  });

  it("reschedules compacting after hidden cleanup cancels a pending frame", async () => {
    Object.defineProperty(globalThis, "scrollY", {
      configurable: true,
      value: 0,
      writable: true,
    });

    const { rerender } = render(<BottomNavigation />);

    act(() => {
      globalThis.scrollY = 24;
      fireEvent.scroll(globalThis);
    });

    rerender(<BottomNavigation hidden />);
    rerender(<BottomNavigation />);

    act(() => {
      globalThis.scrollY = 48;
      fireEvent.scroll(globalThis);
    });

    await waitFor(() => {
      expect(
        (NavItem as jest.Mock).mock.calls.slice(-5).every(([props]) => {
          return props.variant === "floating" && props.compact === true;
        })
      ).toBe(true);
    });
  });
});
