"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import ErrorComponent from "@/components/error/Error";
import {publicEnv} from "@/config/env";
import styles from "@/styles/Home.module.scss";
import { extractErrorDetails } from "@/utils/error-extractor";


type GlobalErrorProps = {
  readonly error: Error & { digest?: string | undefined };
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
        <main className={styles["main"]}>
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
