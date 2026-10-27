import LatestDropNextMintSubscribe from "@/components/home/now-minting/LatestDropNextMintSubscribe";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

// Real platform detection, visibility hook and queries: only the native
// bridge, the country, auth and the network call are mocked.
let mockNativePlatform: "ios" | "android" | "web" = "ios";
let mockCountry = "";
let mockIsCountryPending = true;

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
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { consolidation_key: "profile-key" },
    activeProfileProxy: null,
    isAuthenticated: true,
    requestAuth: jest.fn(),
    setToast: jest.fn(),
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeConnectFresh: jest.fn() }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("next/link", () => {
  const { mockNextLinkComponent } = jest.requireActual(
    "@/__tests__/utils/nextLinkMock"
  );
  return { __esModule: true, default: mockNextLinkComponent };
});
jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  __esModule: true,
  getCanonicalNextMintNumber: jest.fn(() => 478),
  getUpcomingMintsAcrossSeasons: jest.fn(() => []),
  isMintingToday: jest.fn(() => false),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const fetchMock = jest.mocked(commonApiFetch);
const REQUESTED_ENDPOINTS = [
  "subscriptions/consolidation/upcoming-memes/478/profile-key",
  "subscriptions/consolidation/coverage/profile-key",
  "subscriptions/memes/478/count",
];

let container: HTMLDivElement;
let root: Root | null = null;
let queryClient: QueryClient;

const tree = () => (
  <QueryClientProvider client={queryClient}>
    <LatestDropNextMintSubscribe />
  </QueryClientProvider>
);

const requestedEndpoints = () =>
  fetchMock.mock.calls.map(([request]) => request.endpoint);

async function hydrateFromServerHtml() {
  container.innerHTML = renderToString(tree());
  await act(async () => {
    root = hydrateRoot(container, tree());
  });
}

async function settleCountry(country: string) {
  mockCountry = country;
  mockIsCountryPending = false;
  await act(async () => {
    root?.render(tree());
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockNativePlatform = "ios";
  mockCountry = "";
  mockIsCountryPending = true;
  fetchMock.mockReturnValue(new Promise(() => undefined));
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  jest.restoreAllMocks();
  act(() => root?.unmount());
  root = null;
  queryClient.clear();
  container.remove();
});

describe("Home subscription row requests around hydration", () => {
  it("starts no subscription request on iOS while the country is pending", async () => {
    await hydrateFromServerHtml();

    expect(requestedEndpoints()).toEqual([]);
  });

  it("requests subscription status once iOS resolves to US", async () => {
    await hydrateFromServerHtml();
    expect(requestedEndpoints()).toEqual([]);

    await settleCountry("US");

    expect(requestedEndpoints().sort()).toEqual(
      [...REQUESTED_ENDPOINTS].sort()
    );
  });

  it.each([
    ["a non-US country", "FR"],
    ["an unknown country", ""],
  ])(
    "never requests subscription status on iOS when the country resolves to %s",
    async (_label, country) => {
      await hydrateFromServerHtml();

      await settleCountry(country);

      expect(requestedEndpoints()).toEqual([]);
      expect(container).toBeEmptyDOMElement();
    }
  );

  it.each(["web", "android"] as const)(
    "requests subscription status on %s after hydration without waiting for the country",
    async (platform) => {
      mockNativePlatform = platform;

      await hydrateFromServerHtml();

      expect(requestedEndpoints().sort()).toEqual(
        [...REQUESTED_ENDPOINTS].sort()
      );
    }
  );
});

const SPACE_TEST_ID = "meme-subscription-awareness-row-space";
const ROW_LABEL = "Subscription Minting";
const spaceElement = () =>
  container.querySelector(`[data-testid='${SPACE_TEST_ID}']`);

describe("Home subscription row visibility around hydration", () => {
  it.each(["web", "android", "ios"] as const)(
    "keeps the row out of the server HTML on %s and reserves only blank space",
    (platform) => {
      mockNativePlatform = platform;

      container.innerHTML = renderToString(tree());

      expect(container).not.toHaveTextContent(ROW_LABEL);
      expect(container.querySelector("a, button, svg, img")).toBeNull();
      const space = spaceElement();
      expect(space).not.toBeNull();
      expect(space).toHaveTextContent("");
      expect(space).toHaveAttribute("aria-hidden", "true");
      expect(space).toHaveClass("tw-@container/subscription");
      expect(space?.firstElementChild).toBeEmptyDOMElement();
      expect(space?.firstElementChild).toHaveClass(
        "tw-h-[7.375rem]",
        "@[14.125rem]/subscription:tw-h-[6.375rem]",
        "@[19.5rem]/subscription:tw-h-[5.375rem]"
      );
    }
  );

  it.each(["web", "android"] as const)(
    "swaps the blank space for the row on %s right after hydration",
    async (platform) => {
      mockNativePlatform = platform;
      container.innerHTML = renderToString(tree());
      expect(spaceElement()).not.toBeNull();
      expect(container).not.toHaveTextContent(ROW_LABEL);

      await hydrateFromServerHtml();

      expect(container).toHaveTextContent(ROW_LABEL);
      expect(spaceElement()).toBeNull();
    }
  );

  it("renders nothing, not even blank space, on iOS while the country is pending after hydration", async () => {
    await hydrateFromServerHtml();

    expect(container).toBeEmptyDOMElement();
  });

  it("inserts the row once iOS resolves to US", async () => {
    await hydrateFromServerHtml();
    expect(container).toBeEmptyDOMElement();

    await settleCountry("US");

    expect(container).toHaveTextContent(ROW_LABEL);
    expect(spaceElement()).toBeNull();
  });

  it.each([
    ["a non-US country", "FR"],
    ["an unknown country", ""],
  ])(
    "keeps iOS empty before and after the country resolves to %s",
    async (_label, country) => {
      await hydrateFromServerHtml();
      expect(container).toBeEmptyDOMElement();

      await settleCountry(country);

      expect(container).toBeEmptyDOMElement();
    }
  );
});

describe("Home subscription row with a remembered US country", () => {
  const HINT_KEY = "6529:us-country-hint";
  const rememberUs = () => window.localStorage.setItem(HINT_KEY, "US");
  const expectOnlyBlankSpace = () => {
    expect(spaceElement()).not.toBeNull();
    expect(container).not.toHaveTextContent(ROW_LABEL);
    expect(container.querySelector("a, button, svg, img")).toBeNull();
  };

  it("keeps blank space on iOS through the pending window and shows no purchasing UI or requests", async () => {
    rememberUs();

    await hydrateFromServerHtml();

    expectOnlyBlankSpace();
    expect(requestedEndpoints()).toEqual([]);
  });

  it("swaps the blank space for the row, and only then requests, once iOS resolves to US", async () => {
    rememberUs();
    await hydrateFromServerHtml();
    expectOnlyBlankSpace();

    await settleCountry("US");

    expect(container).toHaveTextContent(ROW_LABEL);
    expect(spaceElement()).toBeNull();
    expect(requestedEndpoints().sort()).toEqual(
      [...REQUESTED_ENDPOINTS].sort()
    );
  });

  it.each([
    ["a non-US country", "FR"],
    ["an unknown country", ""],
  ])(
    "collapses once and never requests when iOS resolves to %s",
    async (_label, country) => {
      rememberUs();
      await hydrateFromServerHtml();
      expectOnlyBlankSpace();

      await settleCountry(country);

      expect(container).toBeEmptyDOMElement();
      expect(requestedEndpoints()).toEqual([]);
    }
  );

  it.each([
    ["no remembered country", () => undefined],
    [
      "a remembered non-US country",
      () => window.localStorage.setItem(HINT_KEY, "FR"),
    ],
  ])("shows nothing on iOS while pending with %s", async (_label, seed) => {
    seed();

    await hydrateFromServerHtml();

    expect(container).toBeEmptyDOMElement();
    expect(requestedEndpoints()).toEqual([]);
  });

  it("falls back to showing nothing on iOS when storage throws", async () => {
    rememberUs();
    const getItem = Storage.prototype.getItem;
    // Only the hint read fails; other storage consumers in the row keep working.
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      key: string
    ) {
      if (this === window.localStorage && key === HINT_KEY) {
        throw new Error("storage blocked");
      }
      return getItem.call(this, key);
    });

    await hydrateFromServerHtml();

    expect(container).toBeEmptyDOMElement();
    expect(requestedEndpoints()).toEqual([]);

    await settleCountry("US");

    expect(container).toHaveTextContent(ROW_LABEL);
  });

  it.each(["web", "android"] as const)(
    "does not need the remembered country on %s",
    async (platform) => {
      mockNativePlatform = platform;

      await hydrateFromServerHtml();

      expect(container).toHaveTextContent(ROW_LABEL);
      expect(spaceElement()).toBeNull();
    }
  );
});
