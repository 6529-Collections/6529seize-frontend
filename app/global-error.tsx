"use client";

import ErrorComponent from "@/components/error/Error";
import styles from "@/styles/Home.module.css";
import { extractErrorDetails } from "@/utils/error-extractor";
import { captureNextjsGlobalError } from "@/utils/monitoring/nextjsRscError";
import { useEffect } from "react";

type GlobalErrorProps = {
  readonly error: Error & { digest?: string | undefined };
  readonly reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    captureNextjsGlobalError(error);
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
