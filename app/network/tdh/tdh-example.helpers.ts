export type TdhExampleDays = 0 | 30;

interface TdhExampleCard {
  readonly id: "firstGm" | "nakamoto" | "gradient";
  readonly copies: number;
  readonly holdingDays: number;
  readonly rate: number;
}

export interface TdhExampleRow extends TdhExampleCard {
  readonly base: number;
  readonly final: number;
}

interface TdhExampleResult {
  readonly rows: readonly TdhExampleRow[];
  readonly boost: number;
  readonly baseTotal: number;
  readonly total: number;
}

export const TDH_EXAMPLE_CARDS: readonly TdhExampleCard[] = [
  { id: "firstGm", copies: 2, holdingDays: 100, rate: 1 },
  { id: "nakamoto", copies: 1, holdingDays: 60, rate: 13.14 },
  { id: "gradient", copies: 1, holdingDays: 30, rate: 39.02 },
] as const;

const roundWhole = (value: number) => Math.round(value);
const roundThree = (value: number) => Math.round(value * 1_000) / 1_000;

export function calculateTdhExample(
  days: TdhExampleDays,
  sellNakamoto: boolean
): TdhExampleResult {
  const cards = TDH_EXAMPLE_CARDS.filter(
    ({ id }) => !(sellNakamoto && id === "nakamoto")
  );
  const boost = sellNakamoto ? 1.02 : 1.03;
  const rows = cards.map((card) => {
    const base = roundWhole(
      roundThree(card.rate * card.copies * (card.holdingDays + days))
    );
    return { ...card, base, final: roundWhole(base * boost) };
  });

  return {
    rows,
    boost,
    baseTotal: rows.reduce((total, row) => total + row.base, 0),
    total: roundWhole(rows.reduce((total, row) => total + row.final, 0)),
  };
}
