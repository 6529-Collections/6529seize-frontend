import { act, fireEvent, render, waitFor } from "@testing-library/react";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import NavItem from "@/components/navigation/NavItem";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";
import { getNotificationsRoute } from "@/helpers/navigation.helpers";
import {
  MOBILE_DOCK_SCROLL_SOURCE_CHANGE_EVENT,
  MOBILE_DOCK_SCROLL_SOURCE_DATASET_KEY,
  MOBILE_DOCK_SCROLL_SOURCE_NAME,
  MOBILE_DOCK_SCROLL_SOURCE_SELECTOR,
} from "@/constants/mobile-dock.constants";

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
  document
    .querySelectorAll(MOBILE_DOCK_SCROLL_SOURCE_SELECTOR)
    .forEach((element) => element.remove());
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

  it("rebinds to replacement notifications scroll sources", async () => {
    (usePathname as jest.Mock).mockReturnValue("/notifications");

    const firstScrollSource = document.createElement("div");
    firstScrollSource.dataset[MOBILE_DOCK_SCROLL_SOURCE_DATASET_KEY] =
      MOBILE_DOCK_SCROLL_SOURCE_NAME;
    Object.defineProperty(firstScrollSource, "scrollTop", {
      value: 0,
      writable: true,
    });
    document.body.appendChild(firstScrollSource);

    render(<BottomNavigation />);

    act(() => {
      firstScrollSource.scrollTop = -20;
      fireEvent.scroll(firstScrollSource);
    });

    await waitFor(() => {
      expect(
        (NavItem as jest.Mock).mock.calls.slice(-7).every(([props]) => {
          return props.compact === true;
        })
      ).toBe(true);
    });

    const secondScrollSource = document.createElement("div");
    secondScrollSource.dataset[MOBILE_DOCK_SCROLL_SOURCE_DATASET_KEY] =
      MOBILE_DOCK_SCROLL_SOURCE_NAME;
    Object.defineProperty(secondScrollSource, "scrollTop", {
      value: 0,
      writable: true,
    });
    const secondScrollSourceAddListenerSpy = jest.spyOn(
      secondScrollSource,
      "addEventListener"
    );

    act(() => {
      firstScrollSource.remove();
      globalThis.dispatchEvent(
        new CustomEvent(MOBILE_DOCK_SCROLL_SOURCE_CHANGE_EVENT)
      );
      document.body.appendChild(secondScrollSource);
      globalThis.dispatchEvent(
        new CustomEvent(MOBILE_DOCK_SCROLL_SOURCE_CHANGE_EVENT)
      );
    });

    await waitFor(() => {
      expect(secondScrollSourceAddListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
        { passive: true }
      );
    });

    act(() => {
      secondScrollSource.scrollTop = 20;
      fireEvent.scroll(secondScrollSource);
    });

    await waitFor(() => {
      expect(
        (NavItem as jest.Mock).mock.calls.slice(-7).every(([props]) => {
          return props.compact === false;
        })
      ).toBe(true);
    });

    act(() => {
      secondScrollSource.scrollTop = -20;
      fireEvent.scroll(secondScrollSource);
    });

    await waitFor(() => {
      expect(
        (NavItem as jest.Mock).mock.calls.slice(-7).every(([props]) => {
          return props.compact === true;
        })
      ).toBe(true);
    });

    act(() => {
      secondScrollSource.remove();
      globalThis.dispatchEvent(
        new CustomEvent(MOBILE_DOCK_SCROLL_SOURCE_CHANGE_EVENT)
      );
    });

    await waitFor(() => {
      expect(
        (NavItem as jest.Mock).mock.calls.slice(-7).every(([props]) => {
          return props.compact === false;
        })
      ).toBe(true);
    });
  });
});
