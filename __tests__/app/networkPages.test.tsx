import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import DefinitionsPage, {
  generateMetadata as generateDefinitionsMetadata,
} from "@/app/network/definitions/page";
import TDHPage, {
  generateMetadata as generateTDHMetadata,
} from "@/app/network/tdh/page";
import NetworkWaveScorePage, {
  generateMetadata as generateWaveScoreMetadata,
} from "@/app/network/wave-score/page";
import { AuthContext } from "@/components/auth/Auth";
import { publicEnv } from "@/config/env";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "../utils/reactQuery";
import React from "react";
import { PUBLIC_TDH_FEED_BASE } from "@/lib/tdh/verification/feedSource";
import {
  PUBLIC_FEED_DAYS,
  PUBLIC_FEED_INDEX,
} from "../lib/tdh/verification/publicFeedFixture";

// The overview reads 6529's public feed; serve its first published days.
const realFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const day = /days\/(\d+)\.json$/.exec(url)?.[1];
    const body =
      url === `${PUBLIC_TDH_FEED_BASE}index.json`
        ? PUBLIC_FEED_INDEX
        : day === undefined
          ? undefined
          : PUBLIC_FEED_DAYS[Number(day)];
    return {
      ok: body !== undefined,
      status: body === undefined ? 403 : 200,
      json: async () => body ?? { error: "AccessDenied" },
    } as Response;
  }) as unknown as typeof fetch;
});
afterAll(() => {
  globalThis.fetch = realFetch;
});

// ✅ Mock next/navigation
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
  usePathname: () => "/network",
}));

jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: "US" }),
  useOptionalCookieConsent: () => ({ country: "US" }),
}));

jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ appWalletsSupported: false }),
}));

// ✅ AuthContext mock
const mockAuthContext = {
  connectedProfile: null,
  activeProfileProxy: null,
  requestAuth: jest.fn(),
} as any;

function renderWithAuth(component: React.ReactElement) {
  return renderWithQueryClient(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>,
    { clientConfig: { defaultOptions: { queries: { enabled: false } } } }
  );
}

// ✅ TitleContext mock
const mockSetTitle = jest.fn();
jest.mock("@/contexts/TitleContext", () => ({
  __esModule: true,
  useTitle: () => ({
    title: "Test Title",
    setTitle: mockSetTitle,
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
  }),
  useSetTitle: () => mockSetTitle,
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("network pages render", () => {
  const domain = new URL(publicEnv.BASE_ENDPOINT).hostname;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the TDH overview, chapter 01 of 6529 Explained", async () => {
    // The fixture facts render without the network; the distribution figure
    // streams from 6529.io's API, so a review link turns it off here.
    renderWithAuth(
      await TDHPage({
        searchParams: Promise.resolve({
          facts: "fixture",
          distribution: "off",
          locale: "en-US",
        }),
      })
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Total Days Held" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /How it is calculated/ })[0]
    ).toHaveAttribute("href", "/network/tdh/how-it-works");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Checked every day, with the files to check it.",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Why did my TDH change\?/ })
    ).toHaveAttribute("href", "/network/tdh/consolidation#why");
  });

  it("renders Definitions page", () => {
    renderWithAuth(<DefinitionsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /^Definitions$/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/Cards Collected/i)).toBeInTheDocument();
    expect(screen.getByText(/Unique Memes/i)).toBeInTheDocument();
  });

  it("renders Wave Score page under About network reputation", async () => {
    const page = await NetworkWaveScorePage({});
    renderWithAuth(page);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Wave score transparency/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("About / Network & Reputation / Wave Score")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Calculate a wave" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Quality").length).toBeGreaterThan(0);
  });

  it("uses a safe Wave Score return link when provided", async () => {
    const page = await NetworkWaveScorePage({
      searchParams: Promise.resolve({ returnTo: "/waves/test-wave" }),
    });
    renderWithAuth(page);

    expect(screen.getByRole("link", { name: "Back to wave" })).toHaveAttribute(
      "href",
      "/waves/test-wave"
    );
  });

  it("generates metadata for TDH page", async () => {
    const metadata = await generateTDHMetadata({
      searchParams: Promise.resolve({ locale: "en-US" }),
    });
    expect(metadata.title).toEqual("Total Days Held · 6529 Explained");
    expect(metadata.description).toEqual(
      `What TDH is, what it is for, and how it is checked every day. | ${domain}`
    );
  });

  it("generates metadata for Definitions page", async () => {
    const metadata = await generateDefinitionsMetadata();
    expect(metadata.title).toEqual("Definitions | Network");
    expect(metadata.description).toEqual(
      `${t(DEFAULT_LOCALE, "pageMetadata.networkDefinitions.description")} | ${domain}`
    );
  });

  it("generates metadata for Wave Score page", async () => {
    const metadata = await generateWaveScoreMetadata();
    expect(metadata.title).toEqual("Wave Score | Network");
    expect(metadata.description).toEqual(
      `Network wave score formula and calculator | ${domain}`
    );
  });
});
