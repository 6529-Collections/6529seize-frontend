import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

// Real gate, visibility hook and platform hook.
// Only the native bridge, the country check and the router are replaced.
type Platform = "ios" | "android" | "web";
let mockNativePlatform: Platform = "web";
let mockCountry: string | undefined;
let mockIsCountryPending = true;
const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
const mockMount = jest.fn();

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
  useRouter: () => mockRouter,
}));

function PurchasingContent() {
  mockMount();
  return <button>Mint</button>;
}

const page = () => (
  <main>
    <NftPurchasingGate
      redirectTo="/about"
      placeholder={<div data-testid="purchasing-space" />}
    >
      <PurchasingContent />
    </NftPurchasingGate>
  </main>
);

let container: HTMLDivElement;
let root: Root | undefined;
let recoverableErrors: unknown[];

// The server is never the native shell, so Capacitor reports web there.
function serverHtml() {
  const platform = mockNativePlatform;
  mockNativePlatform = "web";
  const html = renderToString(page());
  mockNativePlatform = platform;
  return html;
}

async function hydrate() {
  container.innerHTML = serverHtml();
  await act(async () => {
    root = hydrateRoot(container, page(), {
      onRecoverableError: (error) => recoverableErrors.push(error),
    });
  });
}

async function settleCountry(country: string) {
  mockCountry = country;
  mockIsCountryPending = false;
  await act(async () => {
    root?.render(page());
  });
}

const space = () => container.querySelector('[data-testid="purchasing-space"]');

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.localStorage.clear();
  mockNativePlatform = "web";
  mockCountry = undefined;
  mockIsCountryPending = true;
  recoverableErrors = [];
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  container.remove();
});

it("reserves only blank space in the server HTML", () => {
  mockNativePlatform = "ios";

  expect(serverHtml()).toBe(
    '<main><div data-testid="purchasing-space"></div></main>'
  );
  expect(mockMount).not.toHaveBeenCalled();
});

describe("in the iOS app while the country check is pending", () => {
  beforeEach(() => {
    mockNativePlatform = "ios";
  });

  it.each(["US", "FR", ""])(
    "redirects through hydration even if the country later resolves to %s",
    async (country) => {
      await hydrate();

      expect(recoverableErrors).toEqual([]);
      expect(space()).toBeNull();
      expect(mockMount).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/about");

      await settleCountry(country);

      expect(container.querySelector("main")).toBeEmptyDOMElement();
      expect(mockMount).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledTimes(1);
    }
  );
});

it.each([
  ["web", "web"],
  ["Android", "android"],
] as const)(
  "mounts the content right after hydration on %s, while the country lookup is pending",
  async (_label, platform) => {
    mockNativePlatform = platform;

    await hydrate();

    expect(recoverableErrors).toEqual([]);
    expect(space()).toBeNull();
    expect(container.querySelector("button")?.textContent).toBe("Mint");
    expect(mockReplace).not.toHaveBeenCalled();
  }
);
