"use client";

import { publicEnv } from "@/config/env";
import type { AwsRum as AwsRumInstance, AwsRumConfig } from "aws-rum-web";
import { useEffect } from "react";

const AWS_RUM_HTTP_URLS_TO_EXCLUDE: readonly RegExp[] = [
  // Per-telemetry config replaces aws-rum-web defaults, so keep AWS service noise explicit.
  /^https:\/\/cognito-identity\.[a-z0-9-]+\.amazonaws\.com(?:[/:?#]|$)/i,
  /^https:\/\/sts\.amazonaws\.com(?:[/:?#]|$)/i,
  /^https:\/\/sts\.[a-z0-9-]+\.amazonaws\.com(?:[/:?#]|$)/i,
  /^https:\/\/dataplane\.rum\.[a-z0-9-]+\.amazonaws\.com(?:[/:?#]|$)/i,
  /^https:\/\/analytics\.google\.com\/g\/collect(?:[?#]|$)/i,
  /^https:\/\/www\.google\.com\/g\/collect(?:[?#]|$)/i,
  /^https:\/\/google-analytics\.com\/g\/collect(?:[?#]|$)/i,
  /^https:\/\/[a-z0-9-]+\.google-analytics\.com\/g\/collect(?:[?#]|$)/i,
  /^https:\/\/cca-lite\.coinbase\.com\/amp(?:[/?#]|$)/,
  /^https:\/\/cca-lite\.coinbase\.com\/metrics(?:[/?#]|$)/,
];

interface AwsRumProviderProps {
  readonly children: React.ReactNode;
}

export default function AwsRumProvider({
  children,
}: Readonly<AwsRumProviderProps>) {
  useEffect(() => {
    // Skip initialization in development mode to avoid noise
    if (publicEnv.NODE_ENV === "development") {
      console.warn("AWS RUM: Skipped initialization in development mode");
      return;
    }

    let cancelled = false;
    let awsRum: AwsRumInstance | undefined;

    const initializeAwsRum = async () => {
      try {
        // Check if required environment variables are set
        const APPLICATION_ID = publicEnv.AWS_RUM_APP_ID;
        const APPLICATION_REGION = envValueOrFallback(
          publicEnv.AWS_RUM_REGION,
          "us-east-1"
        );
        const APPLICATION_VERSION = envValueOrFallback(
          publicEnv.VERSION,
          "1.0.0"
        );
        const SAMPLE_RATE = parseSampleRate(publicEnv.AWS_RUM_SAMPLE_RATE);

        if (!APPLICATION_ID) {
          console.warn(
            "AWS RUM: Skipped initialization - missing required environment variables"
          );
          return;
        }

        const { AwsRum } = await import("aws-rum-web");

        if (cancelled) {
          return;
        }

        const config: AwsRumConfig = {
          sessionSampleRate: SAMPLE_RATE,
          telemetries: [
            "performance",
            "errors",
            [
              "http",
              {
                urlsToExclude: [...AWS_RUM_HTTP_URLS_TO_EXCLUDE],
              },
            ],
          ],
          allowCookies: true,
          enableXRay: false,
          signing: false,
          eventCacheSize: 200,
          sessionEventLimit: 200,
          batchLimit: 10,
          dispatchInterval: 5000,
          disableAutoPageView: false,
          retries: 2,
          useBeacon: true,
          releaseId: APPLICATION_VERSION,
        };

        // Initialize AWS RUM
        awsRum = new AwsRum(
          APPLICATION_ID,
          APPLICATION_VERSION,
          APPLICATION_REGION,
          config
        );
        // Optional: Store the instance globally for manual tracking if needed
        window.awsRum = awsRum;
      } catch (error) {
        // Silently handle errors to prevent breaking the application
        console.warn("AWS RUM: Failed to initialize", error);
      }
    };

    void initializeAwsRum();

    return () => {
      cancelled = true;
      awsRum?.disable();

      if (window.awsRum === awsRum) {
        delete window.awsRum;
      }
    };
  }, []);

  return <>{children}</>;
}

const envValueOrFallback = (
  value: string | undefined,
  fallback: string
): string => (value === undefined || value === "" ? fallback : value);

const DEFAULT_SAMPLE_RATE = 0.2;

const parseSampleRate = (sampleRate: string | undefined): number => {
  const parsedSampleRate = Number.parseFloat(
    envValueOrFallback(sampleRate, DEFAULT_SAMPLE_RATE.toString())
  );

  return Number.isFinite(parsedSampleRate)
    ? parsedSampleRate
    : DEFAULT_SAMPLE_RATE;
};
