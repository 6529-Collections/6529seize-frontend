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
  readonly changePercent: number | null;
}

export interface CommunityMetrics {
  readonly dropsCreated: MetricData;
  readonly distinctDroppers: MetricData;
  readonly mainStageSubmissions: MetricData;
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
    changePercent: calculateChangePercent(
      current.eventCount,
      previous.eventCount
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

  return {
    dropsCreated: transformMetric(response.drops_created),
    distinctDroppers: transformMetric(response.distinct_droppers),
    mainStageSubmissions: transformMetric(response.main_stage_submissions),
  };
}

export function useCommunityMetrics(interval: CommunityMetricsInterval) {
  return useQuery<CommunityMetrics, Error>({
    queryKey: [QueryKey.COMMUNITY_METRICS, { interval }],
    queryFn: () => fetchCommunityMetrics(interval),
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
