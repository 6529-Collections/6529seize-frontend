import { readFileSync } from "node:fs";
import path from "node:path";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopTitleStrip from "@/components/header/titlebar/DesktopTitleStrip";

type Listener = (event: unknown, payload?: unknown) => void;

const css = readFileSync(
  path.join(
    process.cwd(),
    "components/header/titlebar/DesktopTitleStrip.module.css"
  ),
  "utf8"
);

const createBridges = (
  navigation = { canGoBack: true, canGoForward: false }
) => {
  const navListeners = new Set<Listener>();
  const updateListeners = new Set<Listener>();
  return {
    navListeners,
    updateListeners,
    navigation,
    api: {
      openExternal: jest.fn(),
      getInfo: jest
        .fn()
        .mockResolvedValue({ app_version: "1.2.3", environment: "local" }),
      goBack: jest.fn(),
      goForward: jest.fn(),
      getNavigationState: jest.fn(() => Promise.resolve(navigation)),
      onNavigationStateChange: jest.fn((listener: Listener) =>
        navListeners.add(listener)
      ),
      offNavigationStateChange: jest.fn((listener: Listener) =>
        navListeners.delete(listener)
      ),
    },
    updater: {
      checkUpdates: jest.fn(),
      onUpdateAvailable: jest.fn((listener: Listener) =>
        updateListeners.add(listener)
      ),
      offUpdateAvailable: jest.fn((listener: Listener) =>
        updateListeners.delete(listener)
      ),
      onUpdateNotAvailable: jest.fn(),
      offUpdateNotAvailable: jest.fn(),
    },
  };
};

let bridges: ReturnType<typeof createBridges>;

const installDesktopShell = () => {
  Object.defineProperty(window, "api", {
    configurable: true,
    value: bridges.api,
  });
  Object.defineProperty(window, "nativeAuth", {
    configurable: true,
    value: { sessionLogin: jest.fn() },
  });
  Object.defineProperty(window, "updater", {
    configurable: true,
    value: bridges.updater,
  });
};

describe("DesktopTitleStrip", () => {
  beforeEach(() => {
    bridges = createBridges();
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
    Reflect.deleteProperty(window, "updater");
  });

  describe("styles", () => {
    it("is hidden by default and shown only for the host's overlay title bar", () => {
      expect(css).toMatch(/\.strip\s*\{[^}]*display:\s*none;/);
      expect(css).toMatch(
        /:root\[data-desktop-titlebar="overlay"\]\s+\.strip\s*\{\s*display:\s*flex;/
      );
    });

    it("is sized by the host and keeps clear of its window controls", () => {
      expect(css).toContain("height: var(--desktop-titlebar-height");
      expect(css).toContain("var(--desktop-titlebar-inset-right, 0px)");
      expect(css).toContain("var(--desktop-titlebar-inset-left, 0px)");
      expect(css).toContain("var(--desktop-titlebar-background");
      expect(css).toMatch(/\.strip\s*\{[^}]*-webkit-app-region:\s*drag;/);
      expect(css).toMatch(/button[^{]*\{\s*-webkit-app-region:\s*no-drag;/);
    });
  });

  it("renders the strip on the web without touching any bridge", () => {
    render(<DesktopTitleStrip />);

    expect(
      screen.getByRole("group", { name: "6529 Desktop window title" })
    ).toHaveAttribute("data-desktop-drag-region", "");
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Forward" })).toBeDisabled();
    expect(bridges.api.getInfo).not.toHaveBeenCalled();
  });

  it("offers accessible back and forward controls driven by the app's history", async () => {
    const user = userEvent.setup();
    installDesktopShell();
    render(<DesktopTitleStrip />);

    const back = screen.getByRole("button", { name: "Back" });
    const forward = screen.getByRole("button", { name: "Forward" });
    expect(await screen.findByText("1.2.3 local")).toBeInTheDocument();
    expect(back).toBeEnabled();
    expect(forward).toBeDisabled();
    expect(back).toHaveAttribute("title", "Back");

    await user.click(back);
    expect(bridges.api.goBack).toHaveBeenCalledTimes(1);

    const readsBefore = bridges.api.getNavigationState.mock.calls.length;
    bridges.navigation.canGoForward = true;
    await act(async () => {
      for (const listener of bridges.navListeners) listener({});
    });
    // The strip re-reads the history on each change event.
    expect(bridges.api.getNavigationState.mock.calls.length).toBe(
      readsBefore + 1
    );
    expect(forward).toBeEnabled();
    await user.click(forward);
    expect(bridges.api.goForward).toHaveBeenCalledTimes(1);

    // Keyboard: the controls are in the tab order.
    back.focus();
    await user.tab();
    expect(forward).toHaveFocus();
  });

  it("draws no window buttons", async () => {
    installDesktopShell();
    render(<DesktopTitleStrip />);
    await screen.findByText("1.2.3 local");

    expect(
      screen.queryByRole("button", { name: /close|minimi|maximi|restore/i })
    ).not.toBeInTheDocument();
  });

  it("names the info button for an available update and opens app info", async () => {
    const user = userEvent.setup();
    installDesktopShell();
    render(<DesktopTitleStrip />);

    act(() => {
      for (const listener of bridges.updateListeners) {
        listener({}, { version: "1.3.0" });
      }
    });
    await user.click(
      screen.getByRole("button", { name: "App info (update available)" })
    );

    expect(await screen.findByText("About 6529 Desktop")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Check for updates" }));
    expect(bridges.updater.checkUpdates).toHaveBeenCalledTimes(1);
  });

  it("shares one history subscription and starts fresh after unmount", async () => {
    installDesktopShell();
    const first = render(<DesktopTitleStrip />);
    const second = render(<DesktopTitleStrip />);
    await screen.findAllByText("1.2.3 local");

    expect(bridges.navListeners.size).toBe(1);
    first.unmount();
    expect(bridges.navListeners.size).toBe(1);
    second.unmount();
    expect(bridges.navListeners.size).toBe(0);
    expect(bridges.updateListeners.size).toBe(0);
  });

  it("labels the version for screen readers", async () => {
    installDesktopShell();
    render(<DesktopTitleStrip />);

    expect(await screen.findByText("1.2.3 local")).toHaveTextContent(
      "Version 1.2.3 local"
    );
  });
});
