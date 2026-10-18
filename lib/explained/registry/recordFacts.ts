import type { FactInputs } from "../factInputs";
import {
  RECORD_REFRESH,
  RENDER_REFRESH,
  p26Source,
  recordSource,
  source,
} from "./helpers";
import { defineFact, type FactDef, type FactFamily } from "./types";

/**
 * Facts from 6529's design record (6529chain, read at `origin/main` by
 * `scripts/explained/sync-record.mjs`): the rules as P26 states them, the
 * Lean model's commit, the record's head and every cited decision.
 */

type Registry = FactInputs["record"]["p26"]["registry"];

function registryValue(
  key: keyof Registry,
  section: string,
  format: "count" | "cents" = "count",
  extra: Pick<FactDef<number>, "standing"> = {}
): FactDef<number> {
  return defineFact<number>({
    format,
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, section),
    ...extra,
    value: (inputs) => inputs.record.p26.registry[key],
  });
}

export const RECORD_FACTS = {
  "page.readAt": defineFact<string>({
    format: "clock",
    unit: "UTC",
    refresh: RENDER_REFRESH,
    source: (inputs) =>
      source("site", "this page, when it read its sources", {
        readAt: inputs.now,
      }),
    value: (inputs) => inputs.now,
  }),
  "rules.version": defineFact<string>({
    format: "text",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§10"),
    standing: { kind: "proposed", ref: "P26" },
    maturity: "live",
    value: (inputs) => inputs.record.p26.ruleVersion,
  }),
  "rules.registry": defineFact<string>({
    format: "hash",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§10, vector 28"),
    value: (inputs) => inputs.record.p26.registryHash,
  }),
  "rules.ruleId": defineFact<string>({
    format: "hash",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§10"),
    value: (inputs) => inputs.record.p26.ruleId,
  }),
  "rules.vectors": defineFact<number>({
    format: "count",
    unit: "vectors",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§13, design/tdh-reference/vectors"),
    value: (inputs) => inputs.record.p26.vectors,
  }),
  "rules.p26Commit": defineFact<string>({
    format: "commit",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "header"),
    value: (inputs) => inputs.record.p26.commit,
  }),
  "rules.p26Date": defineFact<string>({
    format: "day",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "header"),
    value: (inputs) => inputs.record.p26.date,
  }),
  "rules.leanCommit": defineFact<string>({
    format: "commit",
    refresh: RECORD_REFRESH,
    source: (inputs) =>
      recordSource(inputs, "the Lean model (design/tdh-lean)"),
    value: (inputs) => inputs.record.lean.commit,
  }),
  "rules.chainHead": defineFact<string>({
    format: "commit",
    refresh: RECORD_REFRESH,
    source: (inputs) => recordSource(inputs, "the record's head"),
    value: (inputs) => inputs.record.head.commit,
  }),
  "rules.chainHeadDate": defineFact<string>({
    format: "day",
    refresh: RECORD_REFRESH,
    source: (inputs) => recordSource(inputs, "the record's head"),
    value: (inputs) => inputs.record.head.date,
  }),
  "rules.newestDecision": defineFact<string>({
    format: "text",
    refresh: RECORD_REFRESH,
    source: (inputs) => recordSource(inputs, "the D table"),
    value: (inputs) => inputs.record.head.newestDecision,
  }),
  "rules.maxWallets": registryValue(
    "consolidation_max_wallets",
    "§6.3, §10",
    "count",
    {
      standing: { kind: "decided", ref: "D136" },
    }
  ),
  "rules.ungatedMaxWallets": registryValue(
    "consolidation_ungated_max_wallets",
    "§6.3, §10"
  ),
  "rules.gateActivation": defineFact<string>({
    format: "instant",
    unit: "UTC",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§6.3, §10"),
    standing: { kind: "decided", ref: "D136" },
    value: (inputs) =>
      new Date(
        inputs.record.p26.registry.consolidation_gate_activation_s * 1000
      )
        .toISOString()
        .replace(".000Z", "Z"),
  }),
  "rules.editionThreshold": registryValue(
    "edition_floor_threshold",
    "§5.2, §10",
    "count",
    {
      standing: { kind: "absolute", ref: "D89" },
    }
  ),
  "rules.editionFloorCap": registryValue("edition_floor_cap", "§5.2, §10"),
  "rules.seasonBonus": registryValue("season_bonus", "§8.3, §10", "cents"),
  "rules.lastBoostedSeason": registryValue("last_boosted_season", "§8.3, §10"),
  "rules.genesisBonus": registryValue("genesis_bonus", "§8.3, §10", "cents"),
  "rules.nakamotoBonus": registryValue("nakamoto_bonus", "§8.3, §10", "cents"),
  "rules.gradientBonus": registryValue("gradient_bonus", "§8.3, §10", "cents"),
  "rules.gradientMax": registryValue("gradient_max_count", "§8.3, §10"),
  "rules.daySeconds": registryValue("day_s", "§4.3, §10"),
} as const;

/** `decision.D136`: a decision's one-line summary, Decided, with its number. */
export const DECISION_FAMILY: FactFamily = {
  pattern: /^decision\.(D\d{1,3})$/,
  def: (id) =>
    defineFact<string>({
      format: "text",
      refresh: RECORD_REFRESH,
      source: (inputs) => recordSource(inputs, `decision ${id}`),
      standing: { kind: "decided", ref: id },
      value: (inputs) => {
        const decision = inputs.record.decisions.find(
          (entry) => entry.id === id
        );
        if (!decision) {
          throw new Error(
            `Unknown fact "decision.${id}": the record has no ${id}.`
          );
        }
        return "summary" in decision && typeof decision.summary === "string"
          ? decision.summary
          : id;
      },
    }),
};
