import {
  getReviewbotUsageEnv,
  type ReviewbotUsageEnv,
} from "@/config/reviewbotUsageEnv";
import { z } from "zod";

const DEFAULT_PUBLIC_SUMMARY_PATH = "/api/public/usage/summary";
const DEFAULT_SUMMARY_DAYS = 30;
const DEFAULT_TIMEOUT_MS = 8_000;
const LOCAL_API_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);

const safeNumberSchema = z.coerce.number().finite().catch(0);
const safeIntegerSchema = z.coerce.number().int().nonnegative().catch(0);

export const usageGroupSchema = z.object({
  key: z.string().catch("unknown"),
  reviewRuns: safeIntegerSchema,
  costUsd: safeNumberSchema,
  averageCostUsd: safeNumberSchema,
  totalTokens: safeIntegerSchema,
  budgetSkippedRuns: safeIntegerSchema,
});

export const usageTotalsSchema = z.object({
  reviewRuns: safeIntegerSchema,
  costUsd: safeNumberSchema,
  totalTokens: safeIntegerSchema,
  budgetSkippedRuns: safeIntegerSchema,
  uniquePrs: safeIntegerSchema,
  averageCostPerReviewRunUsd: safeNumberSchema,
  averageCostPerPrUsd: safeNumberSchema,
});

export const usagePrGroupSchema = usageGroupSchema.extend({
  repoFullName: z.string().catch(""),
  prNumber: z
    .union([z.coerce.number().int().nonnegative(), z.null()])
    .catch(null),
  prAuthor: z.string().catch(""),
  latestHeadSha: z.string().catch(""),
  lastReviewAt: z.string().catch(""),
});

const usageAnalysisGroupSchema = usageGroupSchema.extend({
  costSharePercent: safeNumberSchema,
});

const usageAnalysisPrGroupSchema = usagePrGroupSchema.extend({
  costSharePercent: safeNumberSchema,
});

export const usageAnalysisSchema = z.object({
  budgetSkipRate: safeNumberSchema,
  averageTokensPerReviewRun: safeIntegerSchema,
  averageTokensPerPr: safeIntegerSchema,
  topCostRepo: usageAnalysisGroupSchema.nullable().catch(null),
  topCostProviderModel: usageAnalysisGroupSchema.nullable().catch(null),
  topCostReviewKind: usageAnalysisGroupSchema.nullable().catch(null),
  topCostRequestor: usageAnalysisGroupSchema.nullable().optional(),
  topCostPrAuthor: usageAnalysisGroupSchema.nullable().optional(),
  topCostPr: usageAnalysisPrGroupSchema.nullable().optional(),
});

export const usageRangeSchema = z.object({
  days: safeIntegerSchema.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const usageSummarySchema = z.object({
  ok: z.literal(true),
  visibility: z.enum(["public", "admin"]).optional(),
  kind: z.string().optional(),
  range: usageRangeSchema.default({}),
  totals: usageTotalsSchema.default({
    reviewRuns: 0,
    costUsd: 0,
    totalTokens: 0,
    budgetSkippedRuns: 0,
    uniquePrs: 0,
    averageCostPerReviewRunUsd: 0,
    averageCostPerPrUsd: 0,
  }),
  analysis: usageAnalysisSchema.default({
    budgetSkipRate: 0,
    averageTokensPerReviewRun: 0,
    averageTokensPerPr: 0,
    topCostRepo: null,
    topCostProviderModel: null,
    topCostReviewKind: null,
  }),
  byDay: z.array(usageGroupSchema).default([]),
  byRepo: z.array(usageGroupSchema).default([]),
  byProviderModel: z.array(usageGroupSchema).default([]),
  byReviewKind: z.array(usageGroupSchema).default([]),
});

export type ReviewbotUsageGroup = z.infer<typeof usageGroupSchema>;
export type ReviewbotUsagePrGroup = z.infer<typeof usagePrGroupSchema>;
export type ReviewbotUsageAnalysis = z.infer<typeof usageAnalysisSchema>;
export type ReviewbotUsageSummary = z.infer<typeof usageSummarySchema>;

export type ReviewbotUsageResult =
  | {
      readonly status: "ok";
      readonly summary: ReviewbotUsageSummary;
    }
  | {
      readonly status: "unconfigured";
      readonly message: string;
    }
  | {
      readonly status: "unavailable";
      readonly message: string;
    };

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

interface ReviewbotUsageOptions {
  readonly days?: number;
  readonly env?: ReviewbotUsageEnv;
  readonly fetchImpl?: FetchLike;
}

export async function getReviewbotPublicUsageSummary(
  options: ReviewbotUsageOptions = {}
): Promise<ReviewbotUsageResult> {
  const env = options.env ?? getReviewbotUsageEnv();
  const apiBaseUrl = normalizeReviewbotUsageApiBaseUrl(
    env["REVIEWBOT_USAGE_API_BASE_URL"]
  );

  if (!apiBaseUrl) {
    return {
      status: "unconfigured",
      message: "6529bot usage data is not configured for this environment.",
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const days = normalizeDays(options.days ?? DEFAULT_SUMMARY_DAYS);
  const summaryPath = normalizeReviewbotUsagePath(
    env["REVIEWBOT_USAGE_API_PUBLIC_SUMMARY_PATH"],
    DEFAULT_PUBLIC_SUMMARY_PATH
  );
  const url = new URL(summaryPath.replace(/^\/+/, ""), `${apiBaseUrl}/`);
  url.searchParams.set("days", String(days));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        status: "unavailable",
        message: `6529bot usage data returned HTTP ${response.status}.`,
      };
    }

    const raw = (await response.json()) as unknown;
    const parsed = usageSummarySchema.safeParse(raw);
    if (!parsed.success) {
      return {
        status: "unavailable",
        message: "6529bot usage data returned an unexpected shape.",
      };
    }

    return {
      status: "ok",
      summary: parsed.data,
    };
  } catch {
    return {
      status: "unavailable",
      message: "6529bot usage data could not be loaded.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeReviewbotUsageApiBaseUrl(
  value: string | undefined
): string | null {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    const normalizedHost = url.hostname.replace(/^\[|\]$/g, "");
    if (url.protocol === "http:" && LOCAL_API_HOSTS.has(normalizedHost)) {
      return url.toString().replace(/\/$/, "");
    }
    if (url.protocol !== "https:") {
      return null;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function normalizeReviewbotUsageSummaryPath(
  value: string | undefined
): string {
  return normalizeReviewbotUsagePath(value, DEFAULT_PUBLIC_SUMMARY_PATH);
}

export function normalizeReviewbotUsagePath(
  value: string | undefined,
  fallback: string
): string {
  const raw = value?.trim();
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(raw, "https://reviewbot.local");
    url.hash = "";
    if (url.origin !== "https://reviewbot.local") {
      return fallback;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

function normalizeDays(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SUMMARY_DAYS;
  }
  return Math.min(Math.max(Math.trunc(value), 1), 365);
}
