import { WALLET_AUTH_COOKIE } from "@/services/auth/auth.utils";
import {
  normalizeReviewbotUsageApiBaseUrl,
  normalizeReviewbotUsagePath,
  usageGroupSchema,
  usagePrGroupSchema,
  usageRangeSchema,
  usageSummarySchema,
  usageTotalsSchema,
} from "@/services/reviewbot-usage-api";
import {
  getReviewbotUsageEnv,
  type ReviewbotUsageEnv,
} from "@/config/reviewbotUsageEnv";
import { cookies } from "next/headers";
import { createHmac } from "node:crypto";
import { jwtDecode } from "jwt-decode";
import { z } from "zod";

if (globalThis.window !== undefined) {
  throw new TypeError("reviewbot-admin-api can only run on the server side");
}

const DEFAULT_ADMIN_SUMMARY_PATH = "/api/admin/usage/summary";
const DEFAULT_ADMIN_BUDGET_STATUS_PATH = "/api/admin/budget/status";
const DEFAULT_ADMIN_MODEL_PRICE_STATUS_PATH = "/api/admin/model-prices/status";
const DEFAULT_ADMIN_ALERT_STATUS_PATH = "/api/admin/alerts/status";
const DEFAULT_ADMIN_JOB_EVENTS_PATH =
  "/api/admin/jobs/recent?status=dispatch_failed&limit=10";
const DEFAULT_ADMIN_RUN_CLAIMS_PATH =
  "/api/admin/run-claims/recent?active=1&staleMinutes=120&limit=10";
const DEFAULT_ADMIN_STATUS_PATH =
  "/api/admin/status?profile=server&strict=false";
const DEFAULT_DAYS = 30;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_TTL_SECONDS = 300;
const DEFAULT_ADMIN_ROLES = ["reviewbot-admin"];
const LOCAL_API_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);
const ROLE_PATTERN = /^[A-Za-z0-9_.:-]{1,80}$/;
const WALLET_PATTERN = /^0x[a-fA-F0-9]{40}$/;

const safeNumberSchema = z.coerce.number().finite().catch(0);
const safeIntegerSchema = z.coerce.number().int().nonnegative().catch(0);
const safeBooleanSchema = z.boolean().catch(false);
const nullableNumberSchema = z
  .union([z.coerce.number().finite(), z.null()])
  .catch(null);

const adminUsageSummarySchema = usageSummarySchema.extend({
  visibility: z.enum(["public", "admin"]).optional(),
  byPr: z.array(usagePrGroupSchema).default([]),
  byPrAuthor: z.array(usageGroupSchema).default([]),
  byRequestor: z.array(usageGroupSchema).default([]),
});

const budgetPeriodStatusSchema = z.object({
  budgetUsd: nullableNumberSchema,
  usedUsd: safeNumberSchema,
  remainingUsd: nullableNumberSchema,
  percentUsed: nullableNumberSchema,
  overBudget: safeBooleanSchema,
});

const budgetPolicyStatusSchema = z.object({
  scopeType: z.string().catch("unknown"),
  scopeValue: z.string().catch("unknown"),
  dailyBudgetUsd: nullableNumberSchema,
  weeklyBudgetUsd: nullableNumberSchema,
  monthlyBudgetUsd: nullableNumberSchema,
  enabled: z.boolean().default(true),
  utilization: z
    .object({
      daily: budgetPeriodStatusSchema.default({
        budgetUsd: null,
        overBudget: false,
        percentUsed: null,
        remainingUsd: null,
        usedUsd: 0,
      }),
      weekly: budgetPeriodStatusSchema.default({
        budgetUsd: null,
        overBudget: false,
        percentUsed: null,
        remainingUsd: null,
        usedUsd: 0,
      }),
      monthly: budgetPeriodStatusSchema.default({
        budgetUsd: null,
        overBudget: false,
        percentUsed: null,
        remainingUsd: null,
        usedUsd: 0,
      }),
    })
    .default({}),
});

const budgetStatusSchema = z.object({
  ok: z.literal(true),
  visibility: z.literal("admin").optional(),
  kind: z.literal("budget_status").optional(),
  generatedAt: z.string().optional(),
  policies: z.array(budgetPolicyStatusSchema).default([]),
});

const modelPriceSummarySchema = z.object({
  activeRows: safeIntegerSchema,
  providerCount: safeIntegerSchema,
  providerModelCount: safeIntegerSchema,
  staleRows: safeIntegerSchema,
  futureRows: safeIntegerSchema,
  missingSourceRows: safeIntegerSchema,
  invalidSourceRows: safeIntegerSchema,
  incompleteRows: safeIntegerSchema,
});

const modelPriceRowSchema = z.object({
  provider: z.string().catch("unknown"),
  model: z.string().catch("unknown"),
  sourceStatus: z.string().catch("unknown"),
  sourceHost: z.string().catch(""),
  hasSourceUrl: z.boolean().catch(false),
  missingRates: z.array(z.string()).default([]),
});

const modelPriceStatusSchema = z.object({
  ok: z.literal(true),
  visibility: z.literal("admin").optional(),
  kind: z.literal("model_price_status").optional(),
  generatedAt: z.string().optional(),
  status: z
    .object({
      summary: modelPriceSummarySchema.default({
        activeRows: 0,
        futureRows: 0,
        incompleteRows: 0,
        invalidSourceRows: 0,
        missingSourceRows: 0,
        providerCount: 0,
        providerModelCount: 0,
        staleRows: 0,
      }),
      prices: z.array(modelPriceRowSchema).default([]),
    })
    .default({}),
});

const alertStatusSchema = z.object({
  ok: z.literal(true),
  visibility: z.literal("admin").optional(),
  kind: z.literal("alert_status").optional(),
  generatedAt: z.string().optional(),
  status: z
    .object({
      enabled: z.boolean().catch(false),
      spend: z
        .object({
          enabled: z.boolean().catch(false),
          budgetWarningPercent: safeNumberSchema,
          budgetCriticalPercent: safeNumberSchema,
        })
        .default({}),
      jobHealth: z
        .object({
          enabled: z.boolean().catch(false),
          failureThreshold: safeIntegerSchema,
          staleClaimThreshold: safeIntegerSchema,
        })
        .default({}),
      notifier: z
        .object({
          mode: z.string().catch("disabled"),
          failClosed: z.boolean().catch(false),
          webhookConfigured: z.boolean().catch(false).optional(),
          snsTopicConfigured: z.boolean().catch(false).optional(),
          sesFromConfigured: z.boolean().catch(false).optional(),
          sesRecipientCount: safeIntegerSchema.optional(),
        })
        .default({}),
    })
    .default({}),
});

const runtimeStatusSchema = z.object({
  ok: z.literal(true),
  visibility: z.literal("admin").optional(),
  kind: z.literal("runtime_status").optional(),
  generatedAt: z.string().optional(),
  status: z.record(z.string(), z.unknown()).default({}),
});

const jobEventSchema = z.object({
  eventId: z.union([z.string(), z.number()]).optional(),
  createdAt: z.string().catch(""),
  jobId: z.string().catch(""),
  status: z.string().catch("unknown"),
  stage: z.string().catch("unknown"),
  repoFullName: z.string().catch(""),
  prNumber: safeIntegerSchema,
  requestor: z.string().catch(""),
  reviewKind: z.string().catch(""),
  provider: z.string().catch(""),
  model: z.string().catch(""),
  lane: z.string().catch(""),
  adapter: z.string().catch(""),
  accepted: z.boolean().catch(false),
  reason: z.string().catch(""),
});

const jobEventsSchema = z.object({
  ok: z.literal(true),
  visibility: z.literal("admin").optional(),
  kind: z.literal("job_events").optional(),
  limit: safeIntegerSchema,
  status: z.string().nullable().optional(),
  events: z.array(jobEventSchema).default([]),
});

const runClaimSchema = z.object({
  claimId: z.union([z.string(), z.number()]).optional(),
  createdAt: z.string().catch(""),
  updatedAt: z.string().catch(""),
  expiresAt: z.string().catch(""),
  runKey: z.string().catch(""),
  jobId: z.string().catch(""),
  status: z.string().catch("unknown"),
  repoFullName: z.string().catch(""),
  prNumber: safeIntegerSchema,
  requestor: z.string().catch(""),
  reviewKind: z.string().catch(""),
  provider: z.string().catch(""),
  model: z.string().catch(""),
  lane: z.string().catch(""),
  commandName: z.string().catch(""),
});

const runClaimsSchema = z.object({
  ok: z.literal(true),
  visibility: z.literal("admin").optional(),
  kind: z.literal("run_claims").optional(),
  limit: safeIntegerSchema,
  status: z.string().nullable().optional(),
  active: z.boolean().catch(false).optional(),
  staleMinutes: safeIntegerSchema.optional(),
  claims: z.array(runClaimSchema).default([]),
});

const jwtPayloadSchema = z.object({
  sub: z.string().min(1),
  exp: z.number().finite(),
  role: z.string().optional(),
});

export type ReviewbotAdminUsageSummary = z.infer<
  typeof adminUsageSummarySchema
>;
export type ReviewbotBudgetStatus = z.infer<typeof budgetStatusSchema>;
export type ReviewbotModelPriceStatus = z.infer<typeof modelPriceStatusSchema>;
export type ReviewbotAlertStatus = z.infer<typeof alertStatusSchema>;
export type ReviewbotRuntimeStatus = z.infer<typeof runtimeStatusSchema>;
export type ReviewbotJobEvents = z.infer<typeof jobEventsSchema>;
export type ReviewbotRunClaims = z.infer<typeof runClaimsSchema>;

export type ReviewbotAdminEndpoint<T> =
  | {
      readonly status: "ok";
      readonly data: T;
    }
  | {
      readonly status: "unavailable";
      readonly message: string;
    };

export type ReviewbotAdminDashboardData = {
  readonly actor: string;
  readonly range: z.infer<typeof usageRangeSchema>;
  readonly totals: z.infer<typeof usageTotalsSchema>;
  readonly summary: ReviewbotAdminEndpoint<ReviewbotAdminUsageSummary>;
  readonly budgetStatus: ReviewbotAdminEndpoint<ReviewbotBudgetStatus>;
  readonly modelPriceStatus: ReviewbotAdminEndpoint<ReviewbotModelPriceStatus>;
  readonly alertStatus: ReviewbotAdminEndpoint<ReviewbotAlertStatus>;
  readonly runtimeStatus: ReviewbotAdminEndpoint<ReviewbotRuntimeStatus>;
  readonly jobEvents: ReviewbotAdminEndpoint<ReviewbotJobEvents>;
  readonly runClaims: ReviewbotAdminEndpoint<ReviewbotRunClaims>;
};

export type ReviewbotAdminDashboardResult =
  | {
      readonly status: "ok";
      readonly dashboard: ReviewbotAdminDashboardData;
    }
  | {
      readonly status: "unconfigured" | "unauthenticated" | "forbidden";
      readonly message: string;
    };

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

interface ReviewbotAdminOptions {
  readonly env?: ReviewbotUsageEnv;
  readonly fetchImpl?: FetchLike;
  readonly now?: Date;
  readonly walletAuthJwt?: string | null;
}

type AdminClientConfig = {
  readonly apiBaseUrl: string;
  readonly allowedWallets: ReadonlySet<string>;
  readonly authCheckUrl: string;
  readonly hmacSecret: string;
  readonly roles: readonly string[];
  readonly ttlSeconds: number;
};

export async function getReviewbotAdminDashboard(
  options: ReviewbotAdminOptions = {}
): Promise<ReviewbotAdminDashboardResult> {
  const env = options.env ?? getReviewbotUsageEnv();
  const config = getAdminClientConfig(env);
  if (!config) {
    return {
      status: "unconfigured",
      message: "6529bot admin data is not configured for this environment.",
    };
  }

  const walletAuthJwt =
    options.walletAuthJwt === undefined
      ? await getWalletAuthJwtFromCookies()
      : options.walletAuthJwt;
  const actor = getVerifiedActorFromJwt(walletAuthJwt, options.now);
  if (!actor) {
    return {
      status: "unauthenticated",
      message: "Connect with an authorized 6529 operator account.",
    };
  }

  if (!config.allowedWallets.has(actor.toLowerCase())) {
    return {
      status: "forbidden",
      message: "This connected account is not authorized for 6529bot admin.",
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const authVerified = await verifyWalletAuthJwt({
    authCheckUrl: config.authCheckUrl,
    fetchImpl,
    walletAuthJwt,
  });
  if (!authVerified) {
    return {
      status: "unauthenticated",
      message: "Connect with an authorized 6529 operator account.",
    };
  }

  const now = options.now ?? new Date();
  const summary = await requestAdminEndpoint({
    config,
    fetchImpl,
    now,
    actor,
    path: normalizeReviewbotUsagePath(
      env["REVIEWBOT_USAGE_API_ADMIN_SUMMARY_PATH"],
      DEFAULT_ADMIN_SUMMARY_PATH
    ),
    query: { days: String(DEFAULT_DAYS) },
    schema: adminUsageSummarySchema,
  });

  const dashboard = await buildDashboardData({
    actor,
    config,
    env,
    fetchImpl,
    now,
    summary,
  });

  return {
    status: "ok",
    dashboard,
  };
}

function getAdminClientConfig(
  env: ReviewbotUsageEnv
): AdminClientConfig | null {
  const apiBaseUrl = normalizeReviewbotUsageApiBaseUrl(
    env["REVIEWBOT_USAGE_API_BASE_URL"]
  );
  const hmacSecret = env["REVIEWBOT_USAGE_API_ADMIN_HMAC_SECRET"]?.trim();
  const authCheckUrl = normalizeReviewbotUsageAuthCheckUrl(
    env["REVIEWBOT_USAGE_ADMIN_AUTH_CHECK_URL"]
  );
  const allowedWallets = normalizeWalletAllowlist(
    env["REVIEWBOT_USAGE_ADMIN_ALLOWED_WALLETS"]
  );

  if (
    !apiBaseUrl ||
    !hmacSecret ||
    !authCheckUrl ||
    allowedWallets.size === 0
  ) {
    return null;
  }

  return {
    allowedWallets,
    apiBaseUrl,
    authCheckUrl,
    hmacSecret,
    roles: normalizeRoles(env["REVIEWBOT_USAGE_API_ADMIN_ROLES"]),
    ttlSeconds: normalizeTtlSeconds(
      env["REVIEWBOT_USAGE_API_ADMIN_TTL_SECONDS"]
    ),
  };
}

async function buildDashboardData({
  actor,
  config,
  env,
  fetchImpl,
  now,
  summary,
}: {
  readonly actor: string;
  readonly config: AdminClientConfig;
  readonly env: ReviewbotUsageEnv;
  readonly fetchImpl: FetchLike;
  readonly now: Date;
  readonly summary: ReviewbotAdminEndpoint<ReviewbotAdminUsageSummary>;
}): Promise<ReviewbotAdminDashboardData> {
  const [
    budgetStatus,
    modelPriceStatus,
    alertStatus,
    runtimeStatus,
    jobEvents,
    runClaims,
  ] = await Promise.all([
    requestAdminEndpoint({
      actor,
      config,
      fetchImpl,
      now,
      path: normalizeReviewbotUsagePath(
        env["REVIEWBOT_USAGE_API_ADMIN_BUDGET_STATUS_PATH"],
        DEFAULT_ADMIN_BUDGET_STATUS_PATH
      ),
      schema: budgetStatusSchema,
    }),
    requestAdminEndpoint({
      actor,
      config,
      fetchImpl,
      now,
      path: normalizeReviewbotUsagePath(
        env["REVIEWBOT_USAGE_API_ADMIN_MODEL_PRICE_STATUS_PATH"],
        DEFAULT_ADMIN_MODEL_PRICE_STATUS_PATH
      ),
      schema: modelPriceStatusSchema,
    }),
    requestAdminEndpoint({
      actor,
      config,
      fetchImpl,
      now,
      path: normalizeReviewbotUsagePath(
        env["REVIEWBOT_USAGE_API_ADMIN_ALERT_STATUS_PATH"],
        DEFAULT_ADMIN_ALERT_STATUS_PATH
      ),
      schema: alertStatusSchema,
    }),
    requestAdminEndpoint({
      actor,
      config,
      fetchImpl,
      now,
      path: normalizeReviewbotUsagePath(
        env["REVIEWBOT_USAGE_API_ADMIN_STATUS_PATH"],
        DEFAULT_ADMIN_STATUS_PATH
      ),
      schema: runtimeStatusSchema,
    }),
    requestAdminEndpoint({
      actor,
      config,
      fetchImpl,
      now,
      path: normalizeReviewbotUsagePath(
        env["REVIEWBOT_USAGE_API_ADMIN_JOB_EVENTS_PATH"],
        DEFAULT_ADMIN_JOB_EVENTS_PATH
      ),
      schema: jobEventsSchema,
    }),
    requestAdminEndpoint({
      actor,
      config,
      fetchImpl,
      now,
      path: normalizeReviewbotUsagePath(
        env["REVIEWBOT_USAGE_API_ADMIN_RUN_CLAIMS_PATH"],
        DEFAULT_ADMIN_RUN_CLAIMS_PATH
      ),
      schema: runClaimsSchema,
    }),
  ]);

  const summaryData = summary.status === "ok" ? summary.data : null;
  return {
    actor,
    alertStatus,
    budgetStatus,
    jobEvents,
    modelPriceStatus,
    range: summaryData?.range ?? {},
    runClaims,
    runtimeStatus,
    summary,
    totals:
      summaryData?.totals ??
      usageTotalsSchema.parse({
        budgetSkippedRuns: 0,
        costUsd: 0,
        averageCostPerPrUsd: 0,
        averageCostPerReviewRunUsd: 0,
        reviewRuns: 0,
        totalTokens: 0,
        uniquePrs: 0,
      }),
  };
}

async function requestAdminEndpoint<Schema extends z.ZodTypeAny>({
  actor,
  config,
  fetchImpl,
  now,
  path,
  query,
  schema,
}: {
  readonly actor: string;
  readonly config: AdminClientConfig;
  readonly fetchImpl: FetchLike;
  readonly now: Date;
  readonly path: string;
  readonly query?: Record<string, string>;
  readonly schema: Schema;
}): Promise<ReviewbotAdminEndpoint<z.output<Schema>>> {
  const url = buildReviewbotApiUrl(config.apiBaseUrl, path, query);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...createAdminHmacHeaders({
          actor,
          config,
          method: "GET",
          now,
          url,
        }),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        status: "unavailable",
        message: `6529bot admin endpoint returned HTTP ${response.status}.`,
      };
    }

    const raw = (await response.json()) as unknown;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return {
        status: "unavailable",
        message: "6529bot admin endpoint returned an unexpected shape.",
      };
    }

    return {
      status: "ok",
      data: parsed.data,
    };
  } catch {
    return {
      status: "unavailable",
      message: "6529bot admin endpoint could not be loaded.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyWalletAuthJwt({
  authCheckUrl,
  fetchImpl,
  walletAuthJwt,
}: {
  readonly authCheckUrl: string;
  readonly fetchImpl: FetchLike;
  readonly walletAuthJwt: string | null | undefined;
}): Promise<boolean> {
  if (!walletAuthJwt) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetchImpl(new URL(authCheckUrl), {
      cache: "no-store",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${walletAuthJwt}`,
      },
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function createAdminHmacHeaders({
  actor,
  config,
  method,
  now,
  url,
}: {
  readonly actor: string;
  readonly config: AdminClientConfig;
  readonly method: string;
  readonly now: Date;
  readonly url: URL;
}): Record<string, string> {
  const expiresAt = String(
    Math.floor(now.getTime() / 1000) + config.ttlSeconds
  );
  const roles = config.roles.join(",");
  const signature = createHmac("sha256", config.hmacSecret)
    .update(
      [
        method.toUpperCase(),
        `${url.pathname}${url.search}`,
        actor,
        roles,
        expiresAt,
      ].join("\n")
    )
    .digest("hex");

  return {
    "x-6529-admin-expires-at": expiresAt,
    "x-6529-admin-roles": roles,
    "x-6529-admin-signature": `sha256=${signature}`,
    "x-6529-admin-user": actor,
  };
}

async function getWalletAuthJwtFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(WALLET_AUTH_COOKIE)?.value ?? null;
}

function getVerifiedActorFromJwt(
  walletAuthJwt: string | null | undefined,
  now = new Date()
): string | null {
  if (!walletAuthJwt) {
    return null;
  }

  try {
    const decoded = jwtPayloadSchema.parse(jwtDecode<unknown>(walletAuthJwt));
    if (decoded.exp <= now.getTime() / 1000) {
      return null;
    }
    const wallet = decoded.sub.trim();
    if (!WALLET_PATTERN.test(wallet)) {
      return null;
    }
    return wallet.toLowerCase();
  } catch {
    return null;
  }
}

function buildReviewbotApiUrl(
  apiBaseUrl: string,
  path: string,
  query: Record<string, string> = {}
): URL {
  const url = new URL(path.replace(/^\/+/, ""), `${apiBaseUrl}/`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return url;
}

export function normalizeReviewbotUsageAuthCheckUrl(
  value: string | undefined
): string | null {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    const normalizedHost = url.hostname.replace(/^\[|\]$/g, "");
    const localHttp =
      url.protocol === "http:" && LOCAL_API_HOSTS.has(normalizedHost);
    if (url.protocol !== "https:" && !localHttp) {
      return null;
    }
    if (url.username || url.password) {
      return null;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeWalletAllowlist(
  value: string | undefined
): ReadonlySet<string> {
  const wallets = csv(value).filter((wallet) => WALLET_PATTERN.test(wallet));
  return new Set(wallets.map((wallet) => wallet.toLowerCase()));
}

function normalizeRoles(value: string | undefined): readonly string[] {
  const roles = csv(value);
  const safeRoles = roles.length ? roles : DEFAULT_ADMIN_ROLES;
  const normalized = safeRoles.filter((role) => ROLE_PATTERN.test(role));
  return normalized.length ? normalized : DEFAULT_ADMIN_ROLES;
}

function normalizeTtlSeconds(value: string | undefined): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return DEFAULT_TTL_SECONDS;
  }
  return Math.min(parsed, DEFAULT_TTL_SECONDS);
}

function csv(value: string | undefined): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
