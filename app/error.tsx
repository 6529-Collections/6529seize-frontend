"use client";

import ErrorComponent from "@/components/error/Error";
import styles from "@/styles/Home.module.scss";
import { Suspense, useEffect } from "react";

function decodeReactError(message: string): string {
  const match = message.match(/Minified React error #(\d+)/);
  if (match) {
    const code = match[1];
    return `React Error #${code} - Visit https://react.dev/errors/${code} for details. Original: ${message}`;
  }
  return message;
}

export default function Error({
  error,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
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
