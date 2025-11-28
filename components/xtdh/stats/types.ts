export interface XtdhMetricsProps {
  readonly tdhRate: string;
  readonly multiplier: string;
  readonly producedXtdhRate: string;
}

export interface XtdhAllocationProps {
  readonly total: string;
  readonly granted: string;
  readonly available: string;
  readonly percentage: number;
  readonly ariaValueText: string;
}

export interface XtdhReceivingProps {
  readonly rate: string;
  readonly totalReceived: string;
  readonly totalGranted: string;
}

export interface XtdhStatsProps {
  readonly metrics: XtdhMetricsProps;
  readonly allocation: XtdhAllocationProps;
  readonly receiving?: XtdhReceivingProps;
  readonly className?: string;
}
