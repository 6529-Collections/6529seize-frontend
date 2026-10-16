import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import FormalPage from "@/app/network/tdh/formal/page";
import HowItWorksPage from "@/app/network/tdh/how-it-works/page";
import ImplementationsPage from "@/app/network/tdh/implementations/page";
import SpecificationPage from "@/app/network/tdh/specification/page";
import VerificationDayPage from "@/app/network/tdh/verification/[cycleDay]/page";
import VerificationPage, {
  generateMetadata as generateVerificationMetadata,
} from "@/app/network/tdh/verification/page";
import { BUNDLED_FORMAL_MANIFEST } from "@/lib/tdh/formal/bundledManifest";
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
    renderPage(<HowItWorksPage />);
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

    const builder = screen.getByRole("region", { name: "Boost builder" });
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
      name: "Show the household",
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

    const rate = screen.getByRole("region", { name: "Rate explorer" });
    expect(within(rate).getByText("12.71")).toBeInTheDocument();

    const stack = screen.getByRole("region", { name: "Stack simulator" });
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
      render(<HowItWorksPage />),
      render(await ImplementationsPage()),
      render(await FormalPage()),
      render(await VerificationPage()),
    ];
    const cited = new Set(
      pages.flatMap(({ container }) => sourceAnchors(container))
    );
    pages.forEach(({ unmount }) => unmount());

    const { container } = renderPage(<SpecificationPage />);
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
    expect(container.textContent).toMatch(/every one of the 89 conformance/);
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
    renderPage(<SpecificationPage />);
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

  it("shows the formal model's proved, checked and refuted statements", async () => {
    const user = userEvent.setup();
    const { container } = renderPage(await FormalPage());
    expect(
      screen.getByRole("heading", { level: 1, name: "Formal model" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Planned")).toBeNull();
    expect(screen.queryByText("In progress")).toBeNull();
    // The statements tables only: the statuses legend has a pill of each.
    expect(
      container.querySelectorAll('table [data-tdh-pill="proved"]')
    ).toHaveLength(8);
    expect(
      container.querySelectorAll('table [data-tdh-pill="shownFalse"]')
    ).toHaveLength(4);
    expect(
      container.querySelectorAll('table [data-tdh-pill="byDefinition"]')
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('table [data-tdh-pill="deferred"]')
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('table [data-tdh-pill="unverified"]')
    ).toHaveLength(0);
    expect(screen.getAllByText("Proposal, not adopted").length).toBeGreaterThan(
      0
    );
    expect(screen.getByText("68 / 68")).toBeInTheDocument();
    // Five properties of the rule; last in, first out is a lemma about the
    // model's stack and is not counted.
    expect(container.textContent).toMatch(/5properties of TDH-v1 proved/);
    expect(container.textContent).not.toMatch(/cannot change TDH/);
    expect(container.textContent).not.toMatch(/and so no balance/);
    expect(container.textContent).toMatch(/It stops there/);
    expect(screen.getByText("21,410")).toBeInTheDocument();
    expect(
      screen.getAllByText(/theorem replayHoldings_invariance/).length
    ).toBeGreaterThan(0);
    // Outside production without a feed, the statuses come from the bundled
    // copy of the manifest, and the page says so.
    expect(
      container.querySelector('[data-tdh-manifest="bundled"]')?.textContent
    ).toMatch(/bundled with this page.*model at commit 7bf579a/);
    // The manifest's build follows P26 as of 1c69528.
    expect(container.textContent).toMatch(/1,190 checks, P26 as of 1c69528/);
    // Round 5 of the model exists, but its manifest is not published: the
    // page shows its committed figures in a section of their own, and keeps
    // round 3's statements, each labelled with the published build.
    const note = container.querySelector("[data-tdh-round-note]");
    expect(note?.textContent).toMatch(/Round 5 of the model, October 16, 2026/);
    expect(note?.textContent).toMatch(/89 of 89 vectors/);
    expect(note?.textContent).toMatch(/55 \+ 30 theorems/);
    expect(note?.textContent).toMatch(/46 fact checks/);
    expect(note?.textContent).toMatch(/at commit 6b32f3f/);
    // It is its own section after the body, under a pill, and the header
    // gives it one quiet line.
    expect(
      container.querySelector('#next-build [data-tdh-pill="notPublished"]')
    ).not.toBeNull();
    expect(container.textContent).toMatch(
      /Round 5 of the model \(6b32f3f, October 16, 2026\) is committed but not yet published/
    );
    expect(container.textContent).toMatch(
      /the order of raw logs is not covered/
    );
    expect(container.textContent).not.toMatch(/The model from raw logs/);
    const toggle = screen.getByRole("button", {
      name: "Show the details of The first netting rule",
    });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText("The first netting rule against the current one")
    ).toBeInTheDocument();
    expect(screen.getByText("firstRule_reorder")).toBeInTheDocument();
    expect(screen.getByText("In the proof manifest (5)")).toBeInTheDocument();
    const netting = screen.getByRole("button", {
      name: "Show the details of Netting invariance",
    });
    await user.click(netting);
    expect(screen.getByText("replayHoldings_invariance")).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Checked by Lean’s kernel; axioms: propext, Classical.choice, Quot.sound"
      ).length
    ).toBeGreaterThan(0);
  });

  it("shows round 4's statements when the published manifest proves them", async () => {
    // Test data: the bundled manifest with round 4's theorems added, as a
    // manifest of that round would list them.
    const base = BUNDLED_FORMAL_MANIFEST as {
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
    ).toMatch(/Round 5 of the model/);
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
      screen.getByText(/The list follows 6529chain f840096/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Rust and Python agree on 10,282 of 10,282 identity records/
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/sample|test runs/i)).toBeNull();
    expect(
      screen.getByText(
        "All 89 vectors (1,257 checks), at P26 f840096. The daily job runs it at 0621ed4, which had 51"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("All 89 vectors (1,253 checks), at P26 f840096")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "68 of 68 vectors (1,190 checks), at P26 1c69528; every record of the 2026-10-11 cycle. Round 5 (6b32f3f), committed but not yet in a published manifest: 89 of 89 at P26 f840096."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Built; not yet inside the validator")
    ).toBeInTheDocument();
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
    expect(
      screen.getByRole("table", { name: "Conformance vectors, 10 of 39 shown" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show all 39" }));
    expect(
      screen.getByRole("table", { name: "Conformance vectors, 39 of 39 shown" })
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
        "Cycle of October 15, 2026 (holdings at the last Ethereum block before 00:00 UTC): the Rust core, the Python reference and 6529.io agreed on all 10,282 identity records, each collector’s and the two burn addresses’, and all 11,133 wallet records, to the last unit of TDH."
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
});
