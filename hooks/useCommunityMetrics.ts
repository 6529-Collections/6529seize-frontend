import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiCommunityMetrics } from "@/generated/models/ApiCommunityMetrics";
import type { ApiCommunityMetricSample } from "@/generated/models/ApiCommunityMetricSample";
import { commonApiFetch } from "@/services/api/common-api";

export type CommunityMetricsInterval = "DAY" | "WEEK";

export interface MetricSample {
  readonly eventCount: number;
  readonly valueCount: number;
  readonly periodStart: number;
  readonly periodEnd: number;
}

export interface MetricData {
  readonly current: MetricSample;
  readonly previous: MetricSample;
  readonly eventCountChangePercent: number | null;
  readonly valueCountChangePercent: number | null;
}

export interface CommunityMetrics {
  readonly dropsCreated: MetricData;
  readonly distinctDroppers: MetricData;
  readonly mainStageSubmissions: MetricData;
  readonly mainStageDistinctVoters: MetricData;
  readonly mainStageVotes: MetricData;
  readonly tdhOnMainStageSubmissions: MetricData;
  readonly networkTdh: MetricData;
  readonly tdhOnMainStagePercentage: MetricData;
  readonly consolidationsFormed: MetricData;
}

function sanitizeNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}

function calculateChangePercent(
  current: number,
  previous: number
): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return ((current - previous) / previous) * 100;
}

function transformSample(sample: ApiCommunityMetricSample): MetricSample {
  return {
    eventCount: sanitizeNumber(sample.event_count),
    valueCount: sanitizeNumber(sample.value_count),
    periodStart: sanitizeNumber(sample.period_start),
    periodEnd: sanitizeNumber(sample.period_end),
  };
}

function transformMetric(metric: {
  older: ApiCommunityMetricSample;
  newer: ApiCommunityMetricSample;
}): MetricData {
  const current = transformSample(metric.newer);
  const previous = transformSample(metric.older);

  return {
    current,
    previous,
    eventCountChangePercent: calculateChangePercent(
      current.eventCount,
      previous.eventCount
    ),
    valueCountChangePercent: calculateChangePercent(
      current.valueCount,
      previous.valueCount
    ),
  };
}

function calculateTdhPercentage(
  tdhOnMainStage: MetricData,
  networkTdh: MetricData
): MetricData {
  const currentPercent =
    networkTdh.current.valueCount > 0
      ? (tdhOnMainStage.current.valueCount / networkTdh.current.valueCount) *
        100
      : 0;
  const previousPercent =
    networkTdh.previous.valueCount > 0
      ? (tdhOnMainStage.previous.valueCount / networkTdh.previous.valueCount) *
        100
      : 0;

  return {
    current: {
      eventCount: 0,
      valueCount: currentPercent,
      periodStart: tdhOnMainStage.current.periodStart,
      periodEnd: tdhOnMainStage.current.periodEnd,
    },
    previous: {
      eventCount: 0,
      valueCount: previousPercent,
      periodStart: tdhOnMainStage.previous.periodStart,
      periodEnd: tdhOnMainStage.previous.periodEnd,
    },
    eventCountChangePercent: null,
    valueCountChangePercent: calculateChangePercent(
      currentPercent,
      previousPercent
    ),
  };
}

async function fetchCommunityMetrics(
  interval: CommunityMetricsInterval
): Promise<CommunityMetrics> {
  const response = await commonApiFetch<ApiCommunityMetrics>({
    endpoint: "community-metrics",
    params: { interval },
  });

  const tdhOnMainStageSubmissions = transformMetric(
    response.tdh_on_main_stage_submissions
  );
  const networkTdh = transformMetric(response.network_tdh);

  return {
    dropsCreated: transformMetric(response.drops_created),
    distinctDroppers: transformMetric(response.distinct_droppers),
    mainStageSubmissions: transformMetric(response.main_stage_submissions),
    mainStageDistinctVoters: transformMetric(
      response.main_stage_distinct_voters
    ),
    mainStageVotes: transformMetric(response.main_stage_votes),
    tdhOnMainStageSubmissions,
    networkTdh,
    tdhOnMainStagePercentage: calculateTdhPercentage(
      tdhOnMainStageSubmissions,
      networkTdh
    ),
    consolidationsFormed: transformMetric(response.consolidations_formed),
  };
}

export function useCommunityMetrics(interval: CommunityMetricsInterval) {
  return useQuery<CommunityMetrics, Error>({
    queryKey: [QueryKey.COMMUNITY_METRICS, { interval }],
    queryFn: () => fetchCommunityMetrics(interval),
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 30_000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
