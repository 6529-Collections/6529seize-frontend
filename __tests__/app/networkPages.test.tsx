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

  it("renders TDH page", async () => {
    renderWithAuth(await TDHPage());
    // The promise is the heading; "TDH" is the eyebrow above it.
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Total Days Held: the art you hold, and how long you have held it.",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "TDH in a minute" })
    ).toBeInTheDocument();
    // The boost is the factor the reader changes: the card's TDH with one
    // Gradient, then with none and with a full set instead.
    const user = userEvent.setup();
    const choice = screen.getByRole("group", {
      name: "What else the collector holds",
    });
    expect(
      within(choice).getByRole("button", { name: "One Gradient" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("= 1,296 TDH")).toBeInTheDocument();
    await user.click(
      within(choice).getByRole("button", { name: "No Gradient" })
    );
    expect(screen.getByText("= 1,271 TDH")).toBeInTheDocument();
    await user.click(
      within(choice).getByRole("button", { name: "A full set" })
    );
    expect(screen.getByText("= 2,288 TDH")).toBeInTheDocument();
    expect(
      screen.getByText("With a full set instead, boost 1.80")
    ).toBeInTheDocument();
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
      screen.getByText(/It counts toward your Level, and is checked in public/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/votes in waves/)).not.toBeInTheDocument();
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
    // The strip near the top: the track record in bold, saying what is
    // equal to what, with the latest day and the comparison one link away;
    // the history's limit is said once, in the section below.
    expect(
      screen.getByText(
        "Recomputed independently every day: equal to 6529.io on 2 of 2 published days"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("· latest Oct 15")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: "History read from public servers, taken as reported",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "See the comparison" })
    ).toHaveAttribute("href", "/network/tdh/verification");
    // The proof panel: the latest day's figures and every published day as
    // a dot.
    expect(
      screen.getByText("Latest day: October 15, 2026")
    ).toBeInTheDocument();
    expect(screen.getAllByText("10,282 of 10,282").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("list", { name: "Every published day, oldest first" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Fixed before the cutover",
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Not yet fully checked").length).toBeGreaterThan(
      0
    );
    expect(screen.queryByText(/sample/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/reproduce all 89 conformance vectors/)
    ).toBeInTheDocument();
    // The Lean card says where the property stops: a mint and its burn
    // inside one transaction (P26 §7.1, counterexamples H and I).
    expect(
      screen.getByText(
        /cannot change who holds which copies since when\. A mint and its burn there can still change eligibility/
      )
    ).toBeInTheDocument();
    // The day's builds come from its file, in the section's "How"
    // disclosure, not in the newcomer's first screen.
    expect(
      screen.getAllByText(
        /Builds: Rust core validator@e127676, Python reference 6529chain@0621ed4/
      )
    ).toHaveLength(1);
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
      `What TDH is, how to read your own, and how it is calculated, specified, proved and checked against 6529.io every day. | ${domain}`
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
