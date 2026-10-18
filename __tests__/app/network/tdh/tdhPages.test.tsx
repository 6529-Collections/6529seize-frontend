import { fireEvent, render, screen, within } from "@testing-library/react";
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
import roundSix from "./fixtures/roundSixManifest.json";
import roundThree from "./fixtures/roundThreeManifest.json";
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
    // Step 10 (D136): the fourth wallet stated plainly and drawn both ways,
    // a valid group of four and one that fails the gate.
    const step10 = document.getElementById("step-10")?.textContent ?? "";
    expect(step10).toMatch(
      /A fourth wallet counts only with fresh links: one wallet of the four must have links with each of the other three registered in both directions from October 15, 2026, 00:00 UTC/
    );
    expect(step10).toMatch(/A \+ B \+ C \+ D/);
    expect(step10).toMatch(/B \+ C \+ D, and A alone/);
    expect(step10).not.toMatch(/pending an owner|owner decision|TDH-v1/);
    expect(document.getElementById("step-14")?.textContent).toMatch(
      /Not a change: groups of four wallets count as 6529\.io counts them/
    );
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
    // TDH v1.4's registry hash and rule ID (P26 §10 at 3bfa7b0, D136).
    expect(
      screen.getByText(
        "0x3cfa0e6eae7b8769516597e117ecd55580ecb6b75194139f053d3e0ec09d9f36"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "0x772d61ed465c80ed3a801927d81183895e4d1f37b069bb9ceaef959a7418ab3f"
      )
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/github\.com/);
    expect(container.textContent).not.toMatch(/not yet in the text/);
    expect(container.textContent).toMatch(
      /reproduces all 104 conformance vectors/
    );
    expect(container.textContent).toMatch(/commit 3bfa7b0/);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "The TDH v1.4 specification",
      })
    ).toBeInTheDocument();
    // D136 in §6: the four-wallet rule stated plainly, nothing pending.
    expect(container.querySelector("#s6-3")?.textContent).toMatch(
      /A fourth wallet joins only if the group of four then has one wallet whose links with each of the other three were registered in both directions from October 15, 2026, 00:00 UTC/
    );
    expect(container.querySelector("#s6-3")?.textContent).toMatch(
      /canJoin\(C, n\)/
    );
    expect(container.textContent).not.toMatch(/pending an owner decision/);
    expect(container.textContent).not.toMatch(/TDH-v1\b/);
    expect(container.querySelector("#evidence-four-wallets")).not.toBeNull();
    expect(container.querySelector("#d136")).not.toBeNull();
    expect(container.querySelector("#d137")).not.toBeNull();
    expect(container.textContent).toMatch(/consolidation_ungated_max_wallets/);
    expect(container.textContent).toMatch(/removed: true left the chain/);
    expect(container.textContent).not.toMatch(/IN PLAIN WORDS|In plain words/);
    expect(container.textContent).toMatch(/ZERO -> ZERO is not a mint/);
    expect(container.textContent).toMatch(/sinks contains ZERO/);
    expect(container.textContent).toMatch(/0x8888…888888/);
    expect(container.textContent).toMatch(/net\(w\) = the amount w receives/);
    expect(container.querySelector("#symbols")).not.toBeNull();
    // §4.2's anchor is its rule block; vector 74's top block is case 0.
    expect(container.querySelector("#s4-2")?.textContent).toMatch(
      /block 2\^64 - 1 has no block b \+ 1, so it is never B/
    );
    expect(container.querySelector("#s4-2")?.textContent).toMatch(
      /vector 74, case 0/
    );
    expect(container.textContent).not.toMatch(/vector 74, case 2/);
    expect(container.querySelector("#s4-3")?.textContent).not.toMatch(
      /block 2\^64 - 1/
    );
    // The section map: the snapshot (§4) before the canonical events (§3).
    const figure = screen
      .getByText("How the sections fit together")
      .closest("figure");
    const map = [...(figure?.querySelectorAll('a[href^="#s"]') ?? [])]
      .map((link) => link.getAttribute("href"))
      .filter((href) => href === "#s3" || href === "#s4");
    expect(map).toEqual(["#s4", "#s3"]);
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
    // The counterexamples' split, the claims they refute and the audited
    // arithmetic, from the manifest; every entry is listed.
    expect(container.textContent).toMatch(
      /7 theorems, 4 evaluations; 7 claims shown false/
    );
    expect(container.textContent).toMatch(
      /the 5 cases of the first netting rule refute one claim/
    );
    expect(container.textContent).toMatch(/78 \+ 7 = 85/);
    // The audit covers the whole model; the 85 are the documented ones.
    expect(container.textContent).toMatch(
      /1,068 theorems and 1,538 definitions/
    );
    expect(container.textContent).not.toMatch(/audited at every build/);
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
    // Each count with its unit, the outcomes in three colours.
    expect(container.textContent).toMatch(/78theorems proved/);
    expect(container.textContent).toMatch(/11counterexamples/);
    expect(container.textContent).toMatch(/9limits not proved here/);
    expect(container.textContent).not.toMatch(/11claims shown false/);
    expect(
      [...container.querySelectorAll("[data-tdh-summary-mark]")].map((mark) =>
        mark.getAttribute("data-tdh-summary-mark")
      )
    ).toEqual(["proved", "false", "deferred"]);
    expect(screen.getByText("Proved: 78 theorems")).toBeInTheDocument();
    expect(
      screen.getByText("Counterexamples: 11, against 7 claims")
    ).toBeInTheDocument();
    expect(screen.getByText("Not proved here: 9 limits")).toBeInTheDocument();
    // The one-log rule has a theorem; only the strict reader is checked by
    // vectors alone.
    expect(container.textContent).toMatch(/canonicalTransfers_oneLog/);
    expect(container.textContent).not.toMatch(
      /round 5 adds the one-log rule and the strict reader; vectors and runs check them, no theorem does/
    );
    // One real day for the Lean model, not "whole real days".
    expect(container.textContent).not.toMatch(/on whole real days/);
    expect(container.textContent).toMatch(
      /the Lean model matched it on one real day, October 11, 2026/
    );
    // Units and facts as the sources give them.
    expect(container.textContent).not.toMatch(/Found by the model, and/);
    expect(container.textContent).not.toMatch(/adds no content/);
    expect(container.textContent).not.toMatch(/Proved false/);
    expect(container.textContent).not.toMatch(/Totals from the model/);
    expect(container.textContent).toMatch(/§2, §3, §5\.2, §6\.1/);
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
    // Round 6 (D136) is committed, not published: the builds panel names
    // it beside the published round 5.
    expect(
      container.querySelector("[data-tdh-round-note]")?.textContent
    ).toMatch(/Round 6 at 2694e72, October 18, 2026/);
    expect(container.querySelector("#next-build")).toBeNull();
    // Round 6's cluster statement waits for its manifest.
    expect(container.textContent).not.toMatch(
      /Group sizes and the four-wallet gate/
    );
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

  it("names round 6 as the next build while the feed publishes round 3", async () => {
    serveFeed(roundThree);
    const { container } = renderPage(await FormalPage());
    expect(
      container.querySelector('[data-tdh-manifest="published"]')?.textContent
    ).toMatch(/Model at 7bf579a/);
    const note = container.querySelector("[data-tdh-round-note]");
    expect(note?.textContent).toMatch(/Round 6 at 2694e72, October 18, 2026/);
    expect(note?.textContent).toMatch(/Follows P26 at 3bfa7b0: TDH v1\.4/);
    expect(note?.textContent).toMatch(/It passes all 104 vectors/);
    expect(note?.textContent).toMatch(/61 \+ 30 theorems/);
    expect(note?.textContent).toMatch(/54 fact checks/);
    expect(
      note?.querySelector('[data-tdh-pill="notPublished"]')
    ).not.toBeNull();
    expect(note?.textContent).toMatch(
      /cc5b11dca725c89bdbe11a8e013ca2633e690854ed921874632b7e58fa68f168/
    );
    expect(screen.getByText("68 / 68")).toBeInTheDocument();
  });

  it("switches to round 6 once the feed publishes its manifest", async () => {
    serveFeed(roundSix);
    const { container } = renderPage(await FormalPage());
    expect(
      container.querySelector('[data-tdh-manifest="published"]')?.textContent
    ).toMatch(/Model at 2694e72.*P26 as of 3bfa7b0/);
    // The newest round: no next-build column.
    expect(container.querySelector("[data-tdh-round-note]")).toBeNull();
    expect(screen.getByText("104 / 104")).toBeInTheDocument();
    expect(
      screen.getAllByText("Group sizes and the four-wallet gate").length
    ).toBeGreaterThan(0);
    expect(
      container.querySelectorAll('table [data-tdh-pill="unverified"]')
    ).toHaveLength(0);
    expect(container.textContent).toMatch(/36 seconds/);
    expect(container.textContent).toMatch(
      /1,156 theorems and 1,576 definitions/
    );
    expect(container.textContent).toMatch(/§4\.2, §6/);
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
    // Round 6 is newer than this round-4 manifest.
    expect(
      container.querySelector("[data-tdh-round-note]")?.textContent
    ).toMatch(/Round 6 at 2694e72/);
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
    // D116 covers the validator code only: the Rust core and program B;
    // the references and the Lean model are in the design repository.
    expect(
      screen.getByText(
        /The Rust core and program B are to be published with the validator code \(D116\); the references and the Lean model are in 6529’s private design repository/
      )
    ).toBeInTheDocument();
    // 6529.io is compared with the Rust core, and the Rust core with
    // the Python reference, not with every program.
    expect(
      screen.getByText(
        /compared record by record with the Rust core, and the Rust core with the Python reference/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the list is P26’s as of 3bfa7b0/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Rust and Python agree on 10,282 of 10,282 identity records/
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/sample|test runs/i)).toBeNull();
    expect(
      screen.getByText(
        "All 104 vectors (1,311 checks), at P26 3bfa7b0. The daily comparison runs the 6529chain build each day’s page names"
      )
    ).toBeInTheDocument();
    // One vectors figure a program, P26's commit said once under the
    // table; the builds that ran on the latest day, from its file.
    expect(
      screen.getByText(/Vectors: all 104 of P26 at 3bfa7b0/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ran on October 15, 2026: validator@e127676")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ran on October 15, 2026: 6529chain@0621ed4")
    ).toBeInTheDocument();
    expect(
      screen.getByText("All 104 vectors (1,307 checks), at P26 3bfa7b0")
    ).toBeInTheDocument();
    // The Lean model's published build is round 5, on P26 f840096; round 6,
    // on 3bfa7b0, is committed and named beside it.
    expect(
      screen.getByText(
        /^89 of 89 vectors \(1,253 checks\), at P26 f840096; every record of the 2026-10-11 cycle\. Round 6 \(2694e72\), committed but not yet in a published manifest: 104 of 104 at P26 3bfa7b0\.$/
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Built, not in validator")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "The 104 conformance vectors" })
    ).toBeInTheDocument();
    expect(screen.getByText("Inside one vector")).toBeInTheDocument();
    // Three more vectors in full, to check by hand before the files are
    // published: 04, 06 and 23.
    expect(
      screen.getByText("Three more vectors to check by hand: 04, 06 and 23")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Identity sums and their rounding")
    ).toBeInTheDocument();
    const filters = screen.getByRole("group", {
      name: "Filter vectors by topic",
    });
    expect(
      screen.getByRole("table", {
        name: "Conformance vectors, 10 of 104 shown",
      })
    ).toBeInTheDocument();
    await user.click(
      within(filters).getByRole("button", { name: /No result/ })
    );
    // "No result" is the 39 vectors whose whole expected output is no
    // result (expected_invalid); 34 and 55 mix cases with and without one.
    expect(
      screen.getByRole("table", { name: "Conformance vectors, 10 of 39 shown" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show all 39" }));
    expect(
      screen.getByRole("table", { name: "Conformance vectors, 39 of 39 shown" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("100-invalid-delegation-event-after-cutoff")
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
