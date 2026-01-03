"use client";

import ErrorComponent from "@/components/error/Error";
import styles from "@/styles/Home.module.scss";
import { extractErrorDetails } from "@/utils/error-extractor";
import { type FallbackProps } from "react-error-boundary";

export default function LayoutErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  const errorDetails = error ? extractErrorDetails(error) : null;
  const digest =
    error && typeof error === "object" && "digest" in error
      ? (error as { digest?: string | undefined }).digest
      : undefined;

  return (
    <main className={styles["main"]}>
      <ErrorComponent
        stackTrace={errorDetails}
        digest={digest}
        onReset={resetErrorBoundary}
      />
    </main>
  );
}
