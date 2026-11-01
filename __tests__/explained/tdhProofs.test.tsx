import { readFileSync } from "node:fs";
import path from "node:path";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FactsProvider from "@/components/explained/facts/FactsProvider";
import { chapterById } from "@/components/explained/shell/chapters";
import { createFactBook, isFact, type Fact } from "@/lib/explained/facts";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";
import proofs from "@/lib/explained/data/proofs.json";
import type { ProofPhase } from "@/lib/explained/registry/proofFacts";
import { CONTRACT_CHECKS } from "@/app/network/tdh/proofs/_lib/checks";
import { pageFacts } from "@/app/network/tdh/proofs/_lib/facts";
import { resolveExplainedLocale as resolveLocale } from "@/lib/explained/locale.server";
import {
  LAYERS,
  SCENARIOS,
  layerStates,
  scenarioById,
} from "@/app/network/tdh/proofs/_lib/scenarios";
import {
  ANCHOR_WORDS,
  STATEMENT_WORDS,
  compareOutputs,
  decodeStatement,
  differingWords,
} from "@/app/network/tdh/proofs/_lib/statement";
import ContractSection from "@/app/network/tdh/proofs/ContractSection";
import Guarantees from "@/app/network/tdh/proofs/Guarantees";
import ProofsDoor from "@/app/network/tdh/proofs/ProofsDoor";
import ProofsHero from "@/app/network/tdh/proofs/ProofsHero";
import ProofsSources from "@/app/network/tdh/proofs/ProofsSources";
import RawBytes from "@/app/network/tdh/proofs/RawBytes";
import StatementWords from "@/app/network/tdh/proofs/StatementWords";
import StillTrust from "@/app/network/tdh/proofs/StillTrust";
import TwoPrograms from "@/app/network/tdh/proofs/TwoPrograms";
import WhereItStands from "@/app/network/tdh/proofs/WhereItStands";
import HowMade from "@/app/network/tdh/proofs/HowMade";

let mockAcceptLanguage: string | null = null;
jest.mock("next/headers", () => ({
  headers: async () => ({
    get: (name: string) =>
      name === "accept-language" ? mockAcceptLanguage : null,
  }),
}));

const RULE_LINES = ["program", ...CONTRACT_CHECKS.map((check) => check.id)];

jest.mock("next/navigation", () => ({
  usePathname: () => "/network/tdh/proofs",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

/**
 * Zero-knowledge proofs (`/network/tdh/proofs`): the facts it prints agree
 * with the records they restate, the models compute what the contract's
 * record says, and every section renders on the facts layer alone.
 */
const book = createFactBook(fixtureFactInputs());
const snapshot = book.snapshot();
const facts = pageFacts(snapshot, "en-US");

function num(id: Parameters<typeof book.num>[0]): number {
  return book.num(id);
}

const wordsA = decodeStatement(
  book.get<readonly string[]>("proofs.day.wordsA").value
);
const wordsB = decodeStatement(
  book.get<readonly string[]>("proofs.day.wordsB").value
);
const wordAt = (name: string) => {
  const index = STATEMENT_WORDS.findIndex((word) => word.name === name);
  return wordsA[index];
};

function withFacts(node: React.ReactNode) {
  return render(<FactsProvider snapshot={snapshot}>{node}</FactsProvider>);
}

describe("the proofs facts", () => {
  it("decode proof A's public values into the statement the record states", () => {
    expect(STATEMENT_WORDS).toHaveLength(num("proofs.statement.words"));
    expect(STATEMENT_WORDS.length * num("proofs.statement.wordBytes")).toBe(
      num("proofs.statement.bytes")
    );
    expect(Number(wordAt("cycleDay")?.value)).toBe(num("site.proofA.cycle"));
    expect(Number(wordAt("totalTDH")?.value)).toBe(
      num("site.proofA.totalWithoutBurn")
    );
    expect(Number(wordAt("totalTDH")?.value)).toBe(
      num("proofs.day.nativeTotal")
    );
    expect(Number(wordAt("historyCount")?.value)).toBe(
      num("proofs.day.historyLogs") + num("proofs.day.dayLogs")
    );
    expect(Number(wordAt("prevHistoryCount")?.value)).toBe(
      num("proofs.day.historyLogs")
    );
    // the rule the day was proved under is the retired one
    expect(wordAt("tdhRuleId")?.hex).toBe(
      book.text("proofs.contract.retiredRuleId")
    );
    expect(wordAt("tdhRuleId")?.hex).not.toBe(book.text("rules.ruleId"));
    // the cut is the last block before midnight of the cycle's day
    const cutTime = Number(wordAt("cutTimestamp")?.value);
    expect(cutTime).toBeLessThan(num("site.proofA.cycle") * 86_400);
    expect(cutTime).toBeGreaterThanOrEqual(
      (num("site.proofA.cycle") - 1) * 86_400
    );
    expect(book.text("proofs.day.date")).toBe(
      new Date(num("site.proofA.cycle") * 86_400_000).toISOString().slice(0, 10)
    );
  });

  it("has program B's run of the same day equal but for the anchor", () => {
    expect(differingWords(wordsA, wordsB)).toEqual([...ANCHOR_WORDS]);
    expect(compareOutputs(wordsA, wordsB)).toEqual({ accepted: true });
    expect(Number(wordsB[20]?.value)).toBe(num("proofs.dayB.total"));
    const changed = wordsB.map((word, index) =>
      index === 20
        ? {
            ...word,
            hex: `0x${(word.value! + 1n).toString(16).padStart(64, "0")}`,
          }
        : word
    );
    expect(compareOutputs(wordsA, changed)).toEqual({
      accepted: false,
      word: 20,
    });
  });

  it("refuses a statement that is not one 32-byte word per name", () => {
    expect(() => decodeStatement(proofs.day.wordsA.slice(1))).toThrow(
      /25 words/
    );
    expect(() =>
      decodeStatement(proofs.day.wordsA.map((w, i) => (i === 3 ? "zz" : w)))
    ).toThrow(/Word 3/);
  });

  it("splits program A's profile into parts that sum to its total", () => {
    const parts = book.get<readonly ProofPhase[]>("proofs.phases.parts").value;
    expect(parts.reduce((sum, part) => sum + part.steps, 0)).toBe(
      num("proofs.phases.total")
    );
    expect(parts[0]?.id).toBe("receipts");
    expect(parts[0]!.steps / num("proofs.phases.total")).toBeGreaterThan(0.45);
  });

  it("counts the day's blocks by their one form of evidence", () => {
    expect(
      num("proofs.day.bloomBlocks") + num("proofs.day.receiptBlocks")
    ).toBe(num("proofs.day.blocks"));
    expect(num("proofs.day.txBlocks")).toBeLessThan(
      num("proofs.day.receiptBlocks")
    );
  });

  it("lists the contract's checks as the record counts them", () => {
    expect(CONTRACT_CHECKS).toHaveLength(num("proofs.contract.checks"));
    expect(CONTRACT_CHECKS.map((check) => check.id)).toEqual(
      RULE_LINES.filter((line) => line !== "program")
    );
  });

  it("names its sources by record and commit, and no person or address", () => {
    for (const entry of Object.values(proofs.sources)) {
      expect(entry.ref).not.toMatch(/0x[0-9a-f]{40}\b/i);
      expect(entry.ref).not.toMatch(/@/);
    }
    const text = JSON.stringify(proofs);
    expect(text).not.toMatch(/\b0x[0-9a-fA-F]{40}\b(?![0-9a-fA-F])/);
  });
});

describe("what a proof guarantees", () => {
  it("lets each mistake through every layer before the one that stops it", () => {
    for (const scenario of SCENARIOS) {
      const states = layerStates(scenario, false);
      const stop = LAYERS.indexOf(scenario.stoppedBy);
      LAYERS.forEach((layer, index) => {
        let expected = "unreached";
        if (index < stop) expected = "passed";
        if (index === stop) expected = "stops";
        expect([scenario.id, layer, states[layer]]).toEqual([
          scenario.id,
          layer,
          expected,
        ]);
      });
      expect(RULE_LINES).toContain(scenario.line);
    }
  });

  it("records a mistake in the rules, since every layer lets it through", () => {
    const states = layerStates(scenarioById("total"), true);
    expect(states.recorded).toBe("wrong");
    expect(
      LAYERS.filter((layer) => layer !== "recorded").every(
        (layer) => states[layer] === "passed"
      )
    ).toBe(true);
    expect(() => scenarioById("nope" as never)).toThrow();
  });

  it("says where each mistake stops, and Break it records the rules' mistake", async () => {
    const user = userEvent.setup();
    const { container } = withFacts(<Guarantees locale="en-US" />);
    const lens = container.querySelector('[data-lens="guard"]') as HTMLElement;
    expect(
      lens.querySelector('[data-layer="proof"]')?.getAttribute("data-state")
    ).toBe("stops");
    await user.click(
      within(lens).getByRole("button", { name: "Made-up blocks" })
    );
    expect(
      lens.querySelector('[data-layer="contract"]')?.getAttribute("data-state")
    ).toBe("stops");
    expect(lens.querySelector('[data-rule-on="1"]')?.textContent).toContain(
      "anchorHash"
    );
    await user.click(
      within(lens).getByRole("button", { name: "A missing log" })
    );
    expect(within(lens).getAllByText("No proof exists").length).toBeGreaterThan(
      0
    );
    await user.click(
      within(lens).getByRole("button", {
        name: "Break it: a mistake in the rules",
      })
    );
    expect(lens).toHaveAttribute("data-broken", "1");
    expect(
      lens.querySelector('[data-layer="recorded"]')?.getAttribute("data-state")
    ).toBe("wrong");
    expect(
      within(lens).getByRole("link", { name: "What the Lean proofs cover" })
    ).toHaveAttribute("href", "/network/tdh/formal");
    await user.click(
      within(lens).getByRole("button", {
        name: "Break it: a mistake in the rules",
      })
    );
    expect(lens).toHaveAttribute("data-broken", "0");
  });
});

describe("the words model", () => {
  it("lights a group, and Break it puts program B's words beside proof A's", async () => {
    const user = userEvent.setup();
    const { container } = withFacts(<StatementWords locale="en-US" />);
    const lens = container.querySelector('[data-lens="words"]') as HTMLElement;
    const lit = () =>
      [...lens.querySelectorAll('[data-lit="1"]')].map((row) =>
        Number(row.getAttribute("data-word"))
      );
    expect(lit()).toEqual([17, 18, 19, 20, 21, 22, 23, 24]);
    expect(lens.textContent).toContain("2,060,802,863");
    await user.click(within(lens).getByRole("button", { name: "Start" }));
    expect(lit()).toEqual([4, 5, 12, 13]);
    await user.click(
      within(lens).getByRole("button", {
        name: "Break it: program B's own words",
      })
    );
    expect(lens).toHaveAttribute("data-broken", "1");
    expect(lit()).toEqual([...ANCHOR_WORDS]);
    expect(within(lens).getAllByText("same")).toHaveLength(23);
    expect(within(lens).getAllByText("own anchor")).toHaveLength(2);
    expect(lens.textContent).toContain("26,197,902");
  });

  it("shows the 800 bytes behind a disclosure, rendered once opened", () => {
    const { container } = withFacts(<RawBytes locale="en-US" />);
    expect(container.querySelector("pre")).toBeNull();
    expect(container.querySelector("summary")?.textContent).toBe(
      "The 800 bytes, as the verifier reads them▾"
    );
    const details = container.querySelector("details") as HTMLDetailsElement;
    act(() => {
      details.open = true;
      fireEvent(details, new Event("toggle"));
    });
    const pre = container.querySelector("pre") as HTMLElement;
    // One line per word, each a 64-digit hash.
    const lines = [...pre.querySelectorAll("span")].map(
      (line) => line.textContent
    );
    expect(lines).toHaveLength(25);
    for (const line of lines) expect(line).toMatch(/^[0-9a-f]{64}$/);
    expect(pre.getAttribute("data-hash")).toHaveLength(2 + 64 * 25);
  });
});

describe("the page's sections", () => {
  it("opens on the proof of a real day, with its limit and its failing pair", async () => {
    const user = userEvent.setup();
    const chapter = chapterById("tdh");
    const page = chapter.check.find((entry) => entry.id === "proofs");
    expect(page?.href).toBe("/network/tdh/proofs");
    const { container } = withFacts(
      <ProofsHero
        locale="en-US"
        facts={facts}
        chapterNumber={chapter.number ?? ""}
        pageNumber={page?.n ?? ""}
        pageTitle="Zero-knowledge proofs"
      />
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What a proof of a day shows, what is proved so far, and what is not.",
      })
    ).toBeInTheDocument();
    expect(container.querySelector("[data-ex-lede]")).toBeInTheDocument();
    expect(container.querySelector('[data-verdict="halfpair"]')).not.toBeNull();
    expect(container.querySelector('[data-halfpair="10"]')).not.toBeNull();
    expect(
      screen.getByText("Not recorded on Ethereum yet.")
    ).toBeInTheDocument();
    // three computations of the total agree
    expect(container.querySelectorAll('[data-relation="equal"]')).toHaveLength(
      2
    );
    expect(
      container.querySelector('[data-drift-by="D136 D137"]')
    ).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Show a pair that fails" })
    );
    expect(
      container.querySelector('[data-verdict="simulated"]')
    ).not.toBeNull();
    expect(screen.getByText("OutputsDiffer(20)")).toBeInTheDocument();
    expect(
      container
        .querySelector('[data-check="outputs"]')
        ?.getAttribute("data-state")
    ).toBe("refused");
    expect(
      container
        .querySelector('[data-check="proofs"]')
        ?.getAttribute("data-state")
    ).toBe("notReached");
    await user.click(
      screen.getByRole("button", { name: "Back to the real proof" })
    );
    expect(container.querySelector('[data-verdict="halfpair"]')).not.toBeNull();
    // the record so far: five steps, the last one not dated
    expect(container.querySelectorAll("[data-record]")).toHaveLength(5);
  });

  it("renders every other section from the facts alone", () => {
    const { container } = withFacts(
      <>
        <HowMade locale="en-US" facts={facts} />
        <TwoPrograms locale="en-US" facts={facts} />
        <ContractSection locale="en-US" facts={facts} />
        <WhereItStands locale="en-US" facts={facts} />
        <StillTrust locale="en-US" facts={facts} />
      </>
    );
    expect(container.querySelector("[data-fact-unavailable]")).toBeNull();
    expect(container.querySelectorAll("[data-check]")).toHaveLength(
      CONTRACT_CHECKS.length
    );
    expect(container.querySelectorAll("[data-phase]")).toHaveLength(7);
    expect(container.querySelectorAll("[data-row]")).toHaveLength(6);
    expect(screen.getByText("Not deployed.")).toBeInTheDocument();
    expect(
      container.querySelectorAll('[data-fact="proofs.dayB.gpuHoursHigh"]')
        .length
    ).toBeGreaterThan(0);
    for (const id of ["made", "two", "contract", "status", "trust"]) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  it("names its records by commit in How we know, never linking them", () => {
    const { container } = withFacts(
      <ProofsSources
        locale="en-US"
        facts={facts}
        title="Zero-knowledge proofs"
      />
    );
    const footer = container.querySelector("[data-ex-hwk]") as HTMLElement;
    expect(footer).not.toBeNull();
    for (const commit of [
      "d49ffc7",
      "1a89f27",
      "af2a81f",
      "0015ad3",
      "1aedfa3",
    ]) {
      expect(footer.textContent).toContain(commit);
    }
    expect(within(footer).getByText("Private records")).toBeInTheDocument();
    expect(
      [...footer.querySelectorAll("a")].filter((a) =>
        (a.getAttribute("href") ?? "").includes("6529validator")
      )
    ).toHaveLength(0);
  });

  it("has a door the pages that link it can place", () => {
    render(<ProofsDoor from="sure" locale="de-DE" />);
    const door = screen.getByRole("link");
    expect(door).toHaveAttribute("href", "/network/tdh/proofs");
    expect(door).toHaveTextContent("Zero-Knowledge-Beweise");
  });
});

describe("the page's language", () => {
  it("reads ?locale= first, then the reader's Accept-Language", async () => {
    mockAcceptLanguage = "de-DE,de;q=0.9";
    expect(await resolveLocale({})).toBe("de-DE");
    expect(await resolveLocale({ locale: "es-ES" })).toBe("es-ES");
    expect(await resolveLocale({ locale: ["fr-FR"] })).toBe("fr-FR");
    mockAcceptLanguage = "fr";
    expect(await resolveLocale({})).toBe("fr-FR");
    mockAcceptLanguage = "ja-JP, *";
    expect(await resolveLocale({ locale: "xx" })).toBe("en-US");
    mockAcceptLanguage = null;
    expect(await resolveLocale({})).toBe("en-US");
  });

  it("has every key in every locale, with the same placeholders", () => {
    const load = (locale: string) =>
      JSON.parse(
        readFileSync(
          path.join(
            __dirname,
            `../../i18n/messages/explainedTdhProofs.${locale}.json`
          ),
          "utf8"
        )
      ) as Record<string, string>;
    const source = load("en-US");
    const holes = (value: string) => (value.match(/\{\w+\}/g) ?? []).sort();
    for (const locale of ["en-GB", "fr-FR", "es-ES", "de-DE"]) {
      const other = load(locale);
      expect(Object.keys(other).sort()).toEqual(Object.keys(source).sort());
      for (const [key, text] of Object.entries(source)) {
        expect([locale, key, holes(other[key] ?? "")]).toEqual([
          locale,
          key,
          holes(text),
        ]);
      }
    }
  });

  it("prints every proofs fact the registry knows", () => {
    const ids = Object.keys(snapshot.facts).filter((id) =>
      id.startsWith("proofs.")
    );
    expect(ids.length).toBeGreaterThan(50);
    for (const id of ids) {
      const entry = snapshot.facts[id];
      expect([id, entry && isFact(entry)]).toEqual([id, true]);
      expect((entry as Fact).source.ref.length).toBeGreaterThan(10);
    }
  });
});
