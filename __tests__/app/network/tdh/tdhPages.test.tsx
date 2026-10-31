import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import HowItWorksPage from "@/app/network/tdh/how-it-works/page";
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

describe("TDH sub-pages", () => {
  const realFetch = globalThis.fetch;
  beforeEach(() => {
    jest.clearAllMocks();
    serveFeed();
  });
  afterAll(() => {
    globalThis.fetch = realFetch;
  });

  it("renders How TDH is calculated with fourteen steps and live explorables", async () => {
    const user = userEvent.setup();
    renderPage(await HowItWorksPage());
    expect(
      screen.getByRole("heading", { level: 1, name: "How TDH is calculated" })
    ).toBeInTheDocument();
    for (let step = 1; step <= 14; step += 1) {
      expect(document.getElementById(`step-${step}`)).not.toBeNull();
    }
    expect(
      screen.getByRole("navigation", { name: "TDH pages" })
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "TDH pages" })).getByRole(
        "link",
        { name: "How it works" }
      )
    ).toHaveAttribute("aria-current", "page");

    const builder = screen.getByRole("region", {
      name: "Build a collection and see its boost",
    });
    expect(within(builder).getByText("Boost 1.02")).toBeInTheDocument();
    await user.click(
      within(builder).getByRole("button", { name: "Increase Gradients" })
    );
    expect(within(builder).getByText("Boost 1.04")).toBeInTheDocument();
    await user.click(
      within(builder).getByRole("button", { name: "Increase Full sets" })
    );
    expect(within(builder).getByText("Boost 1.84")).toBeInTheDocument();
    expect(
      within(builder).getByRole("button", { name: "Season 2" })
    ).toBeDisabled();
    expect(
      within(builder).getByRole("button", { name: "Season 2" })
    ).toHaveAttribute("aria-pressed", "true");

    const household = screen.getByRole("region", {
      name: "Change the household and see its TDH",
    });
    expect(
      within(household).getByText(/tomorrow it rises by 114/)
    ).toBeInTheDocument();
    await user.click(
      within(household).getByRole("button", { name: "As two wallets" })
    );
    expect(
      within(household).getByText(/16,246 and 3,828, together 20,074/)
    ).toBeInTheDocument();
    await user.click(
      within(household).getByRole("button", { name: "Sell Gradient 2" })
    );
    expect(
      within(household).getByText(/18,880, down 1,589/)
    ).toBeInTheDocument();

    const rate = screen.getByRole("region", {
      name: "Change an edition and see its rate",
    });
    // The exact and the rounded rate, and the same rate at the edition's
    // point on the chart, in its phone and its wide drawing.
    expect(within(rate).getAllByText("12.71")).toHaveLength(4);
    // The chart draws the 300 threshold and names the floor in its key.
    expect(
      within(rate).getByText("300 copies: floors end")
    ).toBeInTheDocument();
    // The key says what the floor does in every state: the edition is the
    // larger of the minted count and the floor, and only with a claim.
    expect(
      within(rate).getByText(
        "Rate used: below 300 copies, the larger of the minted count and the floor, 310"
      )
    ).toBeInTheDocument();
    const [minted, claim] = within(rate).getAllByRole("spinbutton");
    if (!minted || !claim) {
      throw new Error("the rate explorer has two fields");
    }
    // No claim: no floor, and the key and the chart say so.
    fireEvent.change(claim, { target: { value: "0" } });
    expect(
      within(rate).getByText("Rate used: no claim limit, so no floor")
    ).toBeInTheDocument();
    // A minted count never passes the network's largest edition, H.
    expect(minted).toHaveAttribute("max", "3941");
    fireEvent.change(minted, { target: { value: "5000" } });
    expect(minted).toHaveValue(3941);
    expect(
      within(rate).getByText(/a larger edition would itself become H/)
    ).toBeInTheDocument();

    const stack = screen.getByRole("region", {
      name: "Send and receive copies, and watch the stack",
    });
    expect(within(stack).getByText("Whole days: 30")).toBeInTheDocument();
    expect(
      within(stack).getByRole("switch", { name: /consolidated/ })
    ).not.toBeChecked();

    expect(screen.queryByText("Rule text being finalised")).toBeNull();
    expect(screen.queryByText("In the specification")).toBeNull();
    expect(
      screen.getByRole("link", { name: /Next Specification/ })
    ).toHaveAttribute("href", "/network/tdh/specification");
  });

  it("renders the dashboard page and its permalinks, and 404s an unknown day", async () => {
    renderPage(await VerificationPage());
    expect(
      screen.getByRole("heading", { level: 1, name: "TDH verification" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/sample/i)).toBeNull();
    expect(screen.getAllByText("Equal").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "The Rust core, the Python reference and 6529.io agree to the last unit of TDH, the two burn addresses included."
      )
    ).toBeInTheDocument();

    renderPage(
      await VerificationDayPage({
        params: Promise.resolve({ cycleDay: "20740" }),
      })
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "TDH verification, October 14, 2026",
      })
    ).toBeInTheDocument();

    await expect(
      VerificationDayPage({ params: Promise.resolve({ cycleDay: "1" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(
      VerificationDayPage({ params: Promise.resolve({ cycleDay: "abc" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("sets the dashboard metadata", async () => {
    const metadata = await generateVerificationMetadata();
    expect(metadata.title).toBe("TDH verification | Network");
  });

  it("names the day asked for on the not-found view, and when a future cycle closes", async () => {
    const { unmount } = renderPage(
      await DayNotFoundPage({ searchParams: Promise.resolve({ day: "20739" }) })
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "No published day 20,739" })
    ).toBeInTheDocument();
    // No eyebrow at any width: the TDH tabs already say where the view
    // belongs, and the heading starts high on a phone.
    expect(
      within(document.getElementById("top") as HTMLElement).queryByText(
        "TDH verification"
      )
    ).not.toBeInTheDocument();
    // A cycle before the feed's first day says so, with its date; the
    // days before the comparison point to 6529.io's uploads and the
    // October 11 replay, never "not computed under TDH-v1".
    expect(
      screen.getByText(
        "Cycle 20,739 (October 13, 2026) is before the first published day, October 14, 2026 (cycle 20,740)."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The days compared start with October 14, 2026/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "the replay, in the specification’s evidence",
      })
    ).toHaveAttribute("href", "/network/tdh/specification#evidence-replay");
    expect(document.body.textContent).not.toMatch(/not computed under TDH-v1/);
    unmount();

    const { unmount: unmount2 } = renderPage(
      await DayNotFoundPage({ searchParams: Promise.resolve({ day: "99999" }) })
    );
    expect(
      screen.getByText(
        /Cycle 99,999 closes at 00:00 UTC on .*, so it has no report yet; a day’s report appears after its run at 00:40 UTC/
      )
    ).toBeInTheDocument();
    // The days before the comparison are only a future day's question
    // when it is before the feed: not here.
    expect(
      screen.queryByText(/The days compared start with/)
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
