import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopWindowChrome from "@/components/desktop/DesktopWindowChrome";
import { useWindowChrome } from "@/hooks/useWindowChrome";

type Listener = (event: unknown, payload?: unknown) => void;

const createUpdater = () => {
  const listeners: Record<string, Set<Listener>> = {};
  const on = (name: string) =>
    jest.fn((listener: Listener) => {
      listeners[name] ??= new Set();
      listeners[name].add(listener);
    });
  const off = (name: string) =>
    jest.fn((listener: Listener) => listeners[name]?.delete(listener));
  return {
    listeners,
    checkUpdates: jest.fn(),
    onUpdateAvailable: on("available"),
    offUpdateAvailable: off("available"),
    onUpdateNotAvailable: on("not-available"),
    offUpdateNotAvailable: off("not-available"),
  };
};

let updater: ReturnType<typeof createUpdater>;

const setChrome = (attributes: Record<string, string>) => {
  for (const [name, value] of Object.entries(attributes)) {
    document.documentElement.setAttribute(name, value);
  }
};

const installDesktopShell = () => {
  Object.defineProperty(window, "api", {
    configurable: true,
    value: {
      openExternal: jest.fn(),
      getInfo: jest
        .fn()
        .mockResolvedValue({ app_version: "1.2.3", environment: "local" }),
    },
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

function Probe() {
  const chrome = useWindowChrome();
  return <span>{chrome ? `${chrome.platform} ${chrome.style}` : "none"}</span>;
}

describe("desktop window chrome", () => {
  beforeEach(() => {
    updater = createUpdater();
  });

  afterEach(() => {
    for (const name of [
      "data-desktop-platform",
      "data-desktop-titlebar",
      "data-desktop-window",
      "data-desktop-focused",
    ]) {
      document.documentElement.removeAttribute(name);
    }
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
    Reflect.deleteProperty(window, "updater");
  });

  it("reads nothing on the web, even with the attributes present", () => {
    setChrome({
      "data-desktop-platform": "windows",
      "data-desktop-titlebar": "overlay",
    });
    render(
      <>
        <Probe />
        <DesktopWindowChrome />
      </>
    );

    expect(screen.getByText("none")).toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("reads the host's attributes and follows their changes", async () => {
    installDesktopShell();
    setChrome({
      "data-desktop-platform": "macos",
      "data-desktop-titlebar": "overlay",
    });
    render(<Probe />);

    expect(screen.getByText("macos overlay")).toBeInTheDocument();
    act(() => {
      setChrome({ "data-desktop-titlebar": "native" });
    });
    await waitFor(() =>
      expect(screen.getByText("macos native")).toBeInTheDocument()
    );
  });

  it("draws no strip when the system draws the title bar", () => {
    installDesktopShell();
    setChrome({
      "data-desktop-platform": "linux",
      "data-desktop-titlebar": "native",
    });
    render(<DesktopWindowChrome />);

    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("draws a labelled, draggable strip with the version and an info button", async () => {
    installDesktopShell();
    setChrome({
      "data-desktop-platform": "windows",
      "data-desktop-titlebar": "overlay",
    });
    render(<DesktopWindowChrome />);

    const strip = screen.getByRole("group", {
      name: "6529 Desktop window title",
    });
    expect(strip).toHaveAttribute("data-desktop-drag-region", "");
    expect(await screen.findByText("1.2.3 local")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "App info" })).toBeVisible();
    // The page draws no window buttons: the host does.
    expect(
      screen.queryByRole("button", { name: /close|minimi|maximi/i })
    ).not.toBeInTheDocument();
  });

  it("names the info button when an update is available and opens app info", async () => {
    const user = userEvent.setup();
    installDesktopShell();
    setChrome({
      "data-desktop-platform": "macos",
      "data-desktop-titlebar": "overlay",
    });
    render(<DesktopWindowChrome />);

    act(() => {
      for (const listener of updater.listeners["available"] ?? []) {
        listener({}, { version: "1.3.0" });
      }
    });
    await user.click(
      screen.getByRole("button", { name: "App info (update available)" })
    );

    expect(await screen.findByText("About 6529 Desktop")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Check for updates" }));
    expect(updater.checkUpdates).toHaveBeenCalledTimes(1);
  });
});
