"use client";

import {
  getProductImpactNowMs,
  isProductImpactAbortError,
  trackWaveFeedLoadCancelled,
  trackWaveFeedLoadFailed,
  trackWaveFeedLoadStarted,
  trackWaveFeedLoadSucceeded,
} from "@/services/analytics/productImpactTelemetry";

type WaveFeedLoadSource =
  | "background_sync"
  | "cache"
  | "initial_visible"
  | "native_initial_backfill"
  | "server_initial";

interface WaveFeedTelemetryBase {
  readonly hadCachedDrops: boolean;
  readonly isNative: boolean;
  readonly loadSource: WaveFeedLoadSource;
}

interface TimedWaveFeedTelemetry extends WaveFeedTelemetryBase {
  readonly startedAtMs: number;
}

export const isWaveFeedAbortError = (error: unknown): boolean =>
  isProductImpactAbortError(error);

export const createWaveFeedAbortError = (): DOMException =>
  new DOMException("Aborted", "AbortError");

export const createWaveFeedUnavailableError = (): Error =>
  new Error("Wave feed request returned no data");

export const getWaveFeedTelemetryStartedAtMs = (): number =>
  getProductImpactNowMs();

const getTelemetryDurationMs = (startedAtMs: number): number =>
  Math.max(0, Math.round(getProductImpactNowMs() - startedAtMs));

export const trackWaveFeedLoadStart = (
  telemetry: WaveFeedTelemetryBase
): void => {
  trackWaveFeedLoadStarted(telemetry);
};

export const trackWaveFeedLoadSuccess = (
  telemetry: TimedWaveFeedTelemetry & { readonly dropCount: number }
): void => {
  trackWaveFeedLoadSucceeded({
    dropCount: telemetry.dropCount,
    durationMs: getTelemetryDurationMs(telemetry.startedAtMs),
    hadCachedDrops: telemetry.hadCachedDrops,
    isNative: telemetry.isNative,
    loadSource: telemetry.loadSource,
  });
};

export const trackWaveFeedLoadFailure = (
  telemetry: TimedWaveFeedTelemetry & {
    readonly error: unknown;
    readonly remainedUnavailable: boolean;
  }
): void => {
  trackWaveFeedLoadFailed({
    durationMs: getTelemetryDurationMs(telemetry.startedAtMs),
    error: telemetry.error,
    hadCachedDrops: telemetry.hadCachedDrops,
    isNative: telemetry.isNative,
    loadSource: telemetry.loadSource,
    remainedUnavailable: telemetry.remainedUnavailable,
  });
};

export const trackWaveFeedLoadTerminalFromError = (
  telemetry: TimedWaveFeedTelemetry & {
    readonly error: unknown;
    readonly remainedUnavailable: boolean;
  }
): void => {
  if (isWaveFeedAbortError(telemetry.error)) {
    trackWaveFeedLoadCancelled({
      durationMs: getTelemetryDurationMs(telemetry.startedAtMs),
      error: telemetry.error,
      hadCachedDrops: telemetry.hadCachedDrops,
      isNative: telemetry.isNative,
      loadSource: telemetry.loadSource,
      remainedUnavailable: false,
    });
    return;
  }

  trackWaveFeedLoadFailure(telemetry);
};
