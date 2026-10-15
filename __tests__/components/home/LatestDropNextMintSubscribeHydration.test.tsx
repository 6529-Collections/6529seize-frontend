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
