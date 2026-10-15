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
import { renderWithQueryClient } from "../utils/reactQuery";
import React from "react";

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

  it("renders TDH page", async () => {
    renderWithAuth(await TDHPage());
    expect(
      screen.getByRole("heading", { level: 1, name: "TDH" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "TDH in a minute" })
    ).toBeInTheDocument();
    expect(screen.getByText("= 1,296 TDH from this card")).toBeInTheDocument();
    expect(
      screen.getByText(/The Gradient earns TDH of its own on top/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Explain my TDH" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Glossary" })
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "TDH pages" })).getByRole(
        "link",
        { name: "Glossary" }
      )
    ).toHaveAttribute("href", "/network/tdh#glossary");
    expect(
      screen.getByText(/can weight your votes in waves that vote with TDH/)
    ).toBeInTheDocument();
  });

  it("links the step-by-step calculation and shows the checked-daily section", async () => {
    renderWithAuth(await TDHPage());
    expect(screen.getAllByText(/Total Days Held/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", {
        name: /Every step, with examples you can change/,
      })
    ).toHaveAttribute("href", "/network/tdh/how-it-works");
    expect(
      screen.getAllByRole("link", { name: /How TDH is calculated/ })[0]
    ).toHaveAttribute("href", "/network/tdh/how-it-works");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Checked daily, in public",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /10,282 of 10,282 collectors equal between the Rust core and 6529.io/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Checked daily in public: on/ })
    ).toHaveAttribute("href", "/network/tdh/verification");
    expect(screen.getByText(/61 conformance vectors/)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "The exact calculation has moved" })
    ).not.toBeInTheDocument();
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
    const metadata = await generateTDHMetadata();
    expect(metadata.title).toEqual("TDH: Total Days Held | Network");
    expect(metadata.description).toEqual(
      `What TDH is, how to read your own, and how it is calculated, specified, proved and checked every day. | ${domain}`
    );
  });

  it("generates metadata for Definitions page", async () => {
    const metadata = await generateDefinitionsMetadata();
    expect(metadata.title).toEqual("Definitions | Network");
    expect(metadata.description).toEqual(`Network | ${domain}`);
  });

  it("generates metadata for Wave Score page", async () => {
    const metadata = await generateWaveScoreMetadata();
    expect(metadata.title).toEqual("Wave Score | Network");
    expect(metadata.description).toEqual(
      `Network wave score formula and calculator | ${domain}`
    );
  });
});
