"use client";

import ErrorComponent from "@/components/error/Error";
import styles from "@/styles/Home.module.scss";
import { extractErrorDetails } from "@/utils/error-extractor";
import { type FallbackProps } from "react-error-boundary";

export default function LayoutErrorFallback({ error }: FallbackProps) {
  const errorDetails = error ? extractErrorDetails(error) : null;

  return (
    <main className={styles.main}>
      <ErrorComponent stackTrace={errorDetails} />
    </main>
  );
}

