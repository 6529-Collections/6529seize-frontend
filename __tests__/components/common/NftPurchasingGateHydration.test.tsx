import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import { rememberCountryHint } from "@/components/cookies/usCountryHint";
import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

// Real gate, visibility hook, platform hook and US country hint (localStorage).
// Only the native bridge, the country check and the router are replaced.
type Platform = "ios" | "android" | "web";
let mockNativePlatform: Platform = "web";
let mockCountry: string | undefined;
let mockIsCountryPending = true;
const mockReplace = jest.fn();
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
  useRouter: () => ({ replace: mockReplace }),
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

it.each([
  ["with", true],
  ["without", false],
] as const)(
  "renders the same server HTML %s a stored US hint and reads it only after hydration",
  (_label, hasHint) => {
    if (hasHint) rememberCountryHint("US");
    mockNativePlatform = "ios";
    const getItem = jest.spyOn(Storage.prototype, "getItem");

    expect(serverHtml()).toBe(
      '<main><div data-testid="purchasing-space"></div></main>'
    );
    expect(getItem).not.toHaveBeenCalled();
    expect(mockMount).not.toHaveBeenCalled();
    getItem.mockRestore();
  }
);

describe("in the iOS app while the country check is pending", () => {
  beforeEach(() => {
    mockNativePlatform = "ios";
  });

  it("keeps the space through hydration on a device whose last check was US", async () => {
    rememberCountryHint("US");

    await hydrate();

    expect(recoverableErrors).toEqual([]);
    expect(space()).not.toBeNull();
    expect(mockMount).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    await settleCountry("US");

    expect(space()).toBeNull();
    expect(container.querySelector("button")?.textContent).toBe("Mint");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it.each([
    ["outside the US", "FR"],
    ["with an unknown country", ""],
  ])(
    "collapses the space and redirects without mounting %s",
    async (_label, country) => {
      rememberCountryHint("US");
      await hydrate();

      await settleCountry(country);

      expect(recoverableErrors).toEqual([]);
      expect(container.querySelector("main")).toBeEmptyDOMElement();
      expect(mockMount).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/about");
    }
  );

  it("drops the space after hydration on a device without a US hint", async () => {
    await hydrate();

    expect(recoverableErrors).toEqual([]);
    expect(container.querySelector("main")).toBeEmptyDOMElement();
    expect(mockMount).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

it.each([
  ["web", "web"],
  ["Android", "android"],
] as const)(
  "mounts the content right after hydration on %s, ignoring a stale hint and the pending country",
  async (_label, platform) => {
    rememberCountryHint("FR");
    mockNativePlatform = platform;

    await hydrate();

    expect(recoverableErrors).toEqual([]);
    expect(space()).toBeNull();
    expect(container.querySelector("button")?.textContent).toBe("Mint");
    expect(mockReplace).not.toHaveBeenCalled();
  }
);
