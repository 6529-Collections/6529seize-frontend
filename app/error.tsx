"use client";

import ErrorComponent from "@/components/error/Error";
import styles from "@/styles/Home.module.scss";
import { Suspense, useEffect } from "react";

function decodeReactError(message: string): string {
  const regex = /Minified React error #(\d+)/;
  const match = regex.exec(message);
  if (match) {
    const code = match[1];
    return `React Error #${code} - Visit https://react.dev/errors/${code} for details. Original: ${message}`;
  }
  return message;
}

export default function AppError({
  error,
}: {
  readonly error: Error & { digest?: string };
}) {
  useEffect(() => {
    const decodedMessage = decodeReactError(error.message);
    console.error("Application error:", {
      message: decodedMessage,
      name: error.name,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className={styles.main}>
      <Suspense fallback={null}>
        <ErrorComponent />
      </Suspense>
    </main>
  );
}
