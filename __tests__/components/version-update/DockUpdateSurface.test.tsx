import { act, render, screen } from "@testing-library/react";
import DockUpdateSurface from "@/components/version-update/DockUpdateSurface";

it("keeps the combined surface aligned as the dock and rocket change size", () => {
  let compact = false;
  let notifyResize: ResizeObserverCallback | undefined;
  const disconnect = jest.fn();
  const originalObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = jest.fn((callback: ResizeObserverCallback) => {
    notifyResize = callback;
    return { observe: jest.fn(), unobserve: jest.fn(), disconnect };
  }) as unknown as typeof ResizeObserver;
  const computedStyle = jest
    .spyOn(window, "getComputedStyle")
    .mockImplementation((element) => (element as HTMLElement).style);
  const bounds = jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: HTMLElement) {
      const bubble = this.hasAttribute("data-version-update-dock");
      const width = bubble ? (compact ? 91.52 : 104) : compact ? 302 : 354;
      const height = bubble ? (compact ? 31.68 : 36) : compact ? 54 : 64;
      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        width,
        height,
        toJSON: () => ({}),
      };
    });
  try {
    const view = render(
      <div data-testid="dock" style={{ borderTopLeftRadius: "32px" }}>
        <DockUpdateSurface dockClassName="native-dock" />
        <div data-version-update-dock="expanded" />
      </div>
    );
    const surface = screen
      .getByTestId("dock")
      .querySelector("[data-dock-update-surface]");
    expect(surface).toHaveStyle({
      width: "354px",
      height: "100px",
      top: "-37px",
    });
    compact = true;
    act(() => notifyResize?.([], {} as ResizeObserver));
    expect(surface).toHaveStyle({
      width: "302px",
      height: "85.68px",
      top: "-32.68px",
    });
    view.unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  } finally {
    computedStyle.mockRestore();
    bounds.mockRestore();
    globalThis.ResizeObserver = originalObserver;
  }
});
