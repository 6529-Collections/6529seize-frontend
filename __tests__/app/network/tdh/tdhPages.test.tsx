import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import VerificationDayPage from "@/app/network/tdh/verification/[cycleDay]/page";
import DayNotFoundPage from "@/app/network/tdh/verification/day-not-found/page";
import VerificationPage, {
  generateMetadata as generateVerificationMetadata,
} from "@/app/network/tdh/verification/page";
import { PUBLIC_TDH_FEED_BASE } from "@/lib/tdh/verification/feedSource";
import {
  PUBLIC_FEED_DAYS,
  PUBLIC_FEED_INDEX,
} from "../../../lib/tdh/verification/publicFeedFixture";

const notFound = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/network/tdh",
  useSearchParams: () => ({ get: () => null }),
  notFound: () => notFound(),
}));
jest.mock("@/contexts/TitleContext", () => ({
  __esModule: true,
  useSetTitle: jest.fn(),
  useTitle: () => ({ setTitle: jest.fn() }),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: "US" }),
  useOptionalCookieConsent: () => ({ country: "US" }),
}));
jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({ appWalletsSupported: false }),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

/**
 * The pages read 6529's public feed; tests serve its first published days
 * from a verbatim copy, and no proof manifest (403, as CloudFront answers
 * for a file not yet published), so the formal page shows its bundled copy.
 */
function serveFeed(formalManifest?: unknown) {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (
      formalManifest !== undefined &&
      url === `${PUBLIC_TDH_FEED_BASE}formal/manifest.json`
    ) {
      return jsonResponse(formalManifest);
    }
    if (url === `${PUBLIC_TDH_FEED_BASE}index.json`) {
      return jsonResponse(PUBLIC_FEED_INDEX);
    }
    const day = /days\/(\d+)\.json$/.exec(url)?.[1];
    const file = day === undefined ? undefined : PUBLIC_FEED_DAYS[Number(day)];
    if (file) {
      return jsonResponse(file);
    }
    return jsonResponse({ error: "AccessDenied" }, 403);
  }) as unknown as typeof fetch;
}

function renderPage(element: ReactElement) {
  return render(element);
}

// The pages read the reader's language from Accept-Language (the kit's
// resolveExplainedLocale); these tests read as an English browser.
jest.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) => (name === "accept-language" ? "en-US" : null),
  }),
}));

describe("TDH sub-pages", () => {
  const realFetch = globalThis.fetch;
  beforeEach(() => {
    jest.clearAllMocks();
    serveFeed();
  });
  afterAll(() => {
    globalThis.fetch = realFetch;
  });

  it("renders the daily check and its receipts, and 404s an unknown day", async () => {
    const { unmount } = renderPage(
      await VerificationPage({ searchParams: Promise.resolve({}) })
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "The daily check" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/sample/i)).toBeNull();
    expect(screen.getAllByText("Equal").length).toBeGreaterThan(0);
    unmount();

    renderPage(
      await VerificationDayPage({
        params: Promise.resolve({ cycleDay: "20740" }),
        searchParams: Promise.resolve({}),
      })
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "The result dated October 14, 2026",
      })
    ).toBeInTheDocument();

    await expect(
      VerificationDayPage({
        params: Promise.resolve({ cycleDay: "1" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(
      VerificationDayPage({
        params: Promise.resolve({ cycleDay: "abc" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("sets the daily check's metadata", () => {
    const metadata = generateVerificationMetadata();
    expect(metadata.title).toBe("The daily check · 6529 Explained");
  });

  it("names the day asked for on the not-found view, and when a future cycle closes", async () => {
    const { unmount } = renderPage(
      await DayNotFoundPage({ searchParams: Promise.resolve({ day: "20739" }) })
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "No published day 20,739" })
    ).toBeInTheDocument();
    // A cycle before the feed's first day says so, with its date, and
    // points to 6529.io's own uploads for the days before the comparison.
    expect(document.querySelector("[data-ex-lede]")).toHaveTextContent(
      "Cycle 20,739 (October 13, 2026) is before the first published day, October 14, 2026 (cycle 20,740)."
    );
    expect(
      screen.getByRole("link", { name: "6529.io's consolidated uploads" })
    ).toHaveAttribute("href", "https://api.6529.io/api/consolidated_uploads");
    expect(document.body.textContent).not.toMatch(/TDH-v1/);
    // The way on: the latest result and the daily check, in the site's frame.
    const back = screen.getAllByRole("link", { name: "The daily check" });
    expect(back.length).toBeGreaterThan(0);
    for (const link of back) {
      expect(link).toHaveAttribute("href", "/network/tdh/verification");
    }
    unmount();

    const { unmount: unmount2 } = renderPage(
      await DayNotFoundPage({ searchParams: Promise.resolve({ day: "99999" }) })
    );
    expect(document.querySelector("[data-ex-lede]")?.textContent).toMatch(
      /Cycle 99,999 closes at 00:00 UTC on .*, so it has no result yet\. Each result is published about .* after its snapshot\./
    );
    // The days before the comparison are only a question for a day before it.
    expect(
      screen.queryByRole("link", { name: "6529.io's consolidated uploads" })
    ).not.toBeInTheDocument();
    unmount2();

    // An address that is not a cycle number is never echoed into the
    // page: the title is the plain one, whatever the link says.
    renderPage(
      await DayNotFoundPage({
        searchParams: Promise.resolve({
          day: "Your-TDH-was-reset-contact-support-now",
        }),
      })
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "No published day here" })
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Your-TDH|contact-support/);
  });
});
