import type { EditionCard, FactInputs } from "../factInputs";
import { EDITIONS_REFRESH, editionsSource, engineSource } from "./helpers";
import { defineFact, type FactDef, type FactFamily } from "./types";

/**
 * The Meme editions (6529.io's API) and what the engine computes from them
 * on the rule registry: effective editions, rates and boosts (TDH-DESIGN.md
 * §3 `memes.editions[]` and `engine.*`). Nothing here is typed by hand: a
 * rate is RATE(H, E) on the real editions, a boost is P26 §8.3 on them.
 */

/** FirstGM: the card whose edition is H, the largest (one TDH a day). */
const FIRST_GM_ID = 8;
/** A 6529 Gradient's edition (P26 §8.1: the rate floor of one applies). */
const GRADIENT_EDITION = 101;

const cards = (inputs: FactInputs): readonly EditionCard[] | undefined =>
  inputs.editions?.cards;

function card(inputs: FactInputs, id: number): EditionCard | undefined {
  return cards(inputs)?.find((entry) => entry.id === id);
}

/** E for one card (P26 §5.2): the floor from its claim below 300 minted. */
function effectiveOf(inputs: FactInputs, entry: EditionCard): number {
  // A recorded claim limit first; else 6529.io's own counted edition, which
  // below 300 minted is the claim's floor; else the minted count.
  const claim =
    inputs.editions?.claimLimits[String(entry.id)] ??
    entry.edition ??
    entry.minted;
  return inputs.engine.effectiveEdition(entry.minted, claim).edition;
}

/** H: the largest effective edition of the eligible Memes (FirstGM's, 3,941). */
function hOf(inputs: FactInputs): number | undefined {
  const all = cards(inputs);
  if (all === undefined || all.length === 0) {
    return undefined;
  }
  return Math.max(...all.map((entry) => effectiveOf(inputs, entry)));
}

function rateOf(
  inputs: FactInputs,
  edition: number | undefined,
  minimumOne = false
): number | undefined {
  const h = hOf(inputs);
  if (h === undefined || edition === undefined) {
    return undefined;
  }
  return inputs.engine.rateCents(h, edition, minimumOne) / 100;
}

function boostOf(
  inputs: FactInputs,
  query: { fullSets: number; gradients: number }
): number | undefined {
  const n = cards(inputs)?.length;
  if (n === undefined) {
    return undefined;
  }
  return (
    inputs.engine.boostCents({
      fullSets: query.fullSets,
      gradients: query.gradients,
      completeSeasons: [],
      genesis: false,
      nakamoto: false,
      nMemes: n,
    }) / 100
  );
}

/** Full sets at which ADD stops growing (P26 §8.3: saturates at 33). */
const SATURATED_SETS = 60;

/**
 * The rule's ceiling (P26 §8.3): every season up to the last boosted one
 * complete, ADD saturated, five Gradients, rounded to the cent.
 */
function ceilingOf(inputs: FactInputs): number {
  const registry = inputs.record.p26.registry;
  const micro =
    1_000_000 +
    registry.last_boosted_season *
      Math.round(registry.season_bonus * 1_000_000) +
    inputs.engine.additionalSetsMicro(SATURATED_SETS) +
    registry.gradient_max_count *
      Math.round(registry.gradient_bonus * 1_000_000);
  return Math.floor((2 * micro + 10_000) / 20_000) / 100;
}

function engineRate(
  rule: string,
  pick: (inputs: FactInputs) => number | undefined
): FactDef<number> {
  return defineFact<number>({
    format: "cents",
    refresh: EDITIONS_REFRESH,
    source: (inputs) => engineSource(inputs, rule),
    maturity: "live",
    value: pick,
  });
}

function editionOfCard(id: number) {
  return (inputs: FactInputs) => {
    const entry = card(inputs, id);
    return entry ? effectiveOf(inputs, entry) : undefined;
  };
}

/** The overview hero's default: one copy of Meme #2 held 100 days, no boost. */
const MACHINE_DEFAULT = { card: 2, days: 100, betaCents: 100 } as const;

export const EDITION_FACTS = {
  "memes.count": defineFact<number>({
    format: "count",
    unit: "cards",
    refresh: EDITIONS_REFRESH,
    source: editionsSource,
    value: (inputs) => cards(inputs)?.length,
  }),
  "memes.readAt": defineFact<string>({
    format: "clock",
    unit: "UTC",
    refresh: EDITIONS_REFRESH,
    source: editionsSource,
    value: (inputs) => inputs.editions?.readAt,
  }),
  "memes.seasons": defineFact<number>({
    format: "count",
    unit: "seasons",
    refresh: EDITIONS_REFRESH,
    source: editionsSource,
    value: (inputs) => {
      const all = cards(inputs);
      return all !== undefined && all.length > 0
        ? Math.max(...all.map((entry) => entry.season))
        : undefined;
    },
  }),
  "memes.editions": defineFact<number[][]>({
    format: "list",
    refresh: EDITIONS_REFRESH,
    source: (inputs) =>
      engineSource(inputs, "P26 §5.2, each card's effective edition"),
    value: (inputs) =>
      cards(inputs)?.map((entry) => [
        entry.id,
        entry.season,
        entry.minted,
        effectiveOf(inputs, entry),
      ]),
  }),
  "engine.H": defineFact<number>({
    format: "count",
    unit: "copies",
    refresh: EDITIONS_REFRESH,
    source: (inputs) =>
      engineSource(inputs, "P26 §8.1, H: the largest effective edition"),
    value: hOf,
  }),
  "engine.rate.firstGM": engineRate("P26 §8.1, FirstGM's rate", (inputs) =>
    rateOf(inputs, editionOfCard(FIRST_GM_ID)(inputs))
  ),
  "engine.rate.310": engineRate(
    "P26 §8.1, the rate of a 310-copy card",
    (inputs) => rateOf(inputs, inputs.record.p26.registry.edition_floor_cap)
  ),
  "engine.rate.gradient": engineRate("P26 §8.1, a Gradient's rate", (inputs) =>
    rateOf(
      inputs,
      GRADIENT_EDITION,
      inputs.record.p26.registry.gradient_rate_minimum === 1
    )
  ),
  "engine.boost.oneGradient": engineRate(
    "P26 §8.3, the boost of one Gradient",
    (inputs) => boostOf(inputs, { fullSets: 0, gradients: 1 })
  ),
  "engine.boost.fullSet": engineRate(
    "P26 §8.3, the boost of one full set",
    (inputs) => boostOf(inputs, { fullSets: 1, gradients: 0 })
  ),
  "engine.boost.todayMax": engineRate(
    "P26 §8.3, today's highest boost: full sets and five Gradients",
    (inputs) =>
      boostOf(inputs, {
        fullSets: SATURATED_SETS,
        gradients: inputs.record.p26.registry.gradient_max_count,
      })
  ),
  "engine.boost.ceiling": engineRate(
    "P26 §8.3, the rule's ceiling",
    (inputs) => (cards(inputs) ? ceilingOf(inputs) : undefined)
  ),
  "engine.machine.default": defineFact<number>({
    format: "count",
    unit: "TDH",
    refresh: EDITIONS_REFRESH,
    source: (inputs) =>
      engineSource(inputs, "P26 §8.2, §8.4: one copy of Meme #2 held 100 days"),
    value: (inputs) => {
      const rate = rateOf(inputs, editionOfCard(MACHINE_DEFAULT.card)(inputs));
      if (rate === undefined) {
        return undefined;
      }
      const base = inputs.engine.baseTdh(
        Math.round(rate * 100),
        MACHINE_DEFAULT.days
      );
      return inputs.engine.finalTdh(base, MACHINE_DEFAULT.betaCents);
    },
  }),
} as const;

type MemeField = "minted" | "edition" | "season" | "rate" | "firstMint" | "art";

/** `meme.562.edition`: one card's minted count, effective edition, season, rate, first mint or scaled art. */
export const MEME_FAMILY: FactFamily = {
  pattern: /^meme\.(\d{1,5}\.(?:minted|edition|season|rate|firstMint|art))$/,
  def: (key) => {
    const [idText, field] = key.split(".") as [string, MemeField];
    const id = Number(idText);
    const pick = (inputs: FactInputs): number | string | undefined => {
      if (!inputs.editions) {
        return undefined;
      }
      const entry = card(inputs, id);
      if (!entry) {
        throw new Error(
          `Unknown fact "meme.${key}": 6529.io lists no Meme #${id}.`
        );
      }
      switch (field) {
        case "minted":
          return entry.minted;
        case "edition":
          return effectiveOf(inputs, entry);
        case "season":
          return entry.season;
        case "rate":
          return rateOf(inputs, effectiveOf(inputs, entry));
        case "firstMint":
          return entry.firstMint ?? undefined;
        case "art":
          return entry.art ?? undefined;
      }
    };
    let format: FactDef["format"] = "count";
    if (field === "rate") {
      format = "cents";
    } else if (field === "firstMint") {
      format = "instant";
    } else if (field === "art") {
      format = "text";
    }
    return defineFact<number | string>({
      format,
      ...(field === "minted" || field === "edition"
        ? { unit: "copies" as const }
        : {}),
      refresh: EDITIONS_REFRESH,
      source: (inputs) =>
        field === "rate" || field === "edition"
          ? engineSource(inputs, `P26 §5.2, §8.1 for Meme #${id}`)
          : editionsSource(inputs),
      value: pick,
    });
  },
};
