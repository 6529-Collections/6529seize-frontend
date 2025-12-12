export interface XtdhMetricsProps {
  readonly multiplier: string;
  readonly producedXtdhRate: string;
  readonly granted: string;
}

export interface XtdhReceivingProps {
  readonly rate: string;
  readonly totalReceived: string;
  readonly totalGranted: string;
}

export interface XtdhStatsProps {
  readonly metrics: XtdhMetricsProps;
  readonly receiving?: XtdhReceivingProps;
  readonly className?: string;
}
