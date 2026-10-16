import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import FormalPage from "@/app/network/tdh/formal/page";
import HowItWorksPage from "@/app/network/tdh/how-it-works/page";
import ImplementationsPage from "@/app/network/tdh/implementations/page";
import SpecificationPage from "@/app/network/tdh/specification/page";
import VerificationDayPage from "@/app/network/tdh/verification/[cycleDay]/page";
import DayNotFoundPage from "@/app/network/tdh/verification/day-not-found/page";
import VerificationPage, {
  generateMetadata as generateVerificationMetadata,
} from "@/app/network/tdh/verification/page";
import { statementsFor } from "@/app/network/tdh/formal/leanResults";
import roundThree from "./fixtures/roundThreeManifest.json";
import { PUBLIC_TDH_FEED_BASE } from "@/lib/tdh/verification/loadVerification.server";
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

function sourceAnchors(container: HTMLElement): string[] {
  return [...container.querySelectorAll("[data-tdh-source-href]")].map(
    (element) =>
      element.getAttribute("data-tdh-source-href")?.split("#")[1] ?? ""
  );
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
    expect(
      within(rate).getByText(
        "Rate used: below 300 copies the floor, edition 310"
      )
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

  it("renders the specification with an anchor for every source chip on every TDH page", async () => {
    const pages = [
      render(await HowItWorksPage()),
      render(await ImplementationsPage()),
      render(await FormalPage()),
      render(await VerificationPage()),
    ];
    const cited = new Set(
      pages.flatMap(({ container }) => sourceAnchors(container))
    );
    pages.forEach(({ unmount }) => unmount());

    const { container } = renderPage(await SpecificationPage());
    for (const anchor of new Set([...cited, ...sourceAnchors(container)])) {
      expect(container.querySelector(`[id="${anchor}"]`)).not.toBeNull();
    }
    for (let id = 1; id <= 19; id += 1) {
      expect(container.querySelector(`#dev-${id}`)).not.toBeNull();
    }
    for (let id = 1; id <= 15; id += 1) {
      expect(container.querySelector(`#bug-${id}`)).not.toBeNull();
    }
    expect(
      screen.getByText(
        "0x74b4a8f96e3f1fbc3f44167bb42f0a18effb7a0f49d12bc8b88cdb3784c663d3"
      )
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/github\.com/);
    expect(container.textContent).not.toMatch(/not yet in the text/);
    expect(container.textContent).toMatch(
      /reproduces all 89 conformance vectors/
    );
    expect(container.textContent).toMatch(/commit f840096/);
    expect(container.textContent).toMatch(/removed: true left the chain/);
    expect(container.textContent).not.toMatch(/IN PLAIN WORDS|In plain words/);
    expect(container.textContent).toMatch(/ZERO -> ZERO is not a mint/);
    expect(container.textContent).toMatch(/sinks contains ZERO/);
    expect(container.textContent).toMatch(/0x8888…888888/);
    expect(container.textContent).toMatch(/net\(w\) = the amount w receives/);
    expect(container.querySelector("#symbols")).not.toBeNull();
  });

  it("filters the specification's deviations", async () => {
    const user = userEvent.setup();
    renderPage(await SpecificationPage());
    const filters = screen.getByRole("group", { name: "Filter differences" });
    await user.click(
      within(filters).getByRole("button", { name: "Can change values" })
    );
    expect(document.getElementById("dev-2")).not.toBeNull();
    expect(document.getElementById("dev-1")).toBeNull();
    await user.click(
      within(filters).getByRole("button", { name: "Kept as before" })
    );
    expect(document.getElementById("dev-10")).not.toBeNull();
    expect(document.getElementById("dev-2")).toBeNull();
  });

  it("shows the formal model's statuses from its manifest, round 5", async () => {
    const user = userEvent.setup();
    // No manifest on the feed in tests: the page shows its bundled copy of
    // the feed's round-5 manifest (6b32f3f), and says so.
    const { container } = renderPage(await FormalPage());
    expect(
      screen.getByRole("heading", { level: 1, name: "Formal model" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Planned")).toBeNull();
    expect(screen.queryByText("In progress")).toBeNull();
    // The statements tables only: the statuses legend has a pill of each.
    const statements = statementsFor(5);
    const count = (status: string) =>
      statements.filter((row) => row.status === status).length;
    for (const status of ["proved", "byDefinition", "deferred"] as const) {
      expect(
        container.querySelectorAll(`table [data-tdh-pill="${status}"]`)
      ).toHaveLength(count(status));
    }
    // A claim shown false only by evaluated counterexamples (cases F, G, H
    // and I) says so; the first netting rule's are kernel theorems.
    expect(
      container.querySelectorAll('table [data-tdh-pill="shownFalse"]')
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('table [data-tdh-pill="shownFalseEval"]')
    ).toHaveLength(count("shownFalse") - 1);
    // The counterexamples' split and the audited arithmetic, from the
    // manifest; every entry is listed.
    expect(container.textContent).toMatch(/7 by theorem, 4 by evaluation/);
    expect(container.textContent).toMatch(/78 \+ 7 = 85/);
    expect(
      screen.getByText("All 98 manifest entries, by status")
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll('table [data-tdh-pill="unverified"]')
    ).toHaveLength(0);
    expect(screen.getAllByText("Proposal, not adopted").length).toBeGreaterThan(
      0
    );
    // The figures row is the manifest's own summary.
    expect(screen.getByText("89 / 89")).toBeInTheDocument();
    expect(container.textContent).toMatch(/78theorems proved/);
    expect(container.textContent).toMatch(/11claims shown false/);
    expect(container.textContent).toMatch(/9not proved here/);
    expect(container.textContent).not.toMatch(/cannot change TDH/);
    expect(container.textContent).not.toMatch(/and so no balance/);
    expect(container.textContent).toMatch(/It stops there/);
    // The real day is evidence by evaluation, not proof.
    expect(container.textContent).toMatch(/21,410/);
    expect(container.textContent).toMatch(/evidence by evaluation/);
    expect(container.textContent).not.toMatch(/so it computes real days/);
    expect(
      screen.getAllByText(/theorem replayHoldings_invariance/).length
    ).toBeGreaterThan(0);
    expect(
      container.querySelector('[data-tdh-manifest="bundled"]')?.textContent
    ).toMatch(/Model at 6b32f3f.*bundled with this page/);
    expect(
      container.querySelector('[data-tdh-manifest="bundled"]')?.textContent
    ).toMatch(/P26 as of f840096.*55 \+ 30 theorems.*46 fact checks/);
    // Round 5 is the published build: no "next build" column.
    expect(container.querySelector("[data-tdh-round-note]")).toBeNull();
    expect(container.querySelector("#next-build")).toBeNull();
    // Since round 4 selection and decoding are in the model.
    expect(container.textContent).toMatch(/Since round 4 \(f854661\)/);
    expect(container.textContent).not.toMatch(/round 5 brings selection/);
    const toggle = screen.getByRole("button", {
      name: "Show the details of The first netting rule",
    });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText("The first netting rule against the current one")
    ).toBeInTheDocument();
    expect(screen.getByText("firstRule_reorder")).toBeInTheDocument();
    const netting = screen.getByRole("button", {
      name: "Show the details of Netting invariance",
    });
    await user.click(netting);
    expect(
      screen.getByText("replayHoldings_invariance", { selector: "code" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Checked by Lean’s kernel; axioms: propext, Classical.choice, Quot.sound"
      ).length
    ).toBeGreaterThan(0);
  });

  it("names round 5 as the next build while the feed publishes round 3", async () => {
    serveFeed(roundThree);
    const { container } = renderPage(await FormalPage());
    expect(
      container.querySelector('[data-tdh-manifest="published"]')?.textContent
    ).toMatch(/Model at 7bf579a/);
    const note = container.querySelector("[data-tdh-round-note]");
    expect(note?.textContent).toMatch(/Round 5 at 6b32f3f, October 16, 2026/);
    expect(note?.textContent).toMatch(/55 \+ 30 theorems/);
    expect(note?.textContent).toMatch(/46 fact checks/);
    expect(
      note?.querySelector('[data-tdh-pill="notPublished"]')
    ).not.toBeNull();
    expect(note?.textContent).toMatch(
      /6825ffa47980ea9c7baa35470a6ddd24e7383fcbbe95bec4e237dfd0a7f537e5/
    );
    expect(screen.getByText("68 / 68")).toBeInTheDocument();
  });

  it("shows round 4's statements when the published manifest proves them", async () => {
    // Test data: the bundled manifest with round 4's theorems added, as a
    // manifest of that round would list them.
    const base = roundThree as unknown as {
      theorems: { id: string; status: string; leanName?: string | null }[];
    };
    const proved = base.theorems.find((entry) => entry.status === "proved");
    const deferred = base.theorems.find((entry) => entry.status === "deferred");
    const added = [
      "checkInputTypes_perm",
      "checkLogPositions_perm",
      "checkLogTypes_perm",
      "checkRawOrDecoded_perm",
      "checkSelected_perm",
      "computeCycleFromSource_decoded",
      "computeCycleFromSource_perm",
      "computeCycleFromSource_typed",
      "computeCycle_typed",
      "decodeLogs_perm",
      "decode_perm",
      "logBlocks_perm",
      "mapM_perm",
    ].map((name) => ({
      ...proved,
      id: `4.${name}`,
      leanName: `Tdh.Proofs.${name}`,
    }));
    const notProved = [
      "1.canonical-sort",
      "3.identity-wallets-field",
      "4.error-names",
      "6.rules-are-definitions",
      "6.json-reader",
    ].map((id) => ({ ...deferred, id }));
    const theorems = [
      ...base.theorems.filter((entry) => entry.id !== "4.raw-log-order"),
      ...added,
      ...notProved,
    ];
    serveFeed({
      ...base,
      summary: {
        ...(base as unknown as { summary: Record<string, number> }).summary,
        entries: theorems.length,
      },
      theorems,
    });
    const { container } = renderPage(await FormalPage());
    // Round 5 is still newer than this round-4 manifest.
    expect(
      container.querySelector("[data-tdh-round-note]")?.textContent
    ).toMatch(/Round 5 at 6b32f3f/);
    expect(
      container.querySelector('[data-tdh-manifest="published"]')
    ).not.toBeNull();
    expect(
      screen.getAllByText("The model from raw logs").length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Order independence, raw logs included").length
    ).toBeGreaterThan(0);
    expect(
      container.querySelectorAll('table [data-tdh-pill="proved"]')
    ).toHaveLength(9);
    expect(
      container.querySelectorAll('table [data-tdh-pill="unverified"]')
    ).toHaveLength(0);
    expect(container.textContent).toMatch(/414,254 logs/);
    expect(container.textContent).toMatch(/56 to 72 seconds/);
    expect(container.textContent).toMatch(/Tdh\.Logs/);
    expect(container.textContent).not.toMatch(
      /order of raw logs is not covered/
    );
  });

  it("renders the implementations with the vector browser and the latest agreement", async () => {
    const user = userEvent.setup();
    renderPage(await ImplementationsPage());
    expect(
      screen.getByRole("heading", { level: 1, name: "Implementations" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/None of their source is public yet/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the list is P26’s as of f840096/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Rust and Python agree on 10,282 of 10,282 identity records/
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/sample|test runs/i)).toBeNull();
    expect(
      screen.getByText(
        "All 89 vectors (1,257 checks), at P26 f840096. The daily comparison runs the 6529chain build each day’s page names"
      )
    ).toBeInTheDocument();
    // One vectors figure a program, P26's commit said once under the
    // table; the builds that ran on the latest day, from its file.
    expect(
      screen.getByText(/Vectors: all 89 of P26 at f840096/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ran on October 15, 2026: validator@e127676")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ran on October 15, 2026: 6529chain@0621ed4")
    ).toBeInTheDocument();
    expect(
      screen.getByText("All 89 vectors (1,253 checks), at P26 f840096")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "89 of 89 vectors (1,253 checks), at P26 f840096; every record of the 2026-10-11 cycle"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Built, not in validator")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "The 89 conformance vectors" })
    ).toBeInTheDocument();
    expect(screen.getByText("Inside one vector")).toBeInTheDocument();
    const filters = screen.getByRole("group", {
      name: "Filter vectors by topic",
    });
    expect(
      screen.getByRole("table", { name: "Conformance vectors, 10 of 89 shown" })
    ).toBeInTheDocument();
    await user.click(
      within(filters).getByRole("button", { name: /No result/ })
    );
    // "No result" is the 37 vectors whose whole expected output is no
    // result (expected_invalid); 34 and 55 mix cases with and without one.
    expect(
      screen.getByRole("table", { name: "Conformance vectors, 10 of 37 shown" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show all 37" }));
    expect(
      screen.getByRole("table", { name: "Conformance vectors, 37 of 37 shown" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("72-invalid-transfer-at-raw-transfer-log")
    ).toBeInTheDocument();
    await user.click(within(filters).getByRole("button", { name: /Netting/ }));
    expect(
      screen.getByRole("table", { name: "Conformance vectors, 16 of 16 shown" })
    ).toBeInTheDocument();
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
    // The eyebrow ties the view to the dashboard it belongs to.
    expect(
      within(document.getElementById("top") as HTMLElement).getByText(
        "TDH verification"
      )
    ).toBeInTheDocument();
    // A cycle before the feed's first day says so, with its date; the
    // days before the comparison point to 6529.io's uploads and the
    // October 11 replay, never "not computed under TDH-v1".
    expect(
      screen.getByText(
        "Cycle 20,739 (October 13, 2026) is before the first published day, October 14, 2026 (cycle 20,740)."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The daily comparison began with October 14, 2026/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "the replay, in the specification’s evidence",
      })
    ).toHaveAttribute("href", "/network/tdh/specification#evidence-replay");
    expect(document.body.textContent).not.toMatch(/not computed under TDH-v1/);
    unmount();

    renderPage(
      await DayNotFoundPage({ searchParams: Promise.resolve({ day: "99999" }) })
    );
    expect(
      screen.getByText(
        /Cycle 99,999 closes at 00:00 UTC on .*, so it has no report yet; a day’s report appears after its run at 00:40 UTC/
      )
    ).toBeInTheDocument();
  });
});
