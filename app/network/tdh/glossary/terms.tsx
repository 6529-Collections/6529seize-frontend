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
}

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
      version: <CodeName>{p.v("rules.version")}</CodeName>,
      versions: (
        <Link className={EX_LINK} href="/network/tdh/historic-boosts">
          {t(DEFAULT_LOCALE, "explained.tdh.glossary.v14.versions")}
        </Link>
      ),
    }),
  },
  { id: "p26", status: { mark: "proposed" } },
  { id: "memes", status: LIVE },
  { id: "card", status: { word: "explained.tdh.glossary.convention" } },
  {
    id: "edition",
    status: LIVE,
    values: (p) => ({
      threshold: p.v("rules.editionThreshold"),
      cap: p.v("rules.editionFloorCap"),
    }),
  },
  {
    id: "firstgm",
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
    id: "rate",
    status: LIVE,
    values: (p) => ({
      h: p.v("engine.H"),
      rate: p.v("engine.rate.310"),
      cap: p.v("rules.editionFloorCap"),
    }),
  },
  { id: "raw", status: LIVE },
  { id: "base", status: LIVE },
  { id: "boost", status: LIVE },
  {
    id: "season",
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
    status: { mark: "decided", ref: "D136" },
    values: (p) => ({
      max: p.v("rules.maxWallets"),
      ungated: p.v("rules.ungatedMaxWallets"),
      gate: p.v("rules.gateDay", "long"),
    }),
  },
  { id: "consolidation", status: { mark: "decided", ref: "D136" } },
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
  { id: "netting", status: { mark: "decided", ref: "D131" } },
  { id: "stack", status: LIVE },
  { id: "underflow", status: LIVE },
  { id: "registry", status: { mark: "proposed", ref: "P26" } },
  {
    id: "vector",
    status: { mark: "tested" },
    values: (p) => ({ count: p.v("rules.vectors") }),
  },
  {
    id: "lean",
    also: ["theorem"],
    status: { mark: "proved" },
    values: (p) => ({ count: p.v("manifest.proved") }),
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
  { id: "root", status: { mark: "decided", ref: "D112" } },
  { id: "comparison", status: { mark: "tested" } },
  { id: "classes", status: LIVE },
  { id: "knowncause", status: { word: "explained.tdh.glossary.renamed" } },
  {
    id: "cutover",
    status: { mark: "decided", ref: "D132" },
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
    status: { mark: "decided", ref: "D112, D137" },
    values: (p) => ({ version: p.v("site.validator.version") }),
  },
  {
    id: "items",
    status: { word: "explained.tdh.glossary.convention" },
    values: () => ({
      d: <CodeName>D132</CodeName>,
      dev: <CodeName>DEV-2</CodeName>,
      bug: <CodeName>BUG-15</CodeName>,
    }),
  },
  { id: "nic", status: { mark: "decided", ref: "D142" } },
];
