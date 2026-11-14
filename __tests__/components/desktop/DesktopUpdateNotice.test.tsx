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

const installDesktopShell = () => {
  Object.defineProperty(window, "api", {
    configurable: true,
    value: { openExternal: jest.fn() },
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

    await user.click(screen.getByRole("button", { name: "Download update" }));
    expect(updater.downloadUpdate).toHaveBeenCalledTimes(1);

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
    await user.click(screen.getByRole("button", { name: "Download update" }));

    updater.emit("error", { message: "disk full" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The update could not be downloaded."
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(updater.downloadUpdate).toHaveBeenCalledTimes(2);
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

    unmount();

    for (const listeners of Object.values(updater.listeners)) {
      expect(listeners.size).toBe(0);
    }
  });
});
