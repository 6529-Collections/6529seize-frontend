"use client";

import ErrorComponent from "@/components/error/Error";
import styles from "@/styles/Home.module.scss";
import { extractErrorDetails } from "@/utils/error-extractor";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import {publicEnv} from "@/config/env";

type ErrorProps = {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (!publicEnv.SENTRY_DSN) return;
    Sentry.captureException(error);
  }, [error]);

  const errorDetails = extractErrorDetails(error, "ROUTE_ERROR");

  return (
    <main className={styles.main}>
      <ErrorComponent
        stackTrace={errorDetails}
        digest={error.digest}
        onReset={reset}
      />
    </main>
  );
}
