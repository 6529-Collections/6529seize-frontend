export interface XtdhStatsResponse {
  readonly baseTdhRate: number;
  readonly multiplier: number;
  readonly xtdhRateGranted: number;
  readonly xtdhRateReceived: number;
  readonly totalXtdhReceived: number;
}

export interface XtdhStatsError {
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
}
