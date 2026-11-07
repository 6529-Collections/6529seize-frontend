"use client";

import CrashReportPrompt from "@/components/diagnostics/CrashReportPrompt";
import ErrorComponent from "@/components/error/Error";
import styles from "@/styles/Home.module.css";
import { extractErrorDetails } from "@/utils/error-extractor";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { publicEnv } from "@/config/env";
import { countBoundaryError } from "@/services/analytics/telemetry/collector";
import { recordFlightError } from "@/services/diagnostics/flightRecorder";

type ErrorProps = {
  readonly error: Error & { digest?: string | undefined };
  readonly reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    countBoundaryError();
    recordFlightError("boundary", error);
    if (!publicEnv.SENTRY_DSN) return;
    Sentry.captureException(error);
  }, [error]);

  const errorDetails = extractErrorDetails(error, "ROUTE_ERROR");

  return (
    <main className={styles["main"]}>
      <ErrorComponent
        stackTrace={errorDetails}
        digest={error.digest}
        onReset={reset}
      >
        <CrashReportPrompt />
      </ErrorComponent>
    </main>
  );
}
