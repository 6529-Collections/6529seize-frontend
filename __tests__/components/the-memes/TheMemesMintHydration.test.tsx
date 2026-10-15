import TheMemesMint from "@/components/the-memes/TheMemesMint";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

// Real platform detection: useCapacitor, useNftPurchasingVisibility and
// NftPurchasingGate are not mocked; only the native bridge and country are.
let mockNativePlatform: "ios" | "android" | "web" = "ios";
let mockCountry = "";
let mockIsCountryPending = true;
const mockReplace = jest.fn();
const mockSetTitle = jest.fn();
const mockManifoldMinting = jest.fn();
const mockUseDropForgeMintingConfig = jest.fn(() => ({
  contract: "0x123",
  chain: { id: 1 },
}));

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
jest.mock("next/dynamic", () => () => {
  return function MockManifoldMinting() {
    mockManifoldMinting();
    return <div data-testid="mint-flow" />;
  };
});
jest.mock("@/components/drop-forge/drop-forge-config", () => ({
  useDropForgeMintingConfig: () => mockUseDropForgeMintingConfig(),
}));
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({ setTitle: mockSetTitle }),
}));

const nft = {
  id: 123,
  name: "First film",
  animation: null,
  metadata: {},
  mint_date: null,
} as unknown as ApiMemesExtendedData;

let container: HTMLDivElement;
let root: Root | null = null;

function expectNoMintHooks() {
  expect(mockManifoldMinting).not.toHaveBeenCalled();
  expect(mockUseDropForgeMintingConfig).not.toHaveBeenCalled();
  expect(mockSetTitle).not.toHaveBeenCalled();
}

async function hydrateFromServerHtml() {
  container.innerHTML = renderToString(<TheMemesMint nft={nft} />);
  await act(async () => {
    root = hydrateRoot(container, <TheMemesMint nft={nft} />);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNativePlatform = "ios";
  mockCountry = "";
  mockIsCountryPending = true;
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  container.remove();
});

it("renders no server HTML and mounts no mint hooks before the platform is known", () => {
  expect(renderToString(<TheMemesMint nft={nft} />)).toBe("");
  expectNoMintHooks();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("keeps a hydrated iOS page empty without redirecting while the country is pending", async () => {
  await hydrateFromServerHtml();

  expect(container).toBeEmptyDOMElement();
  expectNoMintHooks();
  expect(mockReplace).not.toHaveBeenCalled();

  mockCountry = "US";
  mockIsCountryPending = false;
  await act(async () => {
    root?.render(<TheMemesMint nft={nft} />);
  });

  expect(container.querySelector("[data-testid='mint-flow']")).not.toBeNull();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("redirects a hydrated iOS page once the country resolves outside the US", async () => {
  await hydrateFromServerHtml();
  expect(mockReplace).not.toHaveBeenCalled();

  mockCountry = "FR";
  mockIsCountryPending = false;
  await act(async () => {
    root?.render(<TheMemesMint nft={nft} />);
  });

  expect(container).toBeEmptyDOMElement();
  expectNoMintHooks();
  expect(mockReplace).toHaveBeenCalledWith("/the-memes");
});

it("renders the mint flow on web after hydration without waiting for the country", async () => {
  mockNativePlatform = "web";

  await hydrateFromServerHtml();

  expect(container.querySelector("[data-testid='mint-flow']")).not.toBeNull();
  expect(mockReplace).not.toHaveBeenCalled();
});
