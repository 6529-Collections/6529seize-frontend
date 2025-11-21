import type { useIdentityTdhStats } from "@/hooks/useIdentityTdhStats";

export interface StatCardProps {
  readonly id: string;
  readonly label: string;
  readonly tooltip: string;
  readonly value: string;
  readonly suffix?: string;
}

export interface BaseMetricsSectionProps {
  readonly cards: ReadonlyArray<StatCardProps>;
}

export interface AllocationContent {
  readonly grantedDisplay: string;
  readonly totalDisplay: string;
  readonly availableDisplay: string;
  readonly percentage: number;
  readonly ariaValueText: string;
}

export interface AllocationSectionProps {
  readonly allocation: AllocationContent;
}

export interface ReceivingContent {
  readonly rateDisplay: string;
  readonly totalReceivedDisplay: string;
  readonly totalGrantedDisplay: string;
}

export interface ReceivingSectionProps {
  readonly receiving: ReceivingContent;
}

export interface StatsContent {
  readonly baseMetricCards: ReadonlyArray<StatCardProps>;
  readonly allocation: AllocationContent;
  readonly receiving: ReceivingContent;
}

export type IdentityTdhStatsData = NonNullable<
  ReturnType<typeof useIdentityTdhStats>["data"]
>;

export interface UserPageXtdhStatsHeaderProps {
  readonly profileId: string | null;
}
