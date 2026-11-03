import { act, useLayoutEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { useSidebarController } from "@/hooks/useSidebarController";

const readySnapshots = jest.fn();

function Sidebar() {
  const { isCollapsed, isOffcanvasMode, isSidebarReady, toggleCollapsed } =
    useSidebarController();
  useLayoutEffect(() => {
    if (isSidebarReady) readySnapshots(isCollapsed, isOffcanvasMode);
  }, [isCollapsed, isOffcanvasMode, isSidebarReady]);
  return (
    <nav data-sidebar-ready={isSidebarReady}>
      <a href="/about">About</a>
      <output>{`${isCollapsed}:${isOffcanvasMode}`}</output>
      <button onClick={toggleCollapsed}>Toggle</button>
    </nav>
  );
}

afterEach(() => sessionStorage.clear());

it.each([
  [1440, "false", false, false],
  [1440, "true", true, false],
  [900, "false", true, true],
  [390, "true", true, true],
  [1440, "invalid", true, false],
] as const)(
  "hydrates width=%s stored=%s then restores sidebar state",
  async (width, stored, collapsed, offcanvas) => {
    readySnapshots.mockClear();
    sessionStorage.setItem("sidebarCollapsed", stored);
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
    window.matchMedia = jest.fn((query) => {
      const maxWidth = /max-width: ([\d.]+)px/.exec(query)?.[1];
      return {
        matches: maxWidth ? width <= Number(maxWidth) : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    });
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Sidebar />);
    document.body.appendChild(container);
    const link = container.querySelector("a");
    expect(container.querySelector("output")?.textContent).toBe("true:false");
    expect(container.querySelector("nav")).toHaveAttribute(
      "data-sidebar-ready",
      "false"
    );
    const onRecoverableError = jest.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <Sidebar />, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.querySelector("nav")).toHaveAttribute(
        "data-sidebar-ready",
        "true"
      );
      expect(readySnapshots.mock.calls).toEqual([[collapsed, offcanvas]]);
      expect(container.querySelector("a")).toBe(link);
      expect(container.querySelector("output")?.textContent).toBe(
        `${collapsed}:${offcanvas}`
      );
      expect(sessionStorage.getItem("sidebarCollapsed")).toBe(stored);
      await act(async () => container.querySelector("button")?.click());
      expect(container.querySelector("output")?.textContent).toBe(
        `${!collapsed}:${offcanvas}`
      );
      expect(sessionStorage.getItem("sidebarCollapsed")).toBe(
        offcanvas ? stored : JSON.stringify(!collapsed)
      );
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  }
);
