import { render, screen, within } from "@testing-library/react";
import FormalPage, {
  generateMetadata as formalMetadata,
} from "@/app/network/tdh/formal/page";
import GlossaryPage, {
  generateMetadata as glossaryMetadata,
} from "@/app/network/tdh/glossary/page";
import { TERMS } from "@/app/network/tdh/glossary/terms";
import VersionsPage, {
  generateMetadata as versionsMetadata,
} from "@/app/network/tdh/historic-boosts/page";
import ImplementationsPage, {
  generateMetadata as implementationsMetadata,
} from "@/app/network/tdh/implementations/page";
import SpecificationPage, {
  generateMetadata as specificationMetadata,
} from "@/app/network/tdh/specification/page";
import { specAnchorTarget } from "@/app/network/tdh/specification/specAnchors";
import bundledManifest from "@/lib/tdh/formal/bundledManifest.json";
import { parseFormalManifest } from "@/lib/tdh/formal/manifest";
import { createFactBook } from "@/lib/explained/facts";
import { RECORD, type FactInputs } from "@/lib/explained/factInputs";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";

/**
 * How sure and the shelf (TDH-DESIGN.md §4.6, §4.7), rendered on the
 * fixture feed of 2026-10-18 09:40 UTC, the moment the final mockups were
 * built: every section, its anchors old and new, its numbers through
 * facts, and How sure's drift note while the manifest is about the rules
 * before D136 and D137, gone once it is about TDH v1.4.
 */
let inputs: FactInputs = fixtureFactInputs();
jest.mock("@/lib/explained/feed.server", () => ({
  loadFactBook: jest.fn(async () => createFactBook(inputs)),
}));

/** The bundled manifest, as if rebuilt from P26 after the rename. */
function withV14Manifest(base: FactInputs): FactInputs {
  const parsed = parseFormalManifest({
    ...bundledManifest,
    documents: {
      ...bundledManifest.documents,
      specification: {
        ...bundledManifest.documents.specification,
        lastChange: RECORD.p26.commit,
        lastChangeDate: RECORD.p26.date,
      },
    },
  });
  if (!parsed.success || !base.manifest) throw new Error("no manifest");
  return { ...base, manifest: { ...base.manifest, manifest: parsed.data } };
}

/** Text the gates would flag: digits outside a fact, a hash, code or a figure. */
const ALLOWED =
  "[data-fact], [data-hash], [data-stripes], code, pre, [data-lens], svg, [data-ex-allow-number], [data-day], [data-fig]";
const NAMES = [
  /\{\w+\}/g,
  /\b6529(?:\.io)?\b/g,
  /\bCC0\b/g,
  /\bSP1\b/g,
  /\bSHA-256\b/g,
  /\bERC-(?:1155|721|20)\b/g,
  /#\d+/g,
  /\b[DP]\d{1,3}\b/g,
  /§\s?\d+(?:\.\d+)*/g,
  /\bTDH v\d+\.\d+\b/g,
  /\bS\d\b/g,
];
function numbersOutsideFacts(root: HTMLElement): string[] {
  const article = root.querySelector("[data-ex-article]") ?? root;
  const found: string[] = [];
  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (
      !parent ||
      parent.closest(ALLOWED) ||
      parent.closest("nav, [data-ex-hwk], .tw-sr-only")
    ) {
      continue;
    }
    let text = node.textContent ?? "";
    if (/^\s*\d{1,2}\s*$/.test(text)) continue;
    for (const name of NAMES) text = text.replace(name, " ");
    const digits = text.match(/\d[\d,.:]*/g);
    if (digits) found.push(`${digits.join(" ")} in "${node.textContent}"`);
  }
  return found;
}

async function renderPage(page: () => Promise<React.ReactElement>) {
  return render(await page());
}

function expectPageBasics(container: HTMLElement) {
  expect(container.textContent).not.toMatch(/\{\w+\}/);
  expect(numbersOutsideFacts(container)).toEqual([]);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(container.querySelector("[data-ex-lede]")).not.toBeNull();
}

describe("How sure", () => {
  beforeEach(() => {
    inputs = fixtureFactInputs();
  });

  it("says the served manifest is about the rules before D136 and D137, and reads every count from it", async () => {
    const { container } = await renderPage(FormalPage);
    expectPageBasics(container);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What is proved, what is tested, and what is not.",
      })
    ).toBeInTheDocument();
    const drift = container.querySelector('[data-drift-by="D136 D137"]');
    expect(drift?.textContent).toMatch(/under its old name tdh-v1\.0/);
    expect(drift?.textContent).toMatch(
      /84 theorems proved, 104 of 104 vectors/
    );
    const board = container.querySelector("[data-scoreboard]");
    expect(
      [...(board?.querySelectorAll("dd > [data-fact]:first-child") ?? [])].map(
        (cell) => cell.textContent
      )
    ).toEqual(["8", "78", "11", "9"]);
    for (const id of [
      "why",
      "layers",
      "featured",
      "claims",
      "statements",
      "not",
      "limits",
      "check",
      "contains",
    ]) {
      expect(container.querySelector(`[id="${id}"]`)).not.toBeNull();
    }
    // Eight claims, one per section, each with its limit beside it.
    expect(container.querySelectorAll("[data-claims] > li").length).toBe(8);
    expect(container.textContent).toMatch(
      /The 11 statements shown false, by kind: 5 against the first netting rule/
    );
    expect(container.textContent).toMatch(/\(H and I\)/);
    expect(container.textContent).toMatch(/Cases F, G, H, and I are checked/);
    // Nine limits, each in a sentence of the page's own.
    const limits = within(
      screen.getByRole("list", { name: "The limits the manifest names" })
    ).getAllByRole("listitem");
    expect(limits).toHaveLength(9);
    expect(container.textContent).toMatch(
      /The model updated on Oct 18 names 12 limits/
    );
    // Every manifest entry, in its section's group.
    expect(container.querySelectorAll("#contains details")).toHaveLength(8);
    expect(container.querySelectorAll("#contains tbody tr").length).toBe(98);
    // The netting sentence told to the end, with its commits and times.
    const parts = container.querySelector("[data-claim-parts]");
    expect(parts?.textContent).toMatch(/11:32 UTC · as first written/);
    expect(parts?.textContent).toMatch(/commit 16d70d0/);
    expect(parts?.textContent).toMatch(
      /Tdh\.Proofs\.replayHoldings_invariance/
    );
    expect(parts?.textContent).toMatch(/4 h 3 min/);
    expect(parts?.textContent).toMatch(/2 h 43 min/);
  });

  it("drops the drift note once the manifest is about TDH v1.4", async () => {
    inputs = withV14Manifest(fixtureFactInputs());
    const { container } = await renderPage(FormalPage);
    expect(container.querySelector("[data-drift-by]")).toBeNull();
    expect(container.textContent).not.toMatch(/names 12 limits/);
  });

  it("names the page for search and sharing", () => {
    expect(formalMetadata().title).toMatch(/How sure/);
  });
});

describe("the specification", () => {
  beforeEach(() => {
    inputs = fixtureFactInputs();
  });

  it("restates every section, with this version and the change of name", async () => {
    const { container } = await renderPage(SpecificationPage);
    expectPageBasics(container);
    const version = screen.getByRole("complementary", { name: "This version" });
    expect(version.textContent).toMatch(/tdh-v1\.4/);
    expect(version.textContent).toMatch(/104/);
    expect(within(version).getByText("Proposed")).toBeInTheDocument();
    const drift = container.querySelector('[data-drift-by="D136 D137"]');
    // The fixture's files still report the old name.
    expect(drift?.textContent).toMatch(/still report it until its builds move/);
    for (let n = 1; n <= 13; n += 1) {
      expect(container.querySelector(`#s${n}`)).not.toBeNull();
    }
    for (let n = 1; n <= 19; n += 1) {
      expect(container.querySelector(`#dev-${n}`)).not.toBeNull();
    }
    for (let n = 1; n <= 15; n += 1) {
      expect(container.querySelector(`#bug-${n}`)).not.toBeNull();
    }
    expect(container.querySelector("#dev-11")?.textContent).toMatch(
      /Settled by D136/
    );
    expect(container.textContent).toMatch(
      /18 deviations from 6529\.io's old code/
    );
    expect(container.textContent).toMatch(/adj\[i\] {5}= -2,588 if i = 8/);
    expect(container.textContent).toMatch(/consolidation_max_wallets \(4\)/);
    expect(container.textContent).toMatch(/FirstGM minted 6,529 copies/);
    expect(container.textContent).toMatch(
      /only for editions 8, 40, 56, 200, 280, and 1,400/
    );
    expect(container.querySelector("#evidence-replay")?.textContent).toMatch(
      /2,061,888,816 \(2,060,802,863 without the burn addresses\)/
    );
  });

  it("keeps every anchor the TDH pages' source chips link to", async () => {
    const { container } = await renderPage(SpecificationPage);
    const chips = [
      "s3-1",
      "s3-2",
      "s3-3",
      "s3-4",
      "s4-1",
      "s4-2",
      "s4-3",
      "s5-1",
      "s5-2",
      "s5-3",
      "s5-4",
      "s6-1",
      "s6-2",
      "s6-3",
      "s6-4",
      "s6-5",
      "s7-1",
      "s7-2",
      "s7-3",
      "s8-1",
      "s8-2",
      "s8-3",
      "s8-4",
      "s8-5",
      "s8-6",
      "s8-7",
      "evidence",
      "evidence-replay",
      "evidence-clean-room",
      "evidence-comparison",
      "evidence-difftest",
      "d121",
      "d131",
      "symbols",
      "decisions",
      "changes",
    ];
    for (const anchor of chips) {
      const target = specAnchorTarget(anchor);
      const lands =
        container.querySelector(`[id="${anchor}"]`) !== null ||
        (target !== undefined &&
          container.querySelector(`[id="${target}"]`) !== null);
      expect([anchor, lands]).toEqual([anchor, true]);
    }
  });

  it("says the builds moved once the day's file reports TDH v1.4", async () => {
    const base = fixtureFactInputs();
    const feed = base.feed;
    if (!feed) throw new Error("no feed");
    const rust = feed.latest.day.implementations.rust;
    inputs = {
      ...base,
      feed: {
        ...feed,
        latest: {
          ...feed.latest,
          day: {
            ...feed.latest.day,
            implementations: {
              ...feed.latest.day.implementations,
              rust: { ...rust, ruleVersion: RECORD.p26.ruleVersion },
            },
          },
        },
      },
    };
    const { container } = await renderPage(SpecificationPage);
    expect(
      container.querySelector('[data-drift-by="D136 D137"]')?.textContent
    ).toMatch(/the daily comparison's files report tdh-v1\.4/);
    expect(specificationMetadata().title).toMatch(/specification/);
  });
});

describe("implementations and vectors", () => {
  beforeEach(() => {
    inputs = fixtureFactInputs();
  });

  it("lists the programs, the vectors, the pin block and the rounds", async () => {
    const { container } = await renderPage(ImplementationsPage);
    expectPageBasics(container);
    for (const id of ["cast", "vectors", "roots", "difftest-rounds"]) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
    expect(
      screen.getByRole("table", { name: "The programs that compute TDH" })
    ).toBeInTheDocument();
    expect(container.textContent).toMatch(
      /P26 has 104 conformance vectors since Oct 18\. The Lean manifest served today checks 89, as P26 stood at f840096\./
    );
    const publicList = container.querySelector(
      'dl[aria-label="The public vectors"]'
    );
    expect(publicList?.querySelectorAll("dt")).toHaveLength(5);
    expect(
      screen.getByRole("link", { name: "Download the public vectors as JSON" })
    ).toHaveAttribute("href", "/network/tdh/public-vectors.json");
    const block = container.querySelector("#roots pre")?.textContent ?? "";
    expect(block).toMatch(
      /cycle_root     0x43717ba9d201b265dc0e68578e1780c0bab7f0b69402d2dc5aa5629179d299ec/
    );
    expect(block).toMatch(/rule_version   tdh-v1\.0   # retired name/);
    expect(
      screen.getByRole("button", { name: "Copy the block" })
    ).toBeInTheDocument();
    expect(implementationsMetadata().title).toMatch(/Implementations/);
  });
});

describe("versions and boosts", () => {
  beforeEach(() => {
    inputs = fixtureFactInputs();
  });

  it("dates every version and reads today's values from the engine", async () => {
    const { container } = await renderPage(VersionsPage);
    expectPageBasics(container);
    for (const id of [
      "tdh-1-4",
      "tdh-1-3",
      "tdh-1-2",
      "tdh-1-1",
      "boost-figures",
    ]) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
    const current = container.querySelector("#tdh-1-4")?.textContent ?? "";
    expect(current).toMatch(/Oct 10, 2025 to today/);
    expect(current).toMatch(/1\.80 today, 2\.00 at most/);
    expect(current).toMatch(/Up to 20; 16 pay today/);
    expect(container.querySelector("#tdh-1-3")?.textContent).toMatch(
      /Mar 29, 2024 to Oct 9, 2025.*1\.55.*Up to 11/
    );
    expect(container.querySelector("#boost-figures")?.textContent).toMatch(
      /about 2\.04.*about 2\.24 once season 20 is complete/
    );
    expect(container.textContent).toMatch(/until their builds move/);
    expect(versionsMetadata().title).toMatch(/Versions and boosts/);
  });
});

describe("the glossary", () => {
  beforeEach(() => {
    inputs = fixtureFactInputs();
  });

  it("lands every term the overview's glossary anchored, with status and source", async () => {
    const { container } = await renderPage(GlossaryPage);
    expectPageBasics(container);
    // The overview's #glossary-<term> anchors, every one.
    const old = [
      "tdh",
      "cycle",
      "snapshot",
      "edition",
      "rate",
      "base",
      "boost",
      "identity",
      "consolidation",
      "sink",
      "xtdh",
      "versions",
      "validator",
      "rust",
      "raw",
      "netting",
      "underflow",
      "finalized",
      "vector",
      "root",
      "cutover",
      "classes",
      "items",
      "programs",
      "memes",
      "firstgm",
      "season",
      "fullSet",
      "stack",
      "registry",
      "final",
    ];
    const anchors = TERMS.flatMap((term) => [term.id, ...(term.also ?? [])]);
    for (const id of [...old, ...anchors]) {
      expect(container.querySelector(`[id="${id}"]`)).not.toBeNull();
    }
    const table = screen.getByRole("table", {
      name: "TDH terms, their meanings, status and sources",
    });
    expect(within(table).getAllByRole("row").length).toBeGreaterThan(30);
    expect(container.querySelector("#nic")?.textContent).not.toMatch(
      /Network Identity/
    );
    expect(container.querySelector("#rate")?.textContent).toMatch(
      /3,941 divided by a card's effective edition, in cents: 12\.71 for 310 copies/
    );
    expect(glossaryMetadata().title).toMatch(/Glossary/);
  });
});
