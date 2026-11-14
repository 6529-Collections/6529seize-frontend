import { render } from "@testing-library/react";
import DesktopNavigationBridge from "@/components/desktop/DesktopNavigationBridge";
import { loadDesktopUrlInPlace } from "@/helpers/desktop-navigation";

const push = jest.fn();
const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

jest.mock("@/helpers/desktop-navigation", () => ({
  ...jest.requireActual("@/helpers/desktop-navigation"),
  loadDesktopUrlInPlace: jest.fn(),
}));

type NavigateListener = (event: unknown, path: string) => void;

const createApi = () => {
  const listeners = new Set<NavigateListener>();
  return {
    listeners,
    openExternal: jest.fn(),
    onNavigate: jest.fn((listener: NavigateListener) =>
      listeners.add(listener)
    ),
    offNavigate: jest.fn((listener: NavigateListener) =>
      listeners.delete(listener)
    ),
    navigationReady: jest.fn().mockResolvedValue(undefined),
  };
};

let api: ReturnType<typeof createApi>;

const installDesktopShell = () => {
  Object.defineProperty(window, "api", { configurable: true, value: api });
  Object.defineProperty(window, "nativeAuth", {
    configurable: true,
    value: { sessionLogin: jest.fn() },
  });
};

const deliver = (path: string) => {
  for (const listener of api.listeners) listener({ channel: "navigate" }, path);
};

const clickLink = (
  href: string,
  init: MouseEventInit = {},
  attributes: Record<string, string> = {}
) => {
  const anchor = document.createElement("a");
  anchor.setAttribute("href", href);
  for (const [name, value] of Object.entries(attributes)) {
    anchor.setAttribute(name, value);
  }
  anchor.textContent = "link";
  document.body.appendChild(anchor);
  const type = init.button === 1 ? "auxclick" : "click";
  let preventedByBridge = false;
  // Runs after the bridge's document listener; records its decision, then
  // stops jsdom from attempting a real navigation.
  const recorder = (event: Event) => {
    preventedByBridge = event.defaultPrevented;
    event.preventDefault();
  };
  window.addEventListener(type, recorder);
  anchor.dispatchEvent(
    new MouseEvent(type, { bubbles: true, cancelable: true, ...init })
  );
  window.removeEventListener(type, recorder);
  anchor.remove();
  return { defaultPrevented: preventedByBridge };
};

describe("DesktopNavigationBridge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api = createApi();
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "api");
    Reflect.deleteProperty(window, "nativeAuth");
  });

  it("does nothing in a browser", () => {
    render(<DesktopNavigationBridge />);

    const event = clickLink("https://example.com", {}, { target: "_blank" });

    expect(event.defaultPrevented).toBe(false);
    expect(api.onNavigate).not.toHaveBeenCalled();
    expect(api.navigationReady).not.toHaveBeenCalled();
  });

  it("listens for deep links before asking for queued ones", () => {
    installDesktopShell();

    render(<DesktopNavigationBridge />);

    expect(api.onNavigate).toHaveBeenCalledTimes(1);
    expect(api.navigationReady).toHaveBeenCalledTimes(1);
    expect(api.onNavigate.mock.invocationCallOrder[0]).toBeLessThan(
      api.navigationReady.mock.invocationCallOrder[0] ?? 0
    );
  });

  it("follows a delivered deep link, and ignores unsafe ones", () => {
    installDesktopShell();
    render(<DesktopNavigationBridge />);

    deliver("/accept-connection-sharing?connection_share_code=abc#k=v");
    deliver("//evil.example/");
    deliver("https://evil.example/");

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(
      "/accept-connection-sharing?connection_share_code=abc#k=v"
    );
  });

  it("replaces the page already open", () => {
    installDesktopShell();
    render(<DesktopNavigationBridge />);

    deliver(`${window.location.pathname}?x=1`);

    expect(replace).toHaveBeenCalledWith(
      `${window.location.pathname}?x=1&reload=true`,
      { scroll: false }
    );
  });

  it("stops listening when unmounted", () => {
    installDesktopShell();
    const { unmount } = render(<DesktopNavigationBridge />);

    unmount();

    expect(api.offNavigate).toHaveBeenCalledTimes(1);
    expect(api.listeners.size).toBe(0);
  });

  it("opens other sites from new-window links in the system browser", () => {
    installDesktopShell();
    render(<DesktopNavigationBridge />);

    const blank = clickLink("https://opensea.io/x", {}, { target: "_blank" });
    const middle = clickLink("https://example.com/", { button: 1 });

    expect(blank.defaultPrevented).toBe(true);
    expect(middle.defaultPrevented).toBe(true);
    expect(api.openExternal).toHaveBeenNthCalledWith(1, "https://opensea.io/x");
    expect(api.openExternal).toHaveBeenNthCalledWith(2, "https://example.com/");
  });

  it("loads own URLs from new-window links in this window", () => {
    installDesktopShell();
    render(<DesktopNavigationBridge />);

    const page = clickLink("/the-memes/1", {}, { target: "_blank" });
    const download = clickLink("/api/export.csv", {}, { target: "_blank" });

    expect(page.defaultPrevented).toBe(true);
    expect(download.defaultPrevented).toBe(true);
    expect(loadDesktopUrlInPlace).toHaveBeenNthCalledWith(1, "/the-memes/1");
    expect(loadDesktopUrlInPlace).toHaveBeenNthCalledWith(2, "/api/export.csv");
    expect(push).not.toHaveBeenCalled();
    expect(api.openExternal).not.toHaveBeenCalled();
  });

  it("sends a crafted backslash link only to the system browser", () => {
    installDesktopShell();
    render(<DesktopNavigationBridge />);

    clickLink(String.raw`/\evil.example/x`, {}, { target: "_blank" });

    expect(loadDesktopUrlInPlace).not.toHaveBeenCalled();
    expect(api.openExternal).toHaveBeenCalledWith("http://evil.example/x");
  });

  it("leaves a new-window click the app already handled alone", () => {
    installDesktopShell();
    const handled = (event: MouseEvent) => event.preventDefault();
    const root = document.createElement("div");
    document.body.appendChild(root);
    root.addEventListener("click", handled);
    const anchor = document.createElement("a");
    anchor.setAttribute("href", "https://example.com/");
    anchor.setAttribute("target", "_blank");
    root.appendChild(anchor);
    render(<DesktopNavigationBridge />);

    anchor.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(api.openExternal).not.toHaveBeenCalled();
    root.remove();
  });

  it("keeps listening when the shell cannot be told the page is ready", async () => {
    installDesktopShell();
    api.navigationReady.mockRejectedValue(new Error("closed"));
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    render(<DesktopNavigationBridge />);
    await Promise.resolve();

    deliver("/waves");

    expect(push).toHaveBeenCalledWith("/waves");
    consoleError.mockRestore();
  });

  it("leaves ordinary same-window links to the app", () => {
    installDesktopShell();
    render(<DesktopNavigationBridge />);

    const event = clickLink("/waves");

    expect(event.defaultPrevented).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });
});
