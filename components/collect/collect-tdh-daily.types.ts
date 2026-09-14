export interface CollectTdhDailyInput {
  readonly mode: "daily_tdh" | "budget";
  readonly value: string;
}

/** Decimal display values from a validated canonical analysis, plus its exact payload. */
export interface CollectTdhDailyEstimate<T> {
  readonly dailyTdh: string;
  readonly purchaseEth: string;
  readonly payload: T;
}

export type CollectTdhDailyStatus = "idle" | "calculating" | "ready" | "error";
