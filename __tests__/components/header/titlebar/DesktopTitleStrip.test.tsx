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

const tabStops = () =>
  screen
    .getAllByRole("button")
    .filter(
      (button) =>
        button.closest("[role=toolbar]") !== null && button.tabIndex === 0
    );

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

    const toolbar = screen.getByRole("toolbar", {
      name: "6529 Desktop window title",
    });
    expect(toolbar).toHaveAttribute("data-desktop-drag-region", "");
    expect(toolbar).toHaveAttribute("aria-orientation", "horizontal");
    expect(screen.getByRole("button", { name: "Back" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(screen.getByRole("button", { name: "Forward" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    // One tab stop, on the only available item.
    expect(tabStops()).toEqual([
      screen.getByRole("button", { name: "App info" }),
    ]);
    expect(bridges.api.getInfo).not.toHaveBeenCalled();
    expect(bridges.api.getNavigationState).not.toHaveBeenCalled();
  });

  it("leaves arrow keys on the rest of the page alone", async () => {
    const user = userEvent.setup();
    render(
      <>
        <DesktopTitleStrip />
        <input aria-label="Page field" />
      </>
    );
    const field = screen.getByRole("textbox", { name: "Page field" });
    await user.type(field, "ab{ArrowLeft}c{Home}d{End}e");

    expect(field).toHaveFocus();
    expect(field).toHaveValue("dacbe");
  });

  it("offers accessible back and forward controls driven by the app's history", async () => {
    const user = userEvent.setup();
    installDesktopShell();
    render(<DesktopTitleStrip />);

    const back = screen.getByRole("button", { name: "Back" });
    const forward = screen.getByRole("button", { name: "Forward" });
    expect(await screen.findByText("1.2.3 local")).toBeInTheDocument();
    expect(back).not.toHaveAttribute("aria-disabled");
    expect(forward).toHaveAttribute("aria-disabled", "true");

    // An unavailable button ignores clicks.
    await user.click(forward);
    expect(bridges.api.goForward).not.toHaveBeenCalled();
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
    expect(forward).not.toHaveAttribute("aria-disabled");
    await user.click(forward);
    expect(bridges.api.goForward).toHaveBeenCalledTimes(1);
  });

  describe("toolbar keyboard", () => {
    const renderReady = async (
      navigation = { canGoBack: true, canGoForward: true }
    ) => {
      bridges = createBridges(navigation);
      installDesktopShell();
      render(
        <>
          <button type="button">Before</button>
          <DesktopTitleStrip />
          <button type="button">After</button>
        </>
      );
      await screen.findByText("1.2.3 local");
      return {
        back: screen.getByRole("button", { name: "Back" }),
        forward: screen.getByRole("button", { name: "Forward" }),
        info: screen.getByRole("button", { name: "App info" }),
      };
    };

    it("is a single tab stop that remembers the last focused item", async () => {
      const user = userEvent.setup();
      const { back, forward } = await renderReady();
      expect(tabStops()).toEqual([back]);

      screen.getByRole("button", { name: "Before" }).focus();
      await user.tab();
      expect(back).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();

      back.focus();
      await user.keyboard("{ArrowRight}");
      expect(forward).toHaveFocus();
      expect(tabStops()).toEqual([forward]);
      await user.tab({ shift: true });
      await user.tab();
      expect(forward).toHaveFocus();
    });

    it("moves with Left/Right (wrapping) and Home/End", async () => {
      const user = userEvent.setup();
      const { back, forward, info } = await renderReady();
      back.focus();

      await user.keyboard("{ArrowRight}");
      expect(forward).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(info).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(back).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(info).toHaveFocus();
      await user.keyboard("{Home}");
      expect(back).toHaveFocus();
      await user.keyboard("{End}");
      expect(info).toHaveFocus();
    });

    it("skips unavailable buttons but keeps them discoverable", async () => {
      const user = userEvent.setup();
      const { back, forward, info } = await renderReady({
        canGoBack: true,
        canGoForward: false,
      });
      back.focus();

      await user.keyboard("{ArrowRight}");
      expect(info).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(back).toHaveFocus();
      // Still in the accessibility tree, announced as unavailable.
      expect(forward).toHaveAttribute("aria-disabled", "true");
      expect(forward).toHaveAccessibleName("Forward");
    });

    it("moves the tab stop off a button that becomes unavailable", async () => {
      const { back, info } = await renderReady({
        canGoBack: true,
        canGoForward: false,
      });
      expect(tabStops()).toEqual([back]);

      bridges.navigation.canGoBack = false;
      await act(async () => {
        for (const listener of bridges.navListeners) listener({});
      });

      expect(tabStops()).toEqual([info]);
    });

    it("leaves arrow keys alone inside the app-info dialog", async () => {
      const user = userEvent.setup();
      const { info } = await renderReady();
      await user.click(info);
      const check = await screen.findByRole("button", {
        name: "Check for updates",
      });
      check.focus();

      await user.keyboard("{ArrowLeft}{Home}");

      expect(check).toHaveFocus();
    });
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
