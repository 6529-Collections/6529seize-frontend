import About from "@/components/about/About";
import { NftPurchasingServerRenderProvider } from "@/components/common/NftPurchasingServerRender";
import { canServerRenderNftPurchasing } from "@/components/common/nftPurchasingRequest";
import { AboutSection } from "@/types/enums";
import { act } from "@testing-library/react";
import { useEffect } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

// Real request check, server-render context, visibility hook, gate and
// platform hook. Only the native bridge, the country and the section bodies
// are replaced.
type Platform = "ios" | "android" | "web";
let mockNativePlatform: Platform = "web";
let mockCountry: string | undefined = "";
let mockIsCountryPending = true;
const mockReplace = jest.fn();
const mockMount = jest.fn();
const mockRequest = jest.fn();

jest.mock("@capacitor/core", () => {
  const actual = jest.requireActual("@capacitor/core");
  return {
    ...actual,
    Capacitor: {
      ...actual.Capacitor,
      isNativePlatform: () => mockNativePlatform !== "web",
      getPlatform: () => mockNativePlatform,
    },
  };
});
jest.mock("@capacitor/app", () => ({
  App: {
    getState: jest.fn(async () => ({ isActive: true })),
    addListener: jest.fn(async () => ({ remove: jest.fn() })),
  },
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({
    country: mockCountry,
    isCountryPending: mockIsCountryPending,
  }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: jest.fn(),
}));
jest.mock("@/components/about/AboutContentsDropdown", () => ({
  AboutContentsDropdown: () => <nav>About contents</nav>,
}));
jest.mock("@/components/about/AboutMinting", () => ({
  __esModule: true,
  default: function MockAboutMinting() {
    return <MockPurchasingSection title="Minting" />;
  },
}));
jest.mock("@/components/about/AboutSubscriptions", () => ({
  __esModule: true,
  default: function MockAboutSubscriptions() {
    return <MockPurchasingSection title="Subscription Minting" />;
  },
}));

function MockPurchasingSection({ title }: { readonly title: string }) {
  mockMount(title);
  useEffect(() => {
    mockRequest(title);
  }, [title]);
  return <h1>{title}</h1>;
}

const USER_AGENTS = {
  web: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  android:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.81 Mobile Safari/537.36",
  crawler:
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  iosApp:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
} as const;

const SECTIONS = [
  [AboutSection.MINTING, "Minting"],
  [AboutSection.SUBSCRIPTIONS, "Subscription Minting"],
] as const;

interface RequestShape {
  readonly hasNativeIosCookie: boolean;
  readonly userAgent: string;
}

let container: HTMLDivElement;
let root: Root | null = null;
let onRecoverableError: jest.Mock;

// The route renders About inside <main>, so leftover server nodes are checked.
function page(section: AboutSection, request: RequestShape) {
  return (
    <NftPurchasingServerRenderProvider
      enabled={canServerRenderNftPurchasing(request)}
    >
      <main>
        <About section={section} />
      </main>
    </NftPurchasingServerRenderProvider>
  );
}

function main() {
  return container.querySelector("main");
}

// The server is never the native shell, so Capacitor reports web there.
function serverHtml(section: AboutSection, request: RequestShape) {
  const platform = mockNativePlatform;
  mockNativePlatform = "web";
  const html = renderToString(page(section, request));
  mockNativePlatform = platform;
  return html;
}

async function hydrate(section: AboutSection, request: RequestShape) {
  container.innerHTML = serverHtml(section, request);
  // Only browser renders and effects count from here on.
  mockMount.mockClear();
  mockRequest.mockClear();
  await act(async () => {
    root = hydrateRoot(container, page(section, request), {
      onRecoverableError,
    });
  });
}

async function settleCountry(
  section: AboutSection,
  request: RequestShape,
  country: string
) {
  mockCountry = country;
  mockIsCountryPending = false;
  await act(async () => {
    root?.render(page(section, request));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNativePlatform = "web";
  mockCountry = "";
  mockIsCountryPending = true;
  onRecoverableError = jest.fn();
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  container.remove();
});

describe.each(SECTIONS)("direct link to /about/%s", (section, title) => {
  it.each([
    ["web", "web", { hasNativeIosCookie: false, userAgent: USER_AGENTS.web }],
    [
      "Android",
      "android",
      { hasNativeIosCookie: false, userAgent: USER_AGENTS.android },
    ],
    [
      "a crawler",
      "web",
      { hasNativeIosCookie: false, userAgent: USER_AGENTS.crawler },
    ],
  ] as const)(
    "server-renders the section for %s and keeps it after hydration",
    async (_label, platform, request) => {
      mockNativePlatform = platform;
      mockCountry = "FR";
      mockIsCountryPending = false;

      expect(serverHtml(section, request)).toContain(`<h1>${title}</h1>`);
      await hydrate(section, request);

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(main()?.querySelector("h1")?.textContent).toBe(title);
      expect(mockRequest).toHaveBeenCalledWith(title);
      expect(mockReplace).not.toHaveBeenCalled();
    }
  );

  describe("in the iOS app", () => {
    const iosRequests = [
      [
        "with its cookie",
        { hasNativeIosCookie: true, userAgent: USER_AGENTS.iosApp },
      ],
      [
        "before its cookie is set",
        { hasNativeIosCookie: false, userAgent: USER_AGENTS.iosApp },
      ],
      [
        "with its cookie and an altered user agent",
        { hasNativeIosCookie: true, userAgent: USER_AGENTS.web },
      ],
    ] as const;

    beforeEach(() => {
      mockNativePlatform = "ios";
    });

    it.each(iosRequests)(
      "keeps the section out of server HTML %s",
      (_label, request) => {
        expect(serverHtml(section, request)).toBe("<main></main>");
        expect(mockMount).not.toHaveBeenCalled();
      }
    );

    it.each([
      ["outside the US", "FR"],
      ["with an unknown country", ""],
    ])(
      "redirects to /about without mounting the section %s",
      async (_label, country) => {
        const request = iosRequests[0][1];
        await hydrate(section, request);

        expect(main()).toBeEmptyDOMElement();
        expect(mockReplace).not.toHaveBeenCalled();

        await settleCountry(section, request, country);

        expect(main()).toBeEmptyDOMElement();
        expect(mockMount).not.toHaveBeenCalled();
        expect(mockRequest).not.toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith("/about");
      }
    );

    it("shows the section in the US once the country check settles", async () => {
      const request = iosRequests[0][1];
      await hydrate(section, request);
      expect(mockMount).not.toHaveBeenCalled();

      await settleCountry(section, request, "US");

      expect(main()?.querySelector("h1")?.textContent).toBe(title);
      expect(mockReplace).not.toHaveBeenCalled();
    });

    // A request that reached the server with neither iOS signal. The browser
    // check discards that HTML before anything in it mounts.
    it("discards server HTML that reached the app without its iOS signals", async () => {
      const request = { hasNativeIosCookie: false, userAgent: USER_AGENTS.web };
      expect(serverHtml(section, request)).toContain(`<h1>${title}</h1>`);

      await hydrate(section, request);

      expect(onRecoverableError).toHaveBeenCalled();
      expect(main()).toBeEmptyDOMElement();
      expect(mockMount).not.toHaveBeenCalled();
      expect(mockRequest).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();

      await settleCountry(section, request, "FR");

      expect(main()).toBeEmptyDOMElement();
      expect(mockMount).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/about");
    });
  });
});
