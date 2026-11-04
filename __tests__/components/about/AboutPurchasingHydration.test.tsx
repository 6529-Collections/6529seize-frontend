import About from "@/components/about/About";
import { AboutSection } from "@/types/enums";
import { act } from "@testing-library/react";
import { useEffect } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

// Real visibility hook, gate and platform hook. Only the native bridge, the
// country and the section bodies are replaced.
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

const SECTIONS = [
  [AboutSection.MINTING, "Minting"],
  [AboutSection.SUBSCRIPTIONS, "Subscription Minting"],
] as const;

let container: HTMLDivElement;
let root: Root | null = null;
let onRecoverableError: jest.Mock;

// The route renders About inside <main>, so leftover server nodes are checked.
function page(section: AboutSection) {
  return (
    <main>
      <About section={section} />
    </main>
  );
}

function main() {
  return container.querySelector("main");
}

// The server is never the native shell, so Capacitor reports web there.
function serverHtml(section: AboutSection) {
  const platform = mockNativePlatform;
  mockNativePlatform = "web";
  const html = renderToString(page(section));
  mockNativePlatform = platform;
  return html;
}

async function hydrate(section: AboutSection) {
  container.innerHTML = serverHtml(section);
  // Only browser renders and effects count from here on.
  mockMount.mockClear();
  mockRequest.mockClear();
  await act(async () => {
    root = hydrateRoot(container, page(section), { onRecoverableError });
  });
}

async function settleCountry(section: AboutSection, country: string) {
  mockCountry = country;
  mockIsCountryPending = false;
  await act(async () => {
    root?.render(page(section));
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
  it("keeps the section out of the server HTML, which is the same for every visitor", () => {
    const html = serverHtml(section);
    expect(html).not.toContain(`<h1>${title}</h1>`);
    // Only the blank space that keeps the footer out of view until it mounts.
    expect(html).toBe(
      '<main><div aria-hidden="true" class="tw-min-h-[calc(100dvh-100px)]"></div></main>'
    );
    expect(mockMount).not.toHaveBeenCalled();
  });

  it.each([
    ["web", "web"],
    ["Android", "android"],
  ] as const)(
    "mounts the section on %s right after hydration without waiting for the country",
    async (_label, platform) => {
      mockNativePlatform = platform;

      await hydrate(section);

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(main()?.querySelector("h1")?.textContent).toBe(title);
      expect(mockRequest).toHaveBeenCalledWith(title);
      expect(mockReplace).not.toHaveBeenCalled();
    }
  );

  describe("in the iOS app", () => {
    beforeEach(() => {
      mockNativePlatform = "ios";
    });

    it.each([
      ["outside the US", "FR"],
      ["with an unknown country", ""],
    ])(
      "redirects to /about without mounting the section %s",
      async (_label, country) => {
        await hydrate(section);

        expect(onRecoverableError).not.toHaveBeenCalled();
        expect(main()).toBeEmptyDOMElement();
        expect(mockReplace).not.toHaveBeenCalled();

        await settleCountry(section, country);

        expect(main()).toBeEmptyDOMElement();
        expect(mockMount).not.toHaveBeenCalled();
        expect(mockRequest).not.toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith("/about");
      }
    );

    it("shows the section in the US once the country check settles", async () => {
      await hydrate(section);
      expect(mockMount).not.toHaveBeenCalled();

      await settleCountry(section, "US");

      expect(main()?.querySelector("h1")?.textContent).toBe(title);
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
