"use client";

import ErrorComponent from "@/components/error/Error";
import styles from "@/styles/Home.module.css";
import { extractErrorDetails } from "@/utils/error-extractor";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { publicEnv } from "@/config/env";
import { notifyDesktopProfilesReady } from "@/services/auth/desktop-profile-storage";

type ErrorProps = {
  readonly error: Error & { digest?: string | undefined };
  readonly reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // The Electron desktop app shows its window once the page reports ready.
    notifyDesktopProfilesReady();
  }, []);

  useEffect(() => {
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
      />
    </main>
  );
}
