export type CalculatorStatus = "idle" | "loading" | "success" | "error";

export interface CalculationRow {
  readonly label: string;
  readonly description: string;
  readonly score: number;
  readonly weight: number;
  readonly tone: string;
}
