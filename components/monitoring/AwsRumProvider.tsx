"use client";

import { useOptionalCookieConsent } from "@/components/cookies/CookieConsentContext";
import { publicEnv } from "@/config/env";
import {
  clearAwsRumCookies,
  hasAwsRumPerformanceConsent,
} from "@/utils/monitoring/awsRumConsent";
import { AWS_RUM_DISPATCH_CONFIG } from "@/utils/monitoring/awsRumDispatch";
import { isAwsRumSessionSampled } from "@/utils/monitoring/awsRumSampling";
import { getAwsRumPageId } from "@/utils/monitoring/mobileLaunchTimingSanitizers";
import type { AwsRum as AwsRumInstance, AwsRumConfig } from "aws-rum-web";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

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
  /^https:\/\/api-js\.mixpanel\.com\/(?:track|engage)\/?(?:[?#]|$)/i,
  // Version-pinned to observed WalletConnect v1 HTTP noise; keep relay traffic visible unless telemetry shows otherwise.
  /^https:\/\/rpc\.walletconnect\.(?:com|org)\/v1(?:[/?#]|$)/i,
  /^https:\/\/identity\.walletconnect\.(?:com|org)\/v1(?:[/?#]|$)/i,
];

interface AwsRumProviderProps {
  readonly children?: React.ReactNode;
}

export default function AwsRumProvider({
  children,
}: Readonly<AwsRumProviderProps>) {
  const pathname = usePathname();
  // RUM sets the cwr_u/cwr_s performance cookies, so it follows the same
  // performance consent as Google Analytics and Mixpanel.
  const hasPerformanceConsent = hasAwsRumPerformanceConsent(
    useOptionalCookieConsent()
  );
  const latestPathnameRef = useRef(pathname);
  const awsRumRef = useRef<AwsRumInstance | undefined>(undefined);
  const lastRecordedPageIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Without performance consent RUM stays off, and a rejection removes the
    // cookies an earlier accepted session left behind.
    if (!hasPerformanceConsent) {
      clearAwsRumCookies();
      return;
    }

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

        // Sample before downloading the SDK so unsampled sessions skip the
        // chunk entirely. The SDK then records every session it is given.
        if (!isAwsRumSessionSampled(SAMPLE_RATE)) {
          return;
        }

        const [
          {
            AwsRum,
            FetchPlugin,
            JsErrorPlugin,
            NavigationPlugin,
            ResourcePlugin,
            WebVitalsPlugin,
            XhrPlugin,
          },
          { AwsRumExpectedAbortPlugin },
          { createAwsRumPrivacyPlugin },
        ] = await Promise.all([
          import("aws-rum-web"),
          import("@/utils/monitoring/awsRumExpectedAbort"),
          import("@/utils/monitoring/awsRumPrivacy"),
        ]);

        if (cancelled) {
          return;
        }

        const initialPageId = getAwsRumPageId(latestPathnameRef.current);
        const httpPluginConfig = {
          urlsToExclude: [...AWS_RUM_HTTP_URLS_TO_EXCLUDE],
        };
        const config: AwsRumConfig = {
          sessionSampleRate: 1,
          telemetries: [],
          eventPluginsToLoad: [
            createAwsRumPrivacyPlugin(initialPageId),
            new NavigationPlugin(),
            new ResourcePlugin(),
            new WebVitalsPlugin(),
            new JsErrorPlugin(),
            new AwsRumExpectedAbortPlugin(new XhrPlugin(httpPluginConfig)),
            new AwsRumExpectedAbortPlugin(new FetchPlugin(httpPluginConfig)),
          ],
          allowCookies: true,
          enableXRay: false,
          signing: false,
          ...AWS_RUM_DISPATCH_CONFIG,
          disableAutoPageView: true,
          releaseId: APPLICATION_VERSION,
        };

        // Initialize AWS RUM
        awsRum = new AwsRum(
          APPLICATION_ID,
          APPLICATION_VERSION,
          APPLICATION_REGION,
          config
        );
        awsRumRef.current = awsRum;
        // Optional: Store the instance globally for manual tracking if needed
        window.awsRum = awsRum;
        lastRecordedPageIdRef.current = initialPageId;
      } catch (error) {
        // Silently handle errors to prevent breaking the application
        console.warn("AWS RUM: Failed to initialize", error);
      }
    };

    void initializeAwsRum();

    return () => {
      cancelled = true;
      // aws-rum-web 1.25.0 keeps web-vitals callbacks registered after
      // disable(), and their session lookup can rewrite cwr_u/cwr_s. Turning
      // cookie storage off first (the SDK reads this setting on every write)
      // keeps cookies deleted after a rejection from coming back.
      awsRum?.allowCookies(false);
      awsRum?.disable();

      if (awsRumRef.current === awsRum) {
        awsRumRef.current = undefined;
        lastRecordedPageIdRef.current = undefined;
      }

      if (window.awsRum === awsRum) {
        delete window.awsRum;
      }
    };
  }, [hasPerformanceConsent]);

  useEffect(() => {
    latestPathnameRef.current = pathname;

    const awsRum = awsRumRef.current;
    if (!awsRum) {
      return;
    }

    lastRecordedPageIdRef.current = recordAwsRumPageView(
      awsRum,
      pathname,
      lastRecordedPageIdRef.current
    );
  }, [pathname]);

  return <>{children}</>;
}

const envValueOrFallback = (
  value: string | undefined,
  fallback: string
): string => (value === undefined || value === "" ? fallback : value);

const DEFAULT_SAMPLE_RATE = 0.2;

const recordAwsRumPageView = (
  awsRum: AwsRumInstance,
  pathname: string,
  lastRecordedPageId: string | undefined
): string | undefined => {
  const pageId = getAwsRumPageId(pathname);
  if (pageId === lastRecordedPageId) {
    return lastRecordedPageId;
  }

  try {
    awsRum.recordPageView(pageId);
    return pageId;
  } catch {
    console.warn("AWS RUM: Failed to record page view");
    return lastRecordedPageId;
  }
};

const parseSampleRate = (sampleRate: string | undefined): number => {
  const parsedSampleRate = Number.parseFloat(
    envValueOrFallback(sampleRate, DEFAULT_SAMPLE_RATE.toString())
  );

  return Number.isFinite(parsedSampleRate)
    ? parsedSampleRate
    : DEFAULT_SAMPLE_RATE;
};
