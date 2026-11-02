import reference from "../data/reference.json";
import type { FactInputs } from "../factInputs";
import {
  EDITIONS_REFRESH,
  RECORD_REFRESH,
  editionsSource,
  engineSource,
  p26Source,
  recordSource,
  source,
} from "./helpers";
import {
  defineFact,
  type FactDef,
  type FactFormat,
  type FactSourceKind,
} from "./types";

/**
 * Facts of the TDH reference pages (How sure and the shelf: the
 * specification, implementations and vectors, versions and boosts, the
 * glossary). Four kinds:
 * - the record (6529chain, synced): the Lean model's commit, P26's
 *   deviations and issues, the registry values the specification prints;
 * - history that does not change (`data/reference.json`): the rules' old
 *   name, the netting sentence's three commits, the counterexamples'
 *   numbers, earlier boost schedules, each with its source;
 * - the editions: which seasons pay today;
 * - nothing typed in a page: every value here has its source line.
 */

const REFERENCE_REFRESH =
  "history: fixed once recorded (reviewed at the fact gate)";

type Reference = typeof reference;

function fromReference<T extends number | string>(
  format: FactFormat,
  kind: FactSourceKind,
  ref: (data: Reference) => string,
  pick: (data: Reference) => T,
  unit?: "theorems" | "vectors" | "checks" | "days" | "seasons" | "minutes"
): FactDef<T> {
  return defineFact<T>({
    format,
    ...(unit === undefined ? {} : { unit }),
    refresh: REFERENCE_REFRESH,
    source: () => source(kind, ref(reference)),
    value: () => pick(reference),
  });
}

const casesRef = (data: Reference) => data.cases.source;
const nettingRef = (data: Reference) => data.netting.source;
const namesRef = (data: Reference) => data.names.source;

/** Minutes between two instants, rounded to the minute. */
function minutesBetweenIso(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 60_000);
}

type Registry = FactInputs["engine"]["registry"];

/**
 * A value of P26 §10's registry record, read from the registry the engine
 * computes on (the engine seam test checks it against the record).
 */
function registryField<T extends number | string>(
  format: FactFormat,
  section: string,
  pick: (registry: Registry) => T
): FactDef<T> {
  return defineFact<T>({
    format,
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, section),
    value: (inputs) => pick(inputs.engine.registry),
  });
}

/** Seasons that pay today: every season before the current one, up to the last boosted. */
function payingSeasons(inputs: FactInputs): number | undefined {
  const cards = inputs.editions?.cards;
  if (!cards || cards.length === 0) {
    return undefined;
  }
  const current = Math.max(...cards.map((card) => card.season));
  const last = inputs.record.p26.registry.last_boosted_season;
  return Math.max(0, Math.min(current - 1, last));
}

const publicVectorsSource = (inputs: FactInputs) =>
  source(
    "spec",
    `P26's vectors at 6529chain ${inputs.record.p26.commit.slice(0, 7)}, restated in /network/tdh/public-vectors.json`
  );

/**
 * P26 §10's registry record, every field as the specification prints it:
 * integers as numbers, addresses and hashes as text, lists as lists.
 */
export type RegistryRecord = Readonly<
  Record<string, string | number | readonly (string | number)[]>
>;

function registryRecord(registry: Registry): RegistryRecord {
  const out: Record<string, string | number | (string | number)[]> = {};
  for (const [name, value] of Object.entries(registry)) {
    if (Array.isArray(value)) {
      out[name] = value.map((item: unknown) =>
        typeof item === "bigint" ? item.toString() : (item as string | number)
      );
    } else if (typeof value === "bigint") {
      out[name] = value.toString();
    } else {
      out[name] = value as string | number;
    }
  }
  return out;
}

export interface HalfCent {
  /** H, the largest effective edition. */
  readonly h: number;
  /** The editions at which 100 H / E is an exact half cent. */
  readonly editions: readonly number[];
  /** One of them where binary64 rounds the half cent down, and its two rates. */
  readonly example: number;
  readonly rate: number;
  readonly halfUp: number;
  readonly [key: string]: number | readonly number[];
}

/**
 * P26 §8.1's half-cent trap on today's H: the editions where 200 H / E is
 * an odd integer, and one where RATE (two binary64 roundings) differs from
 * plain half-up.
 */
function halfCent(inputs: FactInputs): HalfCent | undefined {
  const cards = inputs.editions?.cards;
  if (!cards || cards.length === 0) {
    return undefined;
  }
  const h = Math.max(
    ...cards.map(
      (card) =>
        inputs.engine.effectiveEdition(
          card.minted,
          inputs.editions?.claimLimits[String(card.id)] ?? card.minted
        ).edition
    )
  );
  const editions: number[] = [];
  for (let edition = 1; edition <= h; edition += 1) {
    const twice = 200 * h;
    if (twice % edition === 0 && (twice / edition) % 2 === 1) {
      editions.push(edition);
    }
  }
  const halfUp = (edition: number) => Math.floor((100 * h) / edition + 0.5);
  const example = editions.find(
    (edition) => inputs.engine.rateCents(h, edition) !== halfUp(edition)
  );
  if (example === undefined) {
    return undefined;
  }
  return {
    h,
    editions,
    example,
    rate: inputs.engine.rateCents(h, example),
    halfUp: halfUp(example),
  };
}

export interface VersionRow {
  readonly id: string;
  readonly version: string;
  readonly from: string;
  readonly to: string;
  readonly fullSet: number;
  readonly maxSeason: number;
  readonly [key: string]: string | number;
}

/** The boost 6529.io's code applied before TDH v1.1, which the Historic boosts page does not archive. */
export interface BeforeRow {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly fullSet: number;
  readonly fullSetMax: number;
  readonly partialHigh: number;
  readonly partialLow: number;
  readonly [key: string]: string | number;
}

export interface ItemRow {
  readonly id: string;
  readonly settled: boolean;
  readonly [key: string]: string | boolean;
}

export const REFERENCE_FACTS = {
  // The Lean model at the record's commit (its counts are the manifest's).
  "rules.leanDate": defineFact<string>({
    format: "day",
    refresh: RECORD_REFRESH,
    source: (inputs) =>
      recordSource(inputs, "the Lean model (design/tdh-lean)"),
    value: (inputs) => inputs.record.lean.date.slice(0, 10),
  }),

  // P26 §11 and §12, by ID.
  "spec.deviations": defineFact<ItemRow[]>({
    format: "list",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§11"),
    value: (inputs) =>
      inputs.record.p26.deviations.map((item) => ({
        id: item.id,
        settled: item.settled,
      })),
  }),
  "spec.deviations.inForce": defineFact<number>({
    format: "count",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§11"),
    value: (inputs) =>
      inputs.record.p26.deviations.filter((item) => !item.settled).length,
  }),
  "engine.halfCent": defineFact<HalfCent>({
    format: "list",
    refresh: EDITIONS_REFRESH,
    source: (inputs) =>
      engineSource(inputs, "P26 §8.1, the editions at an exact half cent"),
    value: halfCent,
  }),
  "spec.issueIds": defineFact<string[]>({
    format: "list",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§12"),
    value: (inputs) => [...inputs.record.p26.issues],
  }),
  "rules.registryRecord": defineFact<RegistryRecord>({
    format: "list",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§10"),
    value: (inputs) => registryRecord(inputs.engine.registry),
  }),
  "spec.issues": defineFact<number>({
    format: "count",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§12"),
    value: (inputs) => inputs.record.p26.issues.length,
  }),

  // P26 §10's registry values the specification prints beyond the kit's.
  "rules.eligibilityAge": defineFact<number>({
    format: "count",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§5.1, §10"),
    value: (inputs) => inputs.record.p26.registry.eligibility_min_age_s,
  }),
  "rules.gateActivationSeconds": defineFact<number>({
    format: "count",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§6.3, §10"),
    standing: { kind: "decided", ref: "D136" },
    value: (inputs) =>
      inputs.record.p26.registry.consolidation_gate_activation_s,
  }),
  "rules.gateDay": defineFact<string>({
    format: "day",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§6.3, §10"),
    standing: { kind: "decided", ref: "D136" },
    value: (inputs) =>
      new Date(
        inputs.record.p26.registry.consolidation_gate_activation_s * 1000
      )
        .toISOString()
        .slice(0, 10),
  }),
  "rules.fullSetCeiling": defineFact<number>({
    format: "cents",
    refresh: RECORD_REFRESH,
    source: (inputs) => p26Source(inputs, "§8.3, §10"),
    value: (inputs) => {
      const { season_bonus: bonus, last_boosted_season: last } =
        inputs.record.p26.registry;
      return Math.round((1 + bonus * last) * 100) / 100;
    },
  }),
  "rules.firstgmId": registryField("count", "§5.2, §10", (registry) =>
    Number(registry.firstgm_id)
  ),
  "rules.firstgmAdjustment": registryField("count", "§5.2, §10", (registry) =>
    Number(registry.firstgm_edition_adjustment)
  ),
  "rules.additionalSetFirst": registryField(
    "cents",
    "§8.3, §10",
    (registry) => registry.additional_set_first / 1_000_000
  ),
  "rules.additionalSetRatio": registryField("text", "§8.3, §10", (registry) =>
    (registry.additional_set_ratio / 10_000).toFixed(4)
  ),
  "rules.contract.memes": registryField(
    "hash",
    "§2, §10",
    (registry) => registry.memes
  ),
  "rules.contract.gradients": registryField(
    "hash",
    "§2, §10",
    (registry) => registry.gradients
  ),
  "rules.contract.nextgen": registryField(
    "hash",
    "§2, §10",
    (registry) => registry.nextgen
  ),
  "rules.contract.delegation": registryField(
    "hash",
    "§2, §10",
    (registry) => registry.delegation
  ),
  "rules.contract.claim": registryField(
    "hash",
    "§2, §10",
    (registry) => registry.manifold_lazy_claim
  ),

  // The public vectors.
  "vectors.public": defineFact<string[]>({
    format: "list",
    refresh: RECORD_REFRESH,
    source: publicVectorsSource,
    value: () => [...reference.publicVectors.ids],
  }),
  "vectors.public.count": defineFact<number>({
    format: "count",
    unit: "vectors",
    refresh: RECORD_REFRESH,
    source: publicVectorsSource,
    value: () => reference.publicVectors.ids.length,
  }),

  // The rules' old name and the day it changed (D136, D137).
  "names.renamedAt": fromReference<string>("day", "spec", namesRef, (data) =>
    data.names.renamedAt.slice(0, 10)
  ),
  "names.renamedCommit": fromReference<string>(
    "commit",
    "spec",
    namesRef,
    (data) => data.names.renamedCommit
  ),
  "firstgm.minted": fromReference<number>(
    "count",
    "spec",
    (data) => data.firstgm.source,
    (data) => data.firstgm.minted
  ),
  "names.v10.name": fromReference<string>(
    "text",
    "spec",
    namesRef,
    (data) => data.names.v10.ruleVersion
  ),
  "names.v10.registry": fromReference<string>(
    "hash",
    "spec",
    namesRef,
    (data) => data.names.v10.registryHash
  ),
  "names.v10.ruleId": fromReference<string>(
    "hash",
    "spec",
    namesRef,
    (data) => data.names.v10.ruleId
  ),
  "names.v10.commit": fromReference<string>(
    "commit",
    "spec",
    namesRef,
    (data) => data.names.v10.commit
  ),
  "names.v10.maxWallets": fromReference<number>(
    "count",
    "spec",
    namesRef,
    (data) => data.names.v10.maxWallets
  ),

  // 6529.io's boost schedules.
  "versions.current.since": fromReference<string>(
    "day",
    "site",
    (data) => data.versions.source,
    (data) => data.versions.current.since
  ),
  "versions.current.number": fromReference<string>(
    "text",
    "site",
    (data) => data.versions.source,
    (data) => data.versions.current.version
  ),
  "versions.before": defineFact<BeforeRow>({
    format: "text",
    refresh: REFERENCE_REFRESH,
    source: () => source("site", reference.versions.before.source),
    value: () => {
      const { source: _source, ...row } = reference.versions.before;
      return row;
    },
  }),
  "versions.fourWallets": defineFact<string>({
    format: "day",
    refresh: REFERENCE_REFRESH,
    source: () => source("decision", reference.versions.inVersion.source),
    value: () => reference.versions.inVersion.fourWallets,
  }),
  "versions.past": defineFact<VersionRow[]>({
    format: "list",
    refresh: REFERENCE_REFRESH,
    source: () => source("site", reference.versions.source),
    value: () => reference.versions.past.map((row) => ({ ...row })),
  }),
  "engine.seasons.paying": defineFact<number>({
    format: "count",
    unit: "seasons",
    refresh: EDITIONS_REFRESH,
    source: (inputs) =>
      engineSource(inputs, "P26 §5.4, §8.3, the seasons that pay today"),
    value: payingSeasons,
  }),
  "memes.readOn": defineFact<string>({
    format: "day",
    refresh: EDITIONS_REFRESH,
    source: editionsSource,
    value: (inputs) => inputs.editions?.readAt.slice(0, 10),
  }),

  // The netting sentence, refuted twice in one day, then narrowed (P26 §7.1).
  "netting.day": fromReference<string>("day", "spec", nettingRef, (data) =>
    data.netting.first.at.slice(0, 10)
  ),
  "netting.first.at": fromReference<string>(
    "clock",
    "spec",
    nettingRef,
    (data) => data.netting.first.at
  ),
  "netting.first.commit": fromReference<string>(
    "commit",
    "spec",
    nettingRef,
    (data) => data.netting.first.commit
  ),
  "netting.narrowed.at": fromReference<string>(
    "clock",
    "spec",
    nettingRef,
    (data) => data.netting.narrowed.at
  ),
  "netting.narrowed.commit": fromReference<string>(
    "commit",
    "spec",
    nettingRef,
    (data) => data.netting.narrowed.commit
  ),
  "netting.proved.at": fromReference<string>(
    "clock",
    "spec",
    nettingRef,
    (data) => data.netting.proved.at
  ),
  "netting.proved.commit": fromReference<string>(
    "commit",
    "spec",
    nettingRef,
    (data) => data.netting.proved.commit
  ),
  "netting.exact.at": fromReference<string>(
    "clock",
    "spec",
    nettingRef,
    (data) => data.netting.exact.at
  ),
  "netting.exact.commit": fromReference<string>(
    "commit",
    "spec",
    nettingRef,
    (data) => data.netting.exact.commit
  ),
  "netting.first.minutes": fromReference<number>(
    "count",
    "spec",
    nettingRef,
    (data) =>
      minutesBetweenIso(data.netting.first.at, data.netting.narrowed.at),
    "minutes"
  ),
  "netting.narrowed.minutes": fromReference<number>(
    "count",
    "spec",
    nettingRef,
    (data) =>
      minutesBetweenIso(data.netting.narrowed.at, data.netting.proved.at),
    "minutes"
  ),

  // The counterexamples' numbers (cases F, H and I).
  "cases.H.copies": fromReference<number>(
    "count",
    "manifest",
    casesRef,
    (d) => d.cases.H.copies
  ),
  "cases.H.minted.before": fromReference<number>(
    "count",
    "manifest",
    casesRef,
    (d) => d.cases.H.mintedBefore
  ),
  "cases.H.minted.after": fromReference<number>(
    "count",
    "manifest",
    casesRef,
    (d) => d.cases.H.mintedAfter
  ),
  "cases.H.rate.before": fromReference<number>(
    "cents",
    "manifest",
    casesRef,
    (d) => d.cases.H.rateBefore
  ),
  "cases.H.rate.after": fromReference<number>(
    "cents",
    "manifest",
    casesRef,
    (d) => d.cases.H.rateAfter
  ),
  "cases.H.final.before": fromReference<number>(
    "count",
    "manifest",
    casesRef,
    (d) => d.cases.H.finalBefore
  ),
  "cases.H.final.after": fromReference<number>(
    "count",
    "manifest",
    casesRef,
    (d) => d.cases.H.finalAfter
  ),
  "cases.I.h.before": fromReference<number>(
    "count",
    "manifest",
    casesRef,
    (d) => d.cases.I.hBefore
  ),
  "cases.I.h.after": fromReference<number>(
    "count",
    "manifest",
    casesRef,
    (d) => d.cases.I.hAfter
  ),
  "cases.I.final.before": fromReference<number>(
    "count",
    "manifest",
    casesRef,
    (d) => d.cases.I.finalBefore
  ),
  "cases.I.final.after": fromReference<number>(
    "count",
    "manifest",
    casesRef,
    (d) => d.cases.I.finalAfter
  ),
  "cases.F.wallet": fromReference<number>(
    "count",
    "manifest",
    casesRef,
    (d) => d.cases.F.wallet
  ),
  "cases.F.identity": fromReference<number>(
    "count",
    "manifest",
    casesRef,
    (d) => d.cases.F.identity
  ),

  // The model's tests, the validator cap, the programs and the difftests.
  "model.randomInputs": fromReference<number>(
    "count",
    "decision",
    (d) => d.model.source,
    (d) => d.model.randomInputs
  ),
  "model.replayDay": fromReference<string>(
    "day",
    "decision",
    (d) => d.model.source,
    (d) => d.model.replayDay
  ),
  "replay.total": fromReference<number>(
    "count",
    "spec",
    (d) => d.replay.source,
    (d) => d.replay.total
  ),
  "replay.withoutSinks": fromReference<number>(
    "count",
    "spec",
    (d) => d.replay.source,
    (d) => d.replay.withoutSinks
  ),
  "validators.cap": fromReference<string>(
    "text",
    "decision",
    (d) => d.validatorCap.source,
    (d) => `${d.validatorCap.percent}%`
  ),
  "programs.rustReference.time": fromReference<number>(
    "runtime",
    "decision",
    (d) => d.programs.source,
    (d) => Math.round(d.programs.rustReferenceSeconds * 1000)
  ),
  "programs.cleanRoomChoices": fromReference<number>(
    "count",
    "decision",
    (d) => d.programs.source,
    (d) => d.programs.cleanRoomChoices
  ),
  "programs.randomPerChange": fromReference<number>(
    "count",
    "decision",
    (d) => d.programs.source,
    (d) => d.programs.randomPerChange
  ),
  "difftest.rounds": fromReference<number>(
    "count",
    "decision",
    (d) => d.difftest.source,
    (d) => d.difftest.rounds
  ),
  "difftest.from": fromReference<string>(
    "day",
    "decision",
    (d) => d.difftest.source,
    (d) => d.difftest.from
  ),
  "difftest.to": fromReference<string>(
    "day",
    "decision",
    (d) => d.difftest.source,
    (d) => d.difftest.to
  ),
  "difftest.open": fromReference<string>(
    "text",
    "decision",
    (d) => d.difftest.source,
    (d) => d.difftest.open
  ),
} as const;
