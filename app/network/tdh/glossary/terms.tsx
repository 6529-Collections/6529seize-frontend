import Link from "next/link";
import type { MarkKind } from "@/components/explained/marks/Mark";
import { EX_LINK } from "@/components/explained/tokens";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { CodeName } from "@/components/explained/reference/parts";
import type { printers } from "@/components/explained/facts/printers";
import type { RichValues } from "@/components/explained/rich";

/**
 * The glossary's terms (TDH-DESIGN.md §4.7, S5): each with its id (the
 * overview's old `#glossary-<term>` anchor), the old anchors of terms merged
 * into it, its status and the facts its meaning prints.
 */
export type GlossaryKey = Extract<
  MessageKey,
  `explained.tdh.glossary.${string}`
>;

export type Status =
  | { readonly mark: MarkKind; readonly ref?: string }
  | { readonly track: "live"; readonly label?: GlossaryKey }
  | { readonly word: GlossaryKey };

interface Term {
  readonly id: string;
  /** Old anchors of terms merged into this one. */
  readonly also?: readonly string[];
  readonly status: Status;
  readonly values?: (p: ReturnType<typeof printers>) => RichValues;
  /** Another definition key when the facts call for it (a date now past). */
  readonly def?: (p: ReturnType<typeof printers>) => GlossaryKey | null;
  /** The chapter's model that shows the term moving: a #model-<id> link. */
  readonly model?: string;
}

const HOW = "/network/tdh/how-it-works";

const LIVE: Status = { track: "live" };

/** The terms in reading order: what TDH is, its parts, time, wallets, the rules and their checks. */
export const TERMS: readonly Term[] = [
  { id: "tdh", status: LIVE },
  {
    id: "v14",
    also: ["versions"],
    status: { mark: "decided", ref: "D137" },
    values: (p) => ({
      since: p.v("versions.current.since", "long"),
      renamed: p.v("names.renamedAt", "long"),
      version: <CodeName>{p.v("rules.version")}</CodeName>,
      first: p.v("tdh.days.first", "long"),
      equal: p.v("tdh.days.equal"),
      compared: p.v("tdh.days.compared"),
      versions: (
        <Link className={EX_LINK} href="/network/tdh/historic-boosts">
          {t(DEFAULT_LOCALE, "explained.tdh.glossary.v14.versions")}
        </Link>
      ),
    }),
  },
  { id: "p26", status: { mark: "proposed" } },
  { id: "memes", status: LIVE },
  {
    id: "cc0",
    model: "/explained#model-licence",
    status: { mark: "absolute", ref: "D89" },
  },
  { id: "card", status: { word: "explained.tdh.glossary.convention" } },
  {
    id: "edition",
    model: `${HOW}#model-rates`,
    status: LIVE,
    values: (p) => ({
      threshold: p.v("rules.editionThreshold"),
      cap: p.v("rules.editionFloorCap"),
    }),
  },
  {
    id: "firstgm",
    model: "/network/tdh#model-squash",
    status: LIVE,
    values: (p) => ({
      id: p.v("rules.firstgmId"),
      minted: p.v("firstgm.minted"),
      edition: p.v("meme.8.edition"),
      rate: p.v("engine.rate.firstGM"),
    }),
  },
  {
    id: "threshold",
    status: { mark: "absolute", ref: "D89" },
    values: (p) => ({ threshold: p.v("rules.editionThreshold") }),
  },
  {
    id: "claimLimit",
    status: LIVE,
    values: (p) => ({ cap: p.v("rules.editionFloorCap") }),
  },
  {
    id: "rate",
    model: `${HOW}#model-rates`,
    status: LIVE,
    values: (p) => ({
      h: p.v("engine.H"),
      rate: p.v("engine.rate.310"),
      cap: p.v("rules.editionFloorCap"),
    }),
  },
  {
    id: "largest",
    model: "/network/tdh#model-squash",
    status: LIVE,
    values: (p) => ({ h: p.v("engine.H") }),
  },
  { id: "cents", status: { word: "explained.tdh.glossary.convention" } },
  { id: "arith", status: { mark: "proposed", ref: "P26 §8.1" } },
  { id: "raw", status: LIVE },
  { id: "base", status: LIVE },
  { id: "boost", model: `${HOW}#model-boost`, status: LIVE },
  {
    id: "beta",
    model: `${HOW}#model-boost`,
    status: { mark: "proposed", ref: "P26 §8.3" },
  },
  {
    id: "season",
    model: `${HOW}#model-boost`,
    status: LIVE,
    values: (p) => ({
      bonus: p.v("rules.seasonBonus"),
      last: p.v("rules.lastBoostedSeason"),
    }),
  },
  { id: "fullSet", status: LIVE },
  { id: "final", status: LIVE },
  {
    id: "cycle",
    status: { mark: "decided", ref: "D30" },
    values: (p) => ({
      cycle: p.v("tdh.latest.cycle"),
      date: p.v("tdh.latest.date", "long"),
    }),
  },
  { id: "snapshot", status: LIVE },
  { id: "finalized", status: LIVE },
  {
    id: "identity",
    model: `${HOW}#model-identity`,
    status: { mark: "decided", ref: "D136" },
    values: (p) => ({
      max: p.v("rules.maxWallets"),
      ungated: p.v("rules.ungatedMaxWallets"),
      gate: p.v("rules.gateDay", "long"),
    }),
  },
  {
    id: "consolidation",
    model: "/network/tdh/consolidation#model-wallets",
    status: { mark: "decided", ref: "D136" },
  },
  { id: "pairkey", status: { mark: "decided", ref: "D136" } },
  { id: "delegation", status: LIVE },
  {
    id: "xtdh",
    status: { track: "live", label: "explained.tdh.glossary.liveBeta" },
  },
  {
    id: "burn",
    also: ["sink"],
    status: LIVE,
    values: () => ({ dead: <CodeName>0x…dEaD</CodeName> }),
  },
  {
    id: "netting",
    model: `${HOW}#model-netting`,
    status: { mark: "decided", ref: "D131" },
  },
  { id: "stack", model: `${HOW}#model-stacks`, status: LIVE },
  { id: "underflow", status: LIVE },
  { id: "canonical", status: { mark: "proposed", ref: "P26 §3.3" } },
  { id: "registry", status: { mark: "proposed", ref: "P26" } },
  {
    id: "vector",
    status: { mark: "tested" },
    values: (p) => ({ count: p.v("rules.vectors") }),
  },
  {
    id: "lean",
    also: ["theorem"],
    // The theorems are proved; the model itself is a definition, which the
    // vectors test against P26.
    status: { mark: "tested", ref: "P26" },
    values: (p) => ({
      count: p.v("manifest.proved"),
      tdh: p.v("manifest.proved.tdh"),
    }),
  },
  { id: "axioms", also: ["kernel"], status: { mark: "assumed" } },
  {
    id: "counterexample",
    also: ["shown-false"],
    status: { mark: "shownFalse" },
  },
  { id: "limit", status: { mark: "notGuaranteed" } },
  {
    id: "zk",
    also: ["proof-a", "proof-b"],
    status: { mark: "decided", ref: "D119, D128" },
  },
  { id: "zkvm", status: { mark: "decided", ref: "D119" } },
  // Both wrappers on BN254 is what is built (contracts open issue 6), not a
  // decision: P52, a proposal, recommends another one for program B.
  { id: "groth16", status: { mark: "open", ref: "P52 §3.7" } },
  {
    id: "tproof",
    model: "/network/tdh/proofs#model-words",
    status: { mark: "decided", ref: "D128" },
    values: (p) => ({ words: p.v("proofs.statement.words") }),
  },
  {
    id: "halfPair",
    status: { word: "explained.tdh.glossary.convention" },
  },
  {
    id: "word",
    model: "/network/tdh/proofs#model-words",
    status: { mark: "decided", ref: "D128" },
    values: (p) => ({
      words: p.v("proofs.statement.words"),
      bytes: p.v("proofs.statement.wordBytes"),
    }),
  },
  { id: "anchor", status: { mark: "decided", ref: "D128" } },
  { id: "route", status: LIVE },
  { id: "bloom", status: { word: "explained.tdh.glossary.convention" } },
  { id: "readonly", status: { word: "explained.tdh.glossary.convention" } },
  {
    id: "horizon",
    status: { mark: "decided", ref: "D128" },
    values: (p) => ({ horizon: p.v("proofs.contract.horizon", "long") }),
  },
  { id: "root", status: { mark: "decided", ref: "D112" } },
  { id: "comparison", status: { mark: "tested" } },
  { id: "classes", status: LIVE },
  {
    id: "knowncause",
    status: { word: "explained.tdh.glossary.convention" },
  },
  { id: "simulated", status: { word: "explained.tdh.glossary.convention" } },
  {
    id: "cutover",
    status: { mark: "decided", ref: "D132" },
    def: (p) =>
      p.text("tdh.cutover.checkedAt") === null
        ? null
        : "explained.tdh.glossary.cutover.defLate",
    values: (p) => ({
      about: p.v("tdh.cutover.about", "long"),
      checked: p.v("tdh.cutover.checkedAt", "long"),
    }),
  },
  {
    id: "programs",
    also: ["rust"],
    status: { mark: "decided", ref: "D119, D125" },
  },
  {
    id: "validator",
    status: { mark: "decided", ref: "D112, D137, D149" },
    values: (p) => ({ version: p.v("site.validator.version") }),
  },
  {
    id: "items",
    status: { word: "explained.tdh.glossary.convention" },
    values: () => ({
      p: <CodeName>P26</CodeName>,
      d: <CodeName>D132</CodeName>,
      dev: <CodeName>DEV-2</CodeName>,
      bug: <CodeName>BUG-15</CodeName>,
    }),
  },
  { id: "nic", status: { mark: "decided", ref: "D142" } },
];
