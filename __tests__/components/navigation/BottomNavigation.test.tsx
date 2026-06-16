import { act, fireEvent, render, waitFor } from "@testing-library/react";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import NavItem from "@/components/navigation/NavItem";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";
import { getNotificationsRoute } from "@/helpers/navigation.helpers";

jest.mock("@/components/navigation/NavItem", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="nav-item" />),
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
(useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });
(useWaveData as jest.Mock).mockReturnValue({ data: null });
(useWave as jest.Mock).mockReturnValue({ isDm: false });

const { usePathname, useSearchParams } = require("next/navigation");
(usePathname as jest.Mock).mockReturnValue("/");
(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

beforeEach(() => {
  jest.clearAllMocks();
  let animationFrameId = 0;
  jest
    .spyOn(globalThis, "requestAnimationFrame")
    .mockImplementation((callback: FrameRequestCallback) => {
      const frameId = ++animationFrameId;
      setTimeout(() => callback(0), 0);
      return frameId;
    });
  jest.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => {});
  (useLayout as jest.Mock).mockReturnValue({ registerRef });
  (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });
  (useWaveData as jest.Mock).mockReturnValue({ data: null });
  (useWave as jest.Mock).mockReturnValue({ isDm: false });
  (usePathname as jest.Mock).mockReturnValue("/");
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
});

afterEach(() => {
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

  it("uses the original fixed dock on brain routes", () => {
    (usePathname as jest.Mock).mockReturnValue("/notifications");

    const { container } = render(<BottomNavigation />);

    expect(container.querySelector("nav")).toHaveClass("tw-h-[85px]");
    expect(
      (NavItem as jest.Mock).mock.calls.every(([props]) => {
        return props.variant === "fixed" && props.compact === undefined;
      })
    ).toBe(true);
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
});
