import {
  REGISTRY_V14,
  baseTdh,
  boostOfHoldings,
  dailyRateE4,
  effectiveEdition,
  finalTdh,
  rateCents,
  type BoostHoldings,
  type CopyHolding,
} from "@/components/explained/engine/tdh";
import { EXAMPLE_NETWORK } from "./exampleNetwork";

/**
 * Worked examples for How TDH is calculated. Every value is computed with the
 * TDH v1.4 engine from the network of the 2026-10-11 cycle, and Jest checks
 * each against the numbers the P26 Python reference printed (plan, Appendix A).
 */

const H = EXAMPLE_NETWORK.largestEdition;
const GRADIENT_MINIMUM = REGISTRY_V14.gradient_rate_minimum;

/** The boost, in cents, of a record holding `holdings` on that cycle. */
function boostCents(holdings: Partial<BoostHoldings>): number {
  return boostOfHoldings(
    {
      fullSets: holdings.fullSets ?? 0,
      completeSeasons: holdings.completeSeasons ?? [],
      genesis: holdings.genesis ?? false,
      nakamoto: holdings.nakamoto ?? false,
      gradients: holdings.gradients ?? 0,
    },
    EXAMPLE_NETWORK.eligibleMemes,
    REGISTRY_V14
  ).beta;
}

export const RATE_EXAMPLES = [
  { id: "firstgm", edition: 3_941, cents: rateCents(H, 3_941) },
  {
    id: "nextgen",
    edition: EXAMPLE_NETWORK.nextgenCollectionSize,
    cents: rateCents(H, EXAMPLE_NETWORK.nextgenCollectionSize),
  },
  { id: "meme310", edition: 310, cents: rateCents(H, 310) },
  { id: "meme300", edition: 300, cents: rateCents(H, 300) },
  {
    id: "gradient",
    edition: EXAMPLE_NETWORK.gradients,
    cents: rateCents(H, EXAMPLE_NETWORK.gradients, GRADIENT_MINIMUM),
  },
] as const;

export const EDITION_EXAMPLES = (
  [
    [149, 332],
    [149, 200],
    [299, 333],
    [300, 333],
    [303, 333],
    [309, 329],
  ] as const
).map(([minted, claimLimit]) => {
  const { edition } = effectiveEdition(minted, claimLimit, REGISTRY_V14);
  return { minted, claimLimit, edition, cents: rateCents(H, edition) ?? 0 };
});

interface BoostExample {
  readonly id: string;
  readonly fullSets?: number;
  readonly gradients?: number;
  readonly completeSeasons?: readonly number[];
  readonly genesis?: boolean;
  readonly nakamoto?: boolean;
}

const BOOST_EXAMPLE_INPUTS: readonly BoostExample[] = [
  { id: "nothing" },
  { id: "oneGradient", gradients: 1 },
  { id: "fiveGradients", gradients: 7 },
  { id: "genesisNakamoto", genesis: true, nakamoto: true },
  { id: "season2", completeSeasons: [2] },
  {
    id: "season2GenesisNakamoto",
    completeSeasons: [2],
    genesis: true,
    nakamoto: true,
  },
  { id: "currentSeasonOnly", completeSeasons: [17] },
  { id: "oneFullSet", fullSets: 1 },
  {
    id: "allButNewest",
    completeSeasons: Array.from({ length: 16 }, (_, index) => index + 1),
  },
  { id: "twoFullSets", fullSets: 2 },
  { id: "threeFullSets", fullSets: 3 },
  { id: "oneFullSetFiveGradients", fullSets: 1, gradients: 5 },
  { id: "highest", fullSets: 8, gradients: 5 },
];

export const BOOST_EXAMPLES = BOOST_EXAMPLE_INPUTS.map(
  ({ id, ...holdings }) => ({ id, betaCents: boostCents(holdings) })
);

/**
 * The highest boost on the 2026-10-11 cycle, reached from 8 full sets and five
 * Gradients: ADD keeps growing until 33 sets, but from 8 sets on the total
 * rounds to the same cents. With 17 seasons listed, 16 pay, so it is 2.04, not
 * the 2.24 that 20 paying seasons would allow (P26 §5.4, §8.3, §10).
 */
export const MAX_BOOST_CENTS = boostCents({ fullSets: 33, gradients: 5 });

/** The household of step 12: one collector, two consolidated wallets. */
type HouseholdCardId =
  | "firstgm"
  | "meme310"
  | "gradient1"
  | "gradient2"
  | "nextgen";
type HouseholdWallet = "A" | "B";

interface HouseholdCopy {
  readonly wallet: HouseholdWallet;
  readonly card: HouseholdCardId;
  readonly days: readonly number[];
}

const HOUSEHOLD_CARDS: readonly HouseholdCardId[] = [
  "firstgm",
  "meme310",
  "gradient1",
  "gradient2",
  "nextgen",
];

const HOUSEHOLD_RATES: Record<HouseholdCardId, number> = {
  firstgm: rateCents(H, 3_941) ?? 0,
  meme310: rateCents(H, 310) ?? 0,
  gradient1: rateCents(H, EXAMPLE_NETWORK.gradients, GRADIENT_MINIMUM) ?? 0,
  gradient2: rateCents(H, EXAMPLE_NETWORK.gradients, GRADIENT_MINIMUM) ?? 0,
  nextgen: rateCents(H, EXAMPLE_NETWORK.nextgenCollectionSize) ?? 0,
};

const HOUSEHOLD_HOLDINGS: readonly HouseholdCopy[] = [
  { wallet: "A", card: "firstgm", days: [200, 120] },
  { wallet: "A", card: "meme310", days: [0] },
  { wallet: "A", card: "gradient1", days: [400] },
  { wallet: "B", card: "meme310", days: [90] },
  { wallet: "B", card: "gradient2", days: [30] },
  { wallet: "B", card: "nextgen", days: [365] },
];

type HouseholdScenario = "identity" | "wallets" | "tomorrow" | "sell";

interface HouseholdRow {
  readonly card: HouseholdCardId;
  readonly base: number;
  readonly final: number;
}

interface HouseholdRecord {
  readonly label: "identity" | HouseholdWallet;
  readonly betaCents: number;
  readonly rows: readonly HouseholdRow[];
  readonly base: number;
  readonly final: number;
  readonly dailyRateE4: number;
}

interface HouseholdResult {
  readonly scenario: HouseholdScenario;
  readonly records: readonly HouseholdRecord[];
  readonly total: number;
}

function householdBoost(gradients: number): number {
  return boostCents({ gradients });
}

function scoreRecord(
  label: HouseholdRecord["label"],
  holdings: readonly HouseholdCopy[]
): HouseholdRecord {
  const gradients = holdings.filter((copy) =>
    copy.card.startsWith("gradient")
  ).length;
  const betaCents = householdBoost(gradients);
  const rows: HouseholdRow[] = [];
  for (const card of HOUSEHOLD_CARDS) {
    const walletCopies = holdings.filter((copy) => copy.card === card);
    if (walletCopies.length === 0) {
      continue;
    }
    // Base is rounded per wallet, then summed for the identity (P26 §7.3).
    const base = walletCopies.reduce(
      (sum, copy) =>
        sum +
        baseTdh(
          HOUSEHOLD_RATES[card],
          copy.days.reduce((days, day) => days + Math.max(day, 0), 0)
        ),
      0
    );
    rows.push({ card, base, final: finalTdh(base, betaCents) });
  }
  const copies: CopyHolding[] = holdings.flatMap((copy) =>
    copy.days.map((days) => ({ rateCents: HOUSEHOLD_RATES[copy.card], days }))
  );
  return {
    label,
    betaCents,
    rows,
    base: rows.reduce((sum, row) => sum + row.base, 0),
    final: rows.reduce((sum, row) => sum + row.final, 0),
    dailyRateE4: dailyRateE4(betaCents, copies),
  };
}

export function householdScenario(
  scenario: HouseholdScenario
): HouseholdResult {
  let holdings = HOUSEHOLD_HOLDINGS;
  if (scenario === "tomorrow") {
    holdings = holdings.map((copy) => ({
      ...copy,
      days: copy.days.map((days) => days + 1),
    }));
  } else if (scenario === "sell") {
    holdings = holdings.filter((copy) => copy.card !== "gradient2");
  }
  const records =
    scenario === "wallets"
      ? (["A", "B"] as const).map((wallet) =>
          scoreRecord(
            wallet,
            holdings.filter((copy) => copy.wallet === wallet)
          )
        )
      : [scoreRecord("identity", holdings)];
  return {
    scenario,
    records,
    total: records.reduce((sum, record) => sum + record.final, 0),
  };
}

/** The overview's one-card example: a 310-copy Meme held 100 days, one Gradient. */
/** One full set on the 2026-10-11 cycle: seasons 1 to 16 pay, 1.80. */
const FULL_SET_BETA_CENTS = 180;

export const MINUTE_EXAMPLE = (() => {
  const rate = rateCents(H, 310) ?? 0;
  const base = baseTdh(rate, 100);
  const betaCents = householdBoost(1);
  return {
    days: 100,
    edition: 310,
    largestEdition: H,
    rateCents: rate,
    base,
    betaCents,
    final: finalTdh(base, betaCents),
    /** The same copy for a holder of one full set instead: boost 1.80. */
    fullSetBetaCents: FULL_SET_BETA_CENTS,
    fullSetFinal: finalTdh(base, FULL_SET_BETA_CENTS),
  };
})();
