import UserPageHeaderSubscriptionStatus from "@/components/user/user-page-header/UserPageHeaderSubscriptionStatus";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

// Real platform detection and a real coverage query: only the native bridge,
// the country and the network call are mocked.
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
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const fetchMock = jest.mocked(commonApiFetch);
const profile = {
  consolidation_key: "profile-key",
  normalised_handle: "sesamenoodles",
} as ApiIdentity;

let container: HTMLDivElement;
let root: Root | null = null;
let queryClient: QueryClient;

const tree = () => (
  <QueryClientProvider client={queryClient}>
    <UserPageHeaderSubscriptionStatus profile={profile} layout="subtle" />
  </QueryClientProvider>
);

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
  // Never settles, so the row stays in its loading state when it is shown.
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

describe("profile header subscription status around hydration", () => {
  it("renders nothing on the server and starts no request before the platform is known", () => {
    expect(renderToString(tree())).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("starts no coverage request on iOS while the country is pending", async () => {
    await hydrateFromServerHtml();

    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("starts the coverage request once iOS resolves to US", async () => {
    await hydrateFromServerHtml();
    expect(fetchMock).not.toHaveBeenCalled();

    await settleCountry("US");

    expect(container).not.toBeEmptyDOMElement();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "subscriptions/consolidation/coverage/profile-key",
      })
    );
  });

  it.each([
    ["a non-US country", "FR"],
    ["an unknown country", ""],
  ])(
    "never starts a coverage request on iOS when the country resolves to %s",
    async (_label, country) => {
      await hydrateFromServerHtml();

      await settleCountry(country);

      expect(container).toBeEmptyDOMElement();
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it.each(["web", "android"] as const)(
    "shows the row and requests coverage on %s after hydration without waiting for the country",
    async (platform) => {
      mockNativePlatform = platform;

      await hydrateFromServerHtml();

      expect(container).not.toBeEmptyDOMElement();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  );
});
