"use client";

import ErrorComponent from "@/components/error/Error";
import styles from "@/styles/Home.module.scss";
import { extractErrorDetails } from "@/utils/error-extractor";
import { type FallbackProps } from "react-error-boundary";

function getErrorDigest(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const digest = (error as Record<string, unknown>)["digest"];
  return typeof digest === "string" ? digest : undefined;
}

export default function LayoutErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  const errorDetails = extractErrorDetails(error);
  const digest = getErrorDigest(error);

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
