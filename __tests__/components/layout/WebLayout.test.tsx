import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import WebLayout from "@/components/layout/WebLayout";
import { useSidebarState } from "@/hooks/useSidebarState";

const mockRegisterRef = jest.fn();
const mockSetHeaderRef = jest.fn();
const mockMounted = jest.fn();
const mockCleanup = jest.fn();
const mockSearchMounted = jest.fn();
const mockSearchCleanup = jest.fn();
let mockWidth = 900;
let mockTouchFirst = true;
let mockSmallWebStartupExpected = true;
type MediaListener =
  | EventListenerOrEventListenerObject
  | ((event: MediaQueryListEvent) => void);
const mediaChanges = new Map<string, Set<MediaListener>>();

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ registerRef: mockRegisterRef }),
}));
jest.mock("@/contexts/HeaderContext", () => ({
  useHeaderContext: () => ({ setHeaderRef: mockSetHeaderRef }),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/artwork-documentation",
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => mockTouchFirst,
}));
jest.mock("@/components/layout/smallWebStartup", () => ({
  isSmallWebStartupExpected: () => mockSmallWebStartupExpected,
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: undefined,
    hasValidWalletAuth: false,
  }),
}));
jest.mock("@/hooks/useUnreadNotifications", () => ({
  useUnreadNotifications: () => ({ haveUnreadNotifications: false }),
}));
jest.mock("@/components/layout/sidebar/WebSidebarNav", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/layout/sidebar/WebSidebarHeader", () => ({
  __esModule: true,
  default: ({ onToggle }: { onToggle: () => void }) => (
    <button onClick={onToggle}>Toggle sidebar</button>
  ),
}));
jest.mock("@/components/layout/sidebar/WebSidebarUser", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/layout/sidebar/WebSidebarVersionUpdate", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/header/share/HeaderShare", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/header/share/HeaderPageShareButton", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/header/header-search/HeaderSearchButton", () => ({
  __esModule: true,
  default: () => {
    useEffect(() => {
      mockSearchMounted();
      return mockSearchCleanup;
    }, []);
    return null;
  },
}));
jest.mock("@/components/header/header-search/HeaderSearchModal", () => ({
  __esModule: true,
  default: () => <div role="dialog" aria-label="Search" />,
}));
jest.mock("@/components/mobile-app/MobileAppBanner", () => ({
  __esModule: true,
  default: () => <aside aria-label="Open in 6529 Mobile" />,
}));
jest.mock("@/components/common/EnvironmentBadge", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("react-tooltip", () => ({ Tooltip: () => null }));

function matches(query: string) {
  const maxWidth = /max-width: ([\d.]+)px/u.exec(query)?.[1];
  return maxWidth ? mockWidth <= Number(maxWidth) : false;
}

function resize(width: number) {
  act(() => {
    mockWidth = width;
    for (const [query, listeners] of mediaChanges) {
      const event = { matches: matches(query) } as MediaQueryListEvent;
      for (const listener of listeners) {
        if (typeof listener === "function") listener(event);
        else listener.handleEvent(event);
      }
    }
  });
}

function Editor({ transfer }: { readonly transfer: AbortController }) {
  const { isRightSidebarOpen, openRightSidebar } = useSidebarState();
  useEffect(() => {
    mockMounted();
    return () => {
      mockCleanup();
      transfer.abort();
    };
  }, [transfer]);
  return (
    <>
      <input aria-label="Pending answer" defaultValue="" />
      <button onClick={openRightSidebar}>Open details</button>
      <output>{isRightSidebarOpen ? "Details open" : "Details closed"}</output>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  mediaChanges.clear();
  mockWidth = 900;
  mockTouchFirst = true;
  mockSmallWebStartupExpected = true;
  delete document.documentElement.dataset["smallWebStartup"];
  window.matchMedia = jest.fn((query: string) => ({
    get matches() {
      return matches(query);
    },
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
    addEventListener: (_event: string, listener: MediaListener) => {
      const listeners = mediaChanges.get(query) ?? new Set();
      listeners.add(listener);
      mediaChanges.set(query, listeners);
    },
    removeEventListener: (_event: string, listener: MediaListener) => {
      mediaChanges.get(query)?.delete(listener);
    },
  }));
});

it("hydrates the server mobile header without registering hidden desktop chrome", async () => {
  document.documentElement.dataset["smallWebStartup"] = "true";
  const html = renderToString(
    <WebLayout>
      <h1>Public reading</h1>
    </WebLayout>
  );
  const container = document.createElement("div");
  container.innerHTML = html;
  const header = container.querySelector("[data-web-small-header]");
  expect(header).toHaveAttribute("hidden");
  expect(header?.querySelector("header")).not.toBeNull();
  expect(header?.querySelector("aside")).toBeNull();
  expect(container.querySelector("[data-web-sidebar]")).not.toBeNull();
  expect(container.querySelector("main h1")?.textContent).toBe(
    "Public reading"
  );
  document.body.appendChild(container);
  const onRecoverableError = jest.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(
        container,
        <WebLayout>
          <h1>Public reading</h1>
        </WebLayout>,
        { onRecoverableError }
      );
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.querySelector("[data-web-small-header]")).toBe(header);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(mockRegisterRef).not.toHaveBeenCalled();
    expect(mockSetHeaderRef).not.toHaveBeenCalled();
    expect(mockSearchMounted).not.toHaveBeenCalled();
    // Hydration defaults are desktop; retain mobile paint until its real
    // responsive props arrive rather than clearing the marker too early.
    expect(document.documentElement.dataset["smallWebStartup"]).toBe("true");
  } finally {
    await act(async () => root?.unmount());
    container.remove();
  }
});

it("releases startup chrome if a tablet gains a mouse before mobile hydration", () => {
  document.documentElement.dataset["smallWebStartup"] = "true";
  const { rerender } = render(
    <WebLayout>
      <h1>Public reading</h1>
    </WebLayout>
  );
  expect(document.documentElement.dataset["smallWebStartup"]).toBe("true");
  mockTouchFirst = false;
  mockSmallWebStartupExpected = false;
  rerender(
    <WebLayout>
      <h1>Public reading</h1>
    </WebLayout>
  );
  expect(document.documentElement).not.toHaveAttribute(
    "data-small-web-startup"
  );
  expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  expect(mockSearchMounted).not.toHaveBeenCalled();
});

it("clears a stale mobile startup marker when React mounts on desktop", () => {
  document.documentElement.dataset["smallWebStartup"] = "true";
  mockSmallWebStartupExpected = false;
  render(
    <WebLayout>
      <h1>Public reading</h1>
    </WebLayout>
  );
  expect(document.documentElement).not.toHaveAttribute(
    "data-small-web-startup"
  );
});

it("adapts chrome and clears its overlay without remounting the editor or SidebarProvider", () => {
  document.documentElement.setAttribute("data-small-web-startup", "true");
  const transfer = new AbortController();
  const { rerender, unmount } = render(
    <WebLayout isSmall>
      <Editor transfer={transfer} />
    </WebLayout>
  );
  const input = screen.getByRole("textbox", { name: "Pending answer" });
  expect(document.documentElement).not.toHaveAttribute(
    "data-small-web-startup"
  );
  expect(mockSearchMounted).toHaveBeenCalledTimes(1);
  const main = input.closest("main");
  fireEvent.change(input, { target: { value: "Still writing" } });
  fireEvent.click(screen.getByRole("button", { name: "Open details" }));
  const header = screen.getByRole("banner").parentElement;
  expect(header?.firstElementChild).toBe(
    screen.getByRole("complementary", { name: "Open in 6529 Mobile" })
  );
  expect(mockRegisterRef).toHaveBeenCalledWith("header", header);
  expect(mockSetHeaderRef).toHaveBeenCalledWith(header);
  expect(main).toHaveClass("tw-transition-opacity");

  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  expect(screen.getByLabelText("Primary sidebar").style.width).toBe(
    "17.1875rem"
  );
  fireEvent.keyDown(window, { key: "Escape" });
  expect(
    screen.queryByRole("button", { name: "Close menu overlay" })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
  expect(screen.queryByLabelText("Primary sidebar")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

  resize(1100);
  rerender(
    <WebLayout>
      <Editor transfer={transfer} />
    </WebLayout>
  );
  expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  expect(mockSearchCleanup).toHaveBeenCalledTimes(1);
  expect(mockRegisterRef).toHaveBeenLastCalledWith("header", null);
  expect(mockSetHeaderRef).toHaveBeenLastCalledWith(null);
  expect(
    screen.queryByRole("button", { name: "Close menu overlay" })
  ).not.toBeInTheDocument();
  expect(main).toHaveClass("layout-main");
  expect(screen.getByRole("textbox", { name: "Pending answer" })).toBe(input);
  expect(input.closest("main")).toBe(main);
  expect(input).toHaveValue("Still writing");
  expect(screen.getByText("Details open")).toBeInTheDocument();

  // The desktop search belongs to the chrome, so switching back clears it.
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(screen.getByRole("dialog", { name: "Search" })).toBeInTheDocument();
  resize(390);
  rerender(
    <WebLayout isSmall>
      <Editor transfer={transfer} />
    </WebLayout>
  );
  expect(
    screen.queryByRole("dialog", { name: "Search" })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  expect(
    screen.queryByRole("dialog", { name: "Search" })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close menu overlay" }));
  expect(screen.getByRole("textbox", { name: "Pending answer" })).toBe(input);
  expect(input).toHaveValue("Still writing");
  expect(screen.getByText("Details open")).toBeInTheDocument();
  expect(mockMounted).toHaveBeenCalledTimes(1);
  expect(mockCleanup).not.toHaveBeenCalled();
  expect(transfer.signal.aborted).toBe(false);
  unmount();
  expect(mockCleanup).toHaveBeenCalledTimes(1);
  expect(transfer.signal.aborted).toBe(true);
  expect(mockSetHeaderRef).toHaveBeenLastCalledWith(null);
});
