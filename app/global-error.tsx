"use client";

import ErrorComponent from "@/components/error/Error";
import styles from "@/styles/Home.module.scss";
import { extractErrorDetails } from "@/utils/error-extractor";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import {publicEnv} from "@/config/env";

type GlobalErrorProps = {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    if (!publicEnv.SENTRY_DSN) return;
    Sentry.captureException(error);
  }, [error]);
  const errorDetails = extractErrorDetails(error, "GLOBAL_ERROR");

  return (
    <html lang="en">
      <body>
        <main className={styles.main}>
          <ErrorComponent
            stackTrace={errorDetails}
            digest={error.digest}
            onReset={reset}
          />
        </main>
      </body>
    </html>
  );
}
