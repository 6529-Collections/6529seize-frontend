import { act, useLayoutEffect, useRef } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import LayoutWrapper from "@/components/providers/LayoutWrapper";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";

let mockPlatform = "ios";
let mockPathname = "/about";
let mockCountry: string | undefined;
jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => mockPlatform !== "web",
    getPlatform: () => mockPlatform,
  },
}));
jest.mock("@capacitor/app", () => ({
  App: {
    getState: async () => ({ isActive: true }),
    addListener: async () => ({ remove: jest.fn() }),
  },
}));
jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: mockCountry }),
}));
jest.mock("@/contexts/RefreshContext", () => ({
  useGlobalRefresh: () => ({ refreshKey: 0 }),
}));
jest.mock("@/components/footer/FooterWrapper", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/providers/LayoutErrorFallback", () => ({
  __esModule: true,
  default: () => <p>Layout error</p>,
}));
jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  markMobileLaunchStep: jest.fn(),
  scheduleMobileLaunchFlush: jest.fn(),
}));
// Leave layout selection and every device/purchasing hook real. Only replace
// the layouts' unrelated service trees with distinct host elements.
jest.mock("@/components/layout/WebLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <section data-layout="web">{children}</section>
  ),
}));
jest.mock("@/components/layout/AppLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <article data-layout="native">{children}</article>
  ),
}));
jest.mock("@/components/layout/SmallScreenLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <aside data-layout="small">{children}</aside>
  ),
}));

beforeEach(() => {
  mockPathname = "/about";
  document.documentElement.removeAttribute("data-native-runtime");
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: "iPhone",
  });
  Object.defineProperty(navigator, "maxTouchPoints", {
    configurable: true,
    value: 5,
  });
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 390,
  });
  window.matchMedia = jest.fn((query) => ({
    matches: query.includes("max-width") || query === "(any-pointer: coarse)",
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
});

it.each([
  ["ios", "/access"],
  ["ios", "/restricted"],
  ["android", "/access"],
  ["android", "/restricted"],
] as const)(
  "keeps %s %s content available without desktop chrome through hydration",
  async (platform, pathname) => {
    mockPlatform = platform;
    mockPathname = pathname;
    document.documentElement.setAttribute("data-native-runtime", platform);
    const commits: { isApp: boolean; layout: string | null }[] = [];
    function StandaloneContent() {
      const { isApp } = useDeviceInfo();
      const ref = useRef<HTMLElement>(null);
      useLayoutEffect(() => {
        commits.push({
          isApp,
          layout:
            ref.current
              ?.closest("[data-layout]")
              ?.getAttribute("data-layout") ?? null,
        });
      });
      return <main ref={ref}>Standalone access content</main>;
    }
    const reader = (
      <LayoutWrapper>
        <StandaloneContent />
      </LayoutWrapper>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(reader);
    document.body.appendChild(container);
    const serverContent = container.querySelector("main");
    expect(serverContent?.parentElement).toBe(container);
    expect(container.querySelector("[data-layout]")).toBeNull();
    expect(container.querySelector("[data-native-startup]")).toBeNull();

    const onRecoverableError = jest.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, reader, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(commits[0]).toEqual({ isApp: false, layout: null });
      expect(commits.at(-1)).toEqual({ isApp: true, layout: null });
      expect(commits.every(({ layout }) => layout === null)).toBe(true);
      expect(container.querySelector("main")).toBe(serverContent);
      expect(serverContent?.parentElement).toBe(container);
      expect(container.querySelector("[data-native-startup]")).toBeNull();

      // Leaving a standalone page enters the native shell directly; no web
      // layout is mounted during this already-hydrated client navigation.
      const previousCommitCount = commits.length;
      mockPathname = "/about";
      await act(async () => {
        root?.render(
          <LayoutWrapper>
            <StandaloneContent />
          </LayoutWrapper>
        );
      });
      const navigationCommits = commits.slice(previousCommitCount);
      expect(navigationCommits.length).toBeGreaterThan(0);
      expect(navigationCommits.every(({ layout }) => layout === "native")).toBe(
        true
      );
      expect(container.querySelector('[data-layout="web"]')).toBeNull();
      expect(
        container.querySelector('[data-native-startup="ready"]')
      ).not.toBeNull();
    } finally {
      await act(async () => root?.unmount());
      container.remove();
      document.documentElement.removeAttribute("data-native-runtime");
    }
  }
);

it.each([
  ["ios", undefined, "native", true],
  ["ios", "CA", "native", true],
  ["ios", "US", "native", false],
  ["android", "CA", "native", false],
  ["web", "CA", "small", false],
] as const)(
  "hydrates %s country=%s before restoring its device layout",
  async (platform, country, layout, restricted) => {
    mockPlatform = platform;
    mockCountry = country;
    if (platform !== "web") {
      document.documentElement.setAttribute("data-native-runtime", platform);
    }
    const commits: { isIos: boolean; hidden: boolean; orientation: number }[] =
      [];
    const contentMountLayouts: (string | null | undefined)[] = [];
    const navigationRenders: boolean[] = [];
    const hiddenContentCommits: boolean[] = [];
    function Content() {
      const ref = useRef<HTMLHeadingElement>(null);
      useLayoutEffect(() => {
        // The desktop hydration commit may exist, but native users must never
        // see it. The browser suite verifies this selector actually hides it.
        hiddenContentCommits.push(
          ref.current?.closest(
            ':root[data-native-runtime] [data-native-startup="pending"] > [data-native-startup-content]'
          ) !== null
        );
        contentMountLayouts.push(
          ref.current?.closest("[data-layout]")?.getAttribute("data-layout")
        );
      }, []);
      return <h1 ref={ref}>Public reading</h1>;
    }
    function Navigation() {
      const { isApp } = useDeviceInfo();
      navigationRenders.push(isApp);
      return <nav data-navigation={isApp ? "native" : "web"}>Messages</nav>;
    }
    function Reader({
      showNavigation = false,
    }: {
      readonly showNavigation?: boolean;
    }) {
      const { isIos, orientation } = useCapacitor();
      const { hideNftPurchasing } = useNftPurchasingVisibility();
      useLayoutEffect(() => {
        commits.push({ isIos, hidden: hideNftPurchasing, orientation });
      });
      return (
        <>
          <output>{`${isIos}:${orientation}`}</output>
          <LayoutWrapper>
            <Content />
            {showNavigation && <Navigation />}
            {!hideNftPurchasing && <button>Mint</button>}
          </LayoutWrapper>
        </>
      );
    }
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Reader />);
    document.body.appendChild(container);
    expect(container.querySelector('[data-layout="web"]')).not.toBeNull();
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("h1")?.textContent).toBe("Public reading");
    const onRecoverableError = jest.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <Reader />, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(commits[0]).toEqual({
        isIos: false,
        hidden: true,
        orientation: 0,
      });
      expect(commits[1]?.isIos).toBe(platform === "ios");
      expect(commits[1]?.hidden).toBe(restricted);
      expect(
        container.querySelector(`[data-layout="${layout}"]`)
      ).not.toBeNull();
      expect(container.querySelector("h1")?.textContent).toBe("Public reading");
      expect(container.querySelector("button") === null).toBe(restricted);
      if (restricted)
        expect(commits.every((commit) => commit.hidden)).toBe(true);
      if (platform !== "web") expect(commits.at(-1)?.orientation).toBe(1);
      // The server layout transitions once. Real MobileLayout must select
      // AppLayout immediately, without mounting a second fallback layout.
      expect(contentMountLayouts).toEqual(["web", layout]);
      expect(hiddenContentCommits).toEqual([platform !== "web", false]);
      await act(async () => root?.render(<Reader showNavigation />));
      expect(navigationRenders[0]).toBe(platform !== "web");
      expect(
        navigationRenders.every((isApp) => isApp === (platform !== "web"))
      ).toBe(true);
      expect(contentMountLayouts).toEqual(["web", layout]);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
      document.documentElement.removeAttribute("data-native-runtime");
    }
  }
);
