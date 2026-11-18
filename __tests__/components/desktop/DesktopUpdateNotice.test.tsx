import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopUpdateNotice from "@/components/desktop/DesktopUpdateNotice";

type Listener = (event: unknown, payload?: unknown) => void;

const createUpdater = () => {
  const listeners: Record<string, Set<Listener>> = {};
  const on = (name: string) =>
    jest.fn((listener: Listener) => {
      listeners[name] ??= new Set();
      listeners[name].add(listener);
    });
  const off = (name: string) =>
    jest.fn((listener: Listener) => {
      listeners[name]?.delete(listener);
    });
  return {
    listeners,
    emit: (name: string, payload?: unknown) => {
      act(() => {
        for (const listener of listeners[name] ?? []) listener({}, payload);
      });
    },
    checkUpdates: jest.fn(),
    downloadUpdate: jest.fn(),
    installUpdate: jest.fn(),
    onUpdateAvailable: on("available"),
    offUpdateAvailable: off("available"),
    onUpdateNotAvailable: on("not-available"),
    offUpdateNotAvailable: off("not-available"),
    onUpdateProgress: on("progress"),
    offUpdateProgress: off("progress"),
    onUpdateDownloaded: on("downloaded"),
    offUpdateDownloaded: off("downloaded"),
    onUpdateError: on("error"),
    offUpdateError: off("error"),
  };
};

let updater: ReturnType<typeof createUpdater>;
const openExternal = jest.fn();

/**
 * The older 6529 Desktop reports no `supportsInAppUpdates` (it downloads
 * and installs updates itself); the new app reports it as false.
 */
const installDesktopShell = (info: Record<string, unknown> = {}) => {
  Object.defineProperty(window, "api", {
    configurable: true,
    value: { openExternal, getInfo: jest.fn(async () => info) },
  });
  Object.defineProperty(window, "nativeAuth", {
    configurable: true,
    value: { sessionLogin: jest.fn() },
  });
  Object.defineProperty(window, "updater", {
    configurable: true,
    value: updater,
  });
};

describe("DesktopUpdateNotice", () => {
  beforeEach(() => {
    updater = createUpdater();
    openExternal.mockReset();
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
    Reflect.deleteProperty(window, "updater");
  });

  it("renders nothing and checks nothing in a browser", () => {
    const { container } = render(<DesktopUpdateNotice />);

    expect(container).toBeEmptyDOMElement();
    expect(updater.checkUpdates).not.toHaveBeenCalled();
  });

  it("stays silent when the updater reports no update", () => {
    installDesktopShell();
    const { container } = render(<DesktopUpdateNotice />);

    expect(updater.checkUpdates).toHaveBeenCalledTimes(1);
    updater.emit("not-available", { version: "1.0.0" });
    updater.emit("error", { message: "offline" });

    expect(container).toBeEmptyDOMElement();
  });

  it("offers, downloads and installs a reported update", async () => {
    const user = userEvent.setup();
    installDesktopShell();
    render(<DesktopUpdateNotice />);

    updater.emit("available", { version: "2.1.0" });
    expect(
      screen.getByText("6529 Desktop 2.1.0 is available.")
    ).toBeInTheDocument();

    await user.click(
      await screen.findByRole("button", { name: "Download update" })
    );
    expect(updater.downloadUpdate).toHaveBeenCalledTimes(1);
    // The focused button is gone; focus moves to the announced progress.
    const progress = screen.getByText("Downloading the update…");
    expect(progress).toHaveFocus();
    expect(progress).toHaveAttribute("aria-live", "polite");

    updater.emit("progress", { percent: 42.4 });
    expect(screen.getByText("Downloading the update… 42%")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    updater.emit("downloaded", {});
    await user.click(screen.getByRole("button", { name: "Restart to update" }));
    expect(updater.installUpdate).toHaveBeenCalledTimes(1);
  });

  it("announces a failed download and lets the user retry", async () => {
    const user = userEvent.setup();
    installDesktopShell();
    render(<DesktopUpdateNotice />);
    updater.emit("available", { version: "2.1.0" });
    await user.click(
      await screen.findByRole("button", { name: "Download update" })
    );

    updater.emit("error", { message: "disk full" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The update could not be downloaded."
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(updater.downloadUpdate).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      "throws",
      () => {
        throw new Error("updater busy");
      },
    ],
    ["returns a rejected promise", () => Promise.reject(new Error("offline"))],
  ])(
    "shows the failure when starting the download %s",
    async (_name, implementation) => {
      const user = userEvent.setup();
      installDesktopShell();
      updater.downloadUpdate.mockImplementation(implementation);
      render(<DesktopUpdateNotice />);
      updater.emit("available", { version: "2.1.0" });

      await user.click(
        await screen.findByRole("button", { name: "Download update" })
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "The update could not be downloaded."
      );
      expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    }
  );

  describe("in the new app, which does not download updates itself", () => {
    const NEW_APP = { supportsInAppUpdates: false };

    it("opens the reported download page and never asks to download", async () => {
      const user = userEvent.setup();
      installDesktopShell(NEW_APP);
      render(<DesktopUpdateNotice />);
      updater.emit("available", {
        version: "0.1.0-rc.3",
        downloadPage: "https://6529.io/desktop?from=app",
      });

      await user.click(
        await screen.findByRole("button", { name: "Open download page" })
      );

      expect(openExternal).toHaveBeenCalledWith(
        "https://6529.io/desktop?from=app"
      );
      expect(updater.downloadUpdate).not.toHaveBeenCalled();
      expect(screen.getByRole("status")).toHaveTextContent(
        "The download page is open in your browser."
      );
      expect(
        screen.queryByRole("button", { name: "Download update" })
      ).not.toBeInTheDocument();
      // It can be opened again; the check's own errors never read as a
      // failed download.
      updater.emit("error", { message: "offline", kind: "unavailable" });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: "Open download page" })
      );
      expect(openExternal).toHaveBeenCalledTimes(2);
      expect(updater.downloadUpdate).not.toHaveBeenCalled();
    });

    it.each([
      ["missing", undefined],
      ["not https", "http://6529.io/desktop"],
      ["on another site", "https://evil.example/desktop"],
      ["a look-alike host", "https://6529.io.evil.example/desktop"],
      ["with credentials", "https://user:pass@6529.io/desktop"],
      ["not a URL", "javascript:alert(1)"],
      ["not text", 42],
    ])(
      "falls back to the 6529.io download page when downloadPage is %s",
      async (_label, downloadPage) => {
        const user = userEvent.setup();
        installDesktopShell(NEW_APP);
        render(<DesktopUpdateNotice />);
        updater.emit("available", { version: "0.1.0-rc.3", downloadPage });

        await user.click(
          await screen.findByRole("button", { name: "Open download page" })
        );

        expect(openExternal).toHaveBeenCalledWith("https://6529.io/desktop");
        expect(updater.downloadUpdate).not.toHaveBeenCalled();
      }
    );

    it("says how to get there when the browser does not open", async () => {
      const user = userEvent.setup();
      installDesktopShell(NEW_APP);
      openExternal.mockImplementation(() => {
        throw new Error("no browser");
      });
      render(<DesktopUpdateNotice />);
      updater.emit("available", { version: "0.1.0-rc.3" });

      await user.click(
        await screen.findByRole("button", { name: "Open download page" })
      );

      expect(screen.getByRole("alert")).toHaveTextContent(
        "The download page did not open. Open https://6529.io/desktop in your browser."
      );
      expect(updater.downloadUpdate).not.toHaveBeenCalled();
    });

    it("uses the page when the shell cannot say whether it downloads", async () => {
      const user = userEvent.setup();
      installDesktopShell();
      Object.defineProperty(window, "api", {
        configurable: true,
        value: {
          openExternal,
          getInfo: jest.fn(() => Promise.reject(new Error("ipc"))),
        },
      });
      render(<DesktopUpdateNotice />);
      updater.emit("available", { version: "0.1.0-rc.3" });

      await user.click(
        await screen.findByRole("button", { name: "Open download page" })
      );
      expect(openExternal).toHaveBeenCalledWith("https://6529.io/desktop");
      expect(updater.downloadUpdate).not.toHaveBeenCalled();
    });
  });

  it("can be dismissed, and ignores a malformed version", async () => {
    const user = userEvent.setup();
    installDesktopShell();
    render(<DesktopUpdateNotice />);

    updater.emit("available", { version: "<script>" });
    expect(
      screen.getByText("A new version of 6529 Desktop is available.")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByText(/available/)).not.toBeInTheDocument();
  });

  it("stops listening when unmounted", () => {
    installDesktopShell();
    const { unmount } = render(<DesktopUpdateNotice />);
    updater.emit("not-available");

    unmount();

    for (const listeners of Object.values(updater.listeners)) {
      expect(listeners.size).toBe(0);
    }
  });
});
