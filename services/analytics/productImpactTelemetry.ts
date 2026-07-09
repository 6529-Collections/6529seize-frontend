"use client";

import * as Sentry from "@sentry/nextjs";
import {
  trackAnalyticsEvent,
  type AnalyticsProperties,
  type AuthImpactRefreshOutcome,
} from "@/services/analytics/mixpanel";
import { classifyPageView } from "@/services/analytics/pageClassification";

type ProductImpactErrorKind =
  | "abort"
  | "auth"
  | "client"
  | "network"
  | "rate_limit"
  | "server"
  | "unknown";

type ProductImpactStatusBucket =
  | "aborted"
  | "1xx"
  | "2xx"
  | "3xx"
  | "4xx"
  | "5xx"
  | "network_error"
  | "unknown";

type ProductImpactSeverity = "info" | "warning";

type ProductImpactEventName =
  | "Auth Session Refresh Product Impact"
  | "Auth Session Refresh Succeeded"
  | "Auth Validation Cancelled"
  | "Wave Feed Load Cancelled"
  | "Wave Feed Load Failed"
  | "Wave Feed Load Started"
  | "Wave Feed Load Succeeded";

type ProductImpactProperties = AnalyticsProperties & {
  readonly endpoint_family?: "auth_session_refresh" | "wave_drops_feed";
  readonly error_kind?: ProductImpactErrorKind;
  readonly product_failure?: boolean;
  readonly route_family?: string;
  readonly status_bucket?: ProductImpactStatusBucket;
};

type WaveFeedLoadSource =
  | "background_sync"
  | "cache"
  | "initial_visible"
  | "native_initial_backfill";

interface WaveFeedTelemetryBase {
  readonly durationMs?: number | undefined;
  readonly hadCachedDrops: boolean;
  readonly isNative: boolean;
  readonly loadSource: WaveFeedLoadSource;
}

interface WaveFeedSuccessTelemetry extends WaveFeedTelemetryBase {
  readonly dropCount: number;
}

interface WaveFeedFailureTelemetry extends WaveFeedTelemetryBase {
  readonly error: unknown;
  readonly remainedUnavailable: boolean;
}

interface AuthRefreshTelemetryBase {
  readonly clientType: "desktop" | "native" | "web";
  readonly hadLocalJwt: boolean;
  readonly refreshOutcome: AuthImpactRefreshOutcome;
}

interface AuthRefreshImpactTelemetry extends AuthRefreshTelemetryBase {
  readonly outcome:
    | "failed_without_prompt"
    | "logout_required"
    | "reauth_required"
    | "session_upgrade_required";
  readonly requiresReauth: boolean;
}

const TELEMETRY_VERSION = 1;

const ABORT_ERROR_MESSAGES = [
  "aborterror",
  "fetch is aborted",
  "operation was aborted",
  "request aborted",
  "session refresh aborted",
  "signal is aborted",
] as const;

const NETWORK_ERROR_MESSAGES = [
  "failed to fetch",
  "load failed",
  "network request failed",
  "networkerror",
] as const;

function getNowMs(): number {
  if (typeof performance === "undefined") {
    return Date.now();
  }

  return performance.now();
}

export function getProductImpactNowMs(): number {
  return getNowMs();
}

function getCurrentRouteFamily(): string {
  if (typeof window === "undefined") {
    return "unknown";
  }

  const pathname = window.location.pathname;
  // Page classification treats messages as a fallback route, so normalize here
  // to avoid raw direct-message wave ids in telemetry.
  if (pathname === "/messages") {
    return "/messages";
  }
  if (pathname.startsWith("/messages/")) {
    return "/messages/:waveId";
  }

  const pageView = classifyPageView({ pathname });

  if (pageView.pageGroup === "waves" || pageView.pageGroup === "profile") {
    return pageView.routePattern;
  }

  if (pageView.pageGroup === "home") {
    return "/";
  }

  return `/${pageView.pageGroup}`;
}

function getVisibilityState(): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  return document.visibilityState;
}

function getOnlineStatus(): boolean | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  return navigator.onLine;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null) {
    const record = error as { readonly message?: unknown };
    if (typeof record.message === "string") {
      return record.message;
    }
  }

  return "";
}

function getErrorName(error: unknown): string | null {
  if (error instanceof Error) {
    return error.name;
  }
  if (typeof error === "object" && error !== null) {
    const record = error as { readonly name?: unknown };
    if (typeof record.name === "string") {
      return record.name;
    }
  }

  return null;
}

function getErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const record = error as { readonly code?: unknown };
  return typeof record.code === "string" ? record.code : null;
}

function getErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const record = error as {
    readonly status?: unknown;
    readonly response?: { readonly status?: unknown } | undefined;
  };
  const status = record.status ?? record.response?.status;
  return typeof status === "number" && Number.isFinite(status) ? status : null;
}

export function isProductImpactAbortError(error: unknown): boolean {
  const name = getErrorName(error);
  if (name === "AbortError") {
    return true;
  }

  if (getErrorCode(error) === "ERR_CANCELED") {
    return true;
  }

  const normalizedMessage = getErrorMessage(error).trim().toLowerCase();
  return ABORT_ERROR_MESSAGES.some((message) =>
    normalizedMessage.includes(message)
  );
}

function getStatusBucketFromStatus(
  status: number | null
): ProductImpactStatusBucket | null {
  if (status === null) {
    return null;
  }
  if (status >= 100 && status < 200) {
    return "1xx";
  }
  if (status >= 200 && status < 300) {
    return "2xx";
  }
  if (status >= 300 && status < 400) {
    return "3xx";
  }
  if (status >= 400 && status < 500) {
    return "4xx";
  }
  if (status >= 500 && status < 600) {
    return "5xx";
  }

  return "unknown";
}

function getProductImpactErrorKind(error: unknown): ProductImpactErrorKind {
  if (isProductImpactAbortError(error)) {
    return "abort";
  }

  const status = getErrorStatus(error);
  if (typeof status === "number") {
    if (status === 401 || status === 403) {
      return "auth";
    }
    if (status === 429) {
      return "rate_limit";
    }
    if (status >= 400 && status < 500) {
      return "client";
    }
    if (status >= 500) {
      return "server";
    }
  }

  const normalizedMessage = getErrorMessage(error).trim().toLowerCase();
  if (
    error instanceof TypeError ||
    NETWORK_ERROR_MESSAGES.some((message) =>
      normalizedMessage.includes(message)
    )
  ) {
    return "network";
  }

  return "unknown";
}

function getProductImpactStatusBucket(
  error: unknown
): ProductImpactStatusBucket {
  if (isProductImpactAbortError(error)) {
    return "aborted";
  }

  const statusBucket = getStatusBucketFromStatus(getErrorStatus(error));
  if (statusBucket !== null) {
    return statusBucket;
  }

  if (getProductImpactErrorKind(error) === "network") {
    return "network_error";
  }

  return "unknown";
}

function getDropCountBucket(dropCount: number): string {
  if (dropCount <= 0) {
    return "0";
  }
  if (dropCount < 10) {
    return "1-9";
  }
  if (dropCount < 50) {
    return "10-49";
  }

  return "50+";
}

function getDurationBucket(durationMs: number | undefined): string | undefined {
  if (durationMs === undefined) {
    return undefined;
  }
  if (durationMs < 1000) {
    return "under_1s";
  }
  if (durationMs < 3000) {
    return "1s_3s";
  }
  if (durationMs < 10000) {
    return "3s_10s";
  }

  return "over_10s";
}

function buildBaseProperties(
  properties: ProductImpactProperties
): ProductImpactProperties {
  return {
    telemetry_version: TELEMETRY_VERSION,
    online: getOnlineStatus(),
    route_family: getCurrentRouteFamily(),
    visibility_state: getVisibilityState(),
    ...properties,
  };
}

function logProductImpactEvent(
  eventName: ProductImpactEventName,
  properties: ProductImpactProperties,
  severity: ProductImpactSeverity
): void {
  const payload = buildBaseProperties(properties);
  trackAnalyticsEvent(eventName, payload);

  const sentryLogName = eventName.toLowerCase().replaceAll(" ", "_");
  if (severity === "warning") {
    Sentry.logger.warn(sentryLogName, payload);
    return;
  }

  Sentry.logger.info(sentryLogName, payload);
}

function getWaveBaseProperties(
  telemetry: WaveFeedTelemetryBase
): ProductImpactProperties {
  return {
    duration_bucket: getDurationBucket(telemetry.durationMs),
    endpoint_family: "wave_drops_feed",
    had_cached_drops: telemetry.hadCachedDrops,
    is_native: telemetry.isNative,
    load_source: telemetry.loadSource,
  };
}

export function trackWaveFeedLoadStarted(
  telemetry: WaveFeedTelemetryBase
): void {
  logProductImpactEvent(
    "Wave Feed Load Started",
    {
      ...getWaveBaseProperties(telemetry),
      product_failure: false,
    },
    "info"
  );
}

export function trackWaveFeedLoadSucceeded(
  telemetry: WaveFeedSuccessTelemetry
): void {
  logProductImpactEvent(
    "Wave Feed Load Succeeded",
    {
      ...getWaveBaseProperties(telemetry),
      drop_count_bucket: getDropCountBucket(telemetry.dropCount),
      has_drops: telemetry.dropCount > 0,
      product_failure: false,
      status_bucket: "2xx",
    },
    "info"
  );
}

export function trackWaveFeedLoadCancelled(
  telemetry: WaveFeedFailureTelemetry
): void {
  logProductImpactEvent(
    "Wave Feed Load Cancelled",
    {
      ...getWaveBaseProperties(telemetry),
      error_kind: "abort",
      product_failure: false,
      status_bucket: "aborted",
    },
    "info"
  );
}

export function trackWaveFeedLoadFailed(
  telemetry: WaveFeedFailureTelemetry
): void {
  logProductImpactEvent(
    "Wave Feed Load Failed",
    {
      ...getWaveBaseProperties(telemetry),
      error_kind: getProductImpactErrorKind(telemetry.error),
      product_failure: telemetry.remainedUnavailable,
      remained_unavailable: telemetry.remainedUnavailable,
      status_bucket: getProductImpactStatusBucket(telemetry.error),
    },
    "warning"
  );
}

export function trackAuthValidationCancelled(
  telemetry: AuthRefreshTelemetryBase
): void {
  logProductImpactEvent(
    "Auth Validation Cancelled",
    {
      client_type: telemetry.clientType,
      endpoint_family: "auth_session_refresh",
      had_local_jwt: telemetry.hadLocalJwt,
      product_failure: false,
      refresh_outcome: telemetry.refreshOutcome,
      status_bucket: "aborted",
    },
    "info"
  );
}

export function trackAuthSessionRefreshSucceeded(
  telemetry: AuthRefreshTelemetryBase
): void {
  logProductImpactEvent(
    "Auth Session Refresh Succeeded",
    {
      client_type: telemetry.clientType,
      endpoint_family: "auth_session_refresh",
      had_local_jwt: telemetry.hadLocalJwt,
      product_failure: false,
      refresh_outcome: telemetry.refreshOutcome,
      status_bucket: "2xx",
    },
    "info"
  );
}

export function trackAuthSessionRefreshProductImpact(
  telemetry: AuthRefreshImpactTelemetry
): void {
  logProductImpactEvent(
    "Auth Session Refresh Product Impact",
    {
      client_type: telemetry.clientType,
      endpoint_family: "auth_session_refresh",
      had_local_jwt: telemetry.hadLocalJwt,
      outcome: telemetry.outcome,
      product_failure: telemetry.requiresReauth,
      reauth_required: telemetry.requiresReauth,
      refresh_outcome: telemetry.refreshOutcome,
    },
    "warning"
  );
}
