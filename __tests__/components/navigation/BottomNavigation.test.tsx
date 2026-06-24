import { act, fireEvent, render, waitFor } from "@testing-library/react";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import NavItem from "@/components/navigation/NavItem";
import { useAuth } from "@/components/auth/Auth";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";
import { getNotificationsRoute } from "@/helpers/navigation.helpers";

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

const flushAnimationFrame = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const createRect = ({
  left,
  width,
}: {
  readonly left: number;
  readonly width: number;
}): DOMRect =>
  ({
    bottom: 64,
    height: 64,
    left,
    right: left + width,
    top: 0,
    width,
    x: left,
    y: 0,
    toJSON: () => ({}),
  }) as DOMRect;

const mockFloatingDockGeometry = () => {
  const innerLeft = 40;
  const itemWidth = 88;
  const itemLefts = Array.from(
    { length: 7 },
    (_unused, index) => 52 + index * 96
  );

  jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function getBoundingClientRect() {
      const element = this as HTMLElement;
      if (element.getAttribute("data-testid") === "mobile-dock-inner") {
        return createRect({ left: innerLeft, width: 704 });
      }

      const itemIndex = element.getAttribute("data-mobile-dock-item-index");
      if (itemIndex !== null) {
        return createRect({
          left: itemLefts[Number(itemIndex)] ?? 0,
          width: itemWidth,
        });
      }

      return createRect({ left: 0, width: 0 });
    });

  return {
    getExpectedMeasuredLeft: (index: number) =>
      itemLefts[index]! - innerLeft + itemWidth / 2,
  };
};

const createScrollableElement = () => {
  const element = document.createElement("div");
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
    expect(navItemCalls).toHaveLength(7);

    const passedItems = navItemCalls.map((call) => call[0].item);
    expect(passedItems.map((item: { name: string }) => item.name)).toEqual([
      "Discovery",
      "Waves",
      "Messages",
      "Home",
      "Network",
      "Collections",
      "Notifications",
    ]);

    const notificationsItem = passedItems.find(
      (item: { name: string }) => item.name === "Notifications"
    );
    expect(notificationsItem?.href).toBe(getNotificationsRoute(false));
    expect(navItemCalls.every((call) => call[0].variant === "floating")).toBe(
      true
    );
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
      (NavItem as jest.Mock).mock.calls.every(([props]) => {
        return props.variant === "floating" && props.compact === false;
      })
    ).toBe(true);
  });

  it("keeps one active pill mounted while moving it between active items", () => {
    const { getExpectedMeasuredLeft } = mockFloatingDockGeometry();
    const { getByTestId, rerender } = render(<BottomNavigation />);
    const activePill = getByTestId("mobile-dock-active-pill");

    expect(activePill.getAttribute("style")).toContain(
      `left: ${getExpectedMeasuredLeft(3)}px`
    );
    expect(activePill).toHaveClass("tw-transition-[left,width,height,opacity]");

    (usePathname as jest.Mock).mockReturnValue("/notifications");
    rerender(<BottomNavigation />);

    const movedActivePill = getByTestId("mobile-dock-active-pill");
    expect(movedActivePill).toBe(activePill);
    expect(movedActivePill.getAttribute("style")).toContain(
      `left: ${getExpectedMeasuredLeft(6)}px`
    );
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

    render(<BottomNavigation />);

    act(() => {
      globalThis.scrollY = 24;
      fireEvent.scroll(globalThis);
    });

    await waitFor(() => {
      expect(
        (NavItem as jest.Mock).mock.calls.slice(-7).every(([props]) => {
          return props.variant === "floating" && props.compact === true;
        })
      ).toBe(true);
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
        (NavItem as jest.Mock).mock.calls.slice(-7).every(([props]) => {
          return props.variant === "floating" && props.compact === true;
        })
      ).toBe(true);
    });
  });

  it("compacts from nested scroll containers", async () => {
    const scroller = createScrollableElement();
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
        (NavItem as jest.Mock).mock.calls.slice(-7).every(([props]) => {
          return props.variant === "floating" && props.compact === true;
        })
      ).toBe(true);
    });

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
        (NavItem as jest.Mock).mock.calls.slice(-7).every(([props]) => {
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
        (NavItem as jest.Mock).mock.calls.slice(-7).every(([props]) => {
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
        (NavItem as jest.Mock).mock.calls.slice(-7).every(([props]) => {
          return props.variant === "floating" && props.compact === true;
        })
      ).toBe(true);
    });
  });
});
