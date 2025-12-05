

export interface XtdhStatsResponse {
  readonly tdhRate: number;
  readonly multiplier: number;
  readonly dailyCapacity: number;
  readonly xtdhRateGranted: number;
  readonly xtdhRateAutoAccruing: number;
  readonly xtdhRateReceived: number;
  readonly totalXtdhReceived: number;
  readonly totalXtdhGranted: number;
  readonly allocationsCount: number;
  readonly collectionsAllocatedCount: number;
  readonly tokensAllocatedCount: number;
}











