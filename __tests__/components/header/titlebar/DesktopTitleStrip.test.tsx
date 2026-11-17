import { readFileSync } from "node:fs";
import path from "node:path";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopTitleStrip from "@/components/header/titlebar/DesktopTitleStrip";

const globalRefresh = jest.fn();
jest.mock("@/contexts/RefreshContext", () => ({
  useGlobalRefresh: () => ({ globalRefresh, refreshKey: 0 }),
}));

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
  const noUpdateListeners = new Set<Listener>();
  const updateErrorListeners = new Set<Listener>();
  return {
    navListeners,
    updateListeners,
    noUpdateListeners,
    updateErrorListeners,
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
      onUpdateNotAvailable: jest.fn((listener: Listener) =>
        noUpdateListeners.add(listener)
      ),
      offUpdateNotAvailable: jest.fn((listener: Listener) =>
        noUpdateListeners.delete(listener)
      ),
      onUpdateError: jest.fn((listener: Listener) =>
        updateErrorListeners.add(listener)
      ),
      offUpdateError: jest.fn((listener: Listener) =>
        updateErrorListeners.delete(listener)
      ),
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
    // One tab stop, on the first available item.
    expect(tabStops()).toEqual([
      screen.getByRole("button", { name: "Refresh" }),
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
        refresh: screen.getByRole("button", { name: "Refresh" }),
        copy: screen.getByRole("button", { name: "Copy link" }),
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
      const { back, forward, refresh, copy, info } = await renderReady();
      back.focus();

      await user.keyboard("{ArrowRight}");
      expect(forward).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(refresh).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(copy).toHaveFocus();
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
      const { back, forward, refresh } = await renderReady({
        canGoBack: true,
        canGoForward: false,
      });
      back.focus();

      await user.keyboard("{ArrowRight}");
      expect(refresh).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(back).toHaveFocus();
      // Still in the accessibility tree, announced as unavailable.
      expect(forward).toHaveAttribute("aria-disabled", "true");
      expect(forward).toHaveAccessibleName("Forward");
    });

    it("moves the tab stop off a button that becomes unavailable", async () => {
      const { back, refresh } = await renderReady({
        canGoBack: true,
        canGoForward: false,
      });
      expect(tabStops()).toEqual([back]);

      bridges.navigation.canGoBack = false;
      await act(async () => {
        for (const listener of bridges.navListeners) listener({});
      });

      expect(tabStops()).toEqual([refresh]);
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
    const check = screen.getByRole("button", { name: "Check for updates" });
    await user.click(check);
    expect(bridges.updater.checkUpdates).toHaveBeenCalledTimes(1);
    act(() => {
      for (const listener of bridges.updateListeners) {
        listener({}, { version: "1.3.0" });
      }
    });
    expect(
      await screen.findByText("A new version of 6529 Desktop is available.")
    ).toBeVisible();
  });

  it("shows a manual update check and its result, then allows a retry", async () => {
    const user = userEvent.setup();
    installDesktopShell();
    render(<DesktopTitleStrip />);
    await user.click(screen.getByRole("button", { name: "App info" }));
    const check = await screen.findByRole("button", {
      name: "Check for updates",
    });

    act(() => {
      for (const listener of bridges.noUpdateListeners) listener({});
    });
    expect(screen.queryByText("No updates found.")).not.toBeInTheDocument();

    bridges.updater.checkUpdates.mockImplementationOnce(() => {
      for (const listener of bridges.noUpdateListeners) listener({});
    });
    await user.click(check);
    expect(screen.getByText("Checking for updates…")).toBeVisible();
    expect(check).toHaveAttribute("aria-disabled", "true");
    await user.click(check);
    expect(bridges.updater.checkUpdates).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("No updates found.")).toBeVisible();
    expect(check).toHaveFocus();
    expect(check).not.toHaveAttribute("aria-disabled");

    await user.click(check);
    act(() => {
      for (const listener of bridges.updateErrorListeners) listener({});
    });
    expect(
      await screen.findByText("Couldn’t check for updates. Try again.")
    ).toBeVisible();
    expect(bridges.updater.checkUpdates).toHaveBeenCalledTimes(2);
    expect(check).not.toHaveAttribute("aria-disabled");
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

    const version = await screen.findByText("1.2.3 local");
    expect(version.parentElement).toHaveTextContent("Version 1.2.3 local");
  });

  it("fades the reported version in when the host did not draw it", async () => {
    installDesktopShell();
    render(<DesktopTitleStrip />);

    expect(await screen.findByText("1.2.3 local")).toHaveClass("versionText");
    expect(css).toMatch(
      /prefers-reduced-motion: no-preference[^@]*\.versionText\s*\{\s*animation:/
    );
  });

  it("keeps the version the host drew before first paint", async () => {
    // jsdom does not compute custom properties; the host sets this one.
    const realGetComputedStyle = window.getComputedStyle;
    const computed = jest
      .spyOn(window, "getComputedStyle")
      .mockImplementation((element, pseudo) => {
        const style = realGetComputedStyle(element, pseudo);
        if (element !== document.documentElement) return style;
        return {
          ...style,
          getPropertyValue: (name: string) =>
            name === "--desktop-app-version"
              ? '"1.2.3 local"'
              : style.getPropertyValue(name),
        } as CSSStyleDeclaration;
      });
    try {
      installDesktopShell();
      const { container } = render(<DesktopTitleStrip />);
      await waitFor(() => expect(bridges.api.getInfo).toHaveBeenCalled());
      await act(async () => undefined);

      // No second copy appears (or fades in) once the app reports it.
      expect(screen.queryByText("1.2.3 local")).not.toBeInTheDocument();
      expect(container.querySelector(".hostVersion")).not.toBeNull();
      expect(css).toMatch(
        /\.hostVersion::after\s*\{\s*content:\s*var\(--desktop-app-version, ""\);/
      );
    } finally {
      computed.mockRestore();
    }
  });

  it("ignores an older history read that finishes after a newer one", async () => {
    installDesktopShell();
    const reads: Array<(state: unknown) => void> = [];
    bridges.api.getNavigationState.mockImplementation(
      () => new Promise((resolve) => reads.push(resolve)) as never
    );
    render(<DesktopTitleStrip />);
    // A change event starts a second read while the first is pending.
    act(() => {
      for (const listener of bridges.navListeners) listener({});
    });
    expect(reads).toHaveLength(2);

    await act(async () => {
      reads[1]?.({ canGoBack: false, canGoForward: true });
    });
    await act(async () => {
      reads[0]?.({ canGoBack: true, canGoForward: false });
    });

    expect(screen.getByRole("button", { name: "Back" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(screen.getByRole("button", { name: "Forward" })).not.toHaveAttribute(
      "aria-disabled"
    );
  });

  it("refreshes the page content", async () => {
    const user = userEvent.setup();
    installDesktopShell();
    render(<DesktopTitleStrip />);

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    expect(globalRefresh).toHaveBeenCalledTimes(1);
  });

  describe("copy link", () => {
    const writeText = jest.fn();
    // After userEvent.setup(), which installs its own clipboard.
    const setupWithClipboard = () => {
      const user = userEvent.setup();
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
      return user;
    };

    beforeEach(() => {
      writeText.mockReset();
      window.history.replaceState({}, "", "/waves/abc?reload=true&tab=1#drop");
    });

    afterEach(() => {
      Reflect.deleteProperty(navigator, "clipboard");
      window.history.replaceState({}, "", "/");
    });

    it("copies the page's public link, not the local server's", async () => {
      const user = setupWithClipboard();
      writeText.mockResolvedValue(undefined);
      installDesktopShell();
      render(<DesktopTitleStrip />);

      await user.click(screen.getByRole("button", { name: "Copy link" }));

      expect(writeText).toHaveBeenCalledWith(
        "https://test.6529.io/waves/abc?tab=1#drop"
      );
      expect(
        await screen.findByRole("button", { name: "Link copied" })
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Link copied");
    });

    it("says when the link could not be copied", async () => {
      const user = setupWithClipboard();
      writeText.mockRejectedValue(new Error("denied"));
      installDesktopShell();
      render(<DesktopTitleStrip />);

      await user.click(screen.getByRole("button", { name: "Copy link" }));

      expect(
        await screen.findByRole("button", { name: "Could not copy the link" })
      ).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(
        "Could not copy the link"
      );
    });
  });
});
