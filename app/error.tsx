"use client";

import ErrorComponent from "@/components/error/Error";
import styles from "@/styles/Home.module.scss";
import { Suspense, useEffect } from "react";

function decodeReactError(message: string): { decoded: string; code?: string } {
  const regex = /Minified React error #(\d+)/;
  const match = regex.exec(message);
  if (match) {
    const code = match[1];
    return {
      decoded: `React Error #${code} - Visit https://react.dev/errors/${code} for details. Original: ${message}`,
      code,
    };
  }
  return { decoded: message };
}

function enhanceStackTrace(stack: string | undefined): string {
  if (!stack) return "No stack trace available";

  const lines = stack.split("\n");
  const enhanced = lines.map((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("at ") || trimmed.includes("@")) {
      const atRegex = /at\s+([^\s(]+)\s+\(([^:)]+):(\d+):(\d+)\)/;
      const atMatch = atRegex.exec(trimmed);
      if (atMatch) {
        const [, funcName, file, lineNum, colNum] = atMatch;
        const isReactFile =
          file.includes("react") || file.includes("react-dom");
        const marker = isReactFile ? " [React Internal]" : "";
        return `  at ${funcName} (${file}:${lineNum}:${colNum})${marker}`;
      }

      const atSimpleRegex = /at\s+([^\s@]+)\s+@\s+([^:]+):(\d+):(\d+)/;
      const atSimpleMatch = atSimpleRegex.exec(trimmed);
      if (atSimpleMatch) {
        const [, funcName, file, lineNum, colNum] = atSimpleMatch;
        const isReactFile =
          file.includes("react") || file.includes("react-dom");
        const marker = isReactFile ? " [React Internal]" : "";
        return `  at ${funcName} @ ${file}:${lineNum}:${colNum}${marker}`;
      }
    }

    const simpleAtRegex = /^\w+\s+@\s+/;
    if (simpleAtRegex.exec(trimmed)) {
      const parts = trimmed.split("@");
      if (parts.length === 2) {
        const funcName = parts[0].trim();
        const location = parts[1].trim();
        const isReactFile =
          location.includes("react") || location.includes("react-dom");
        const marker = isReactFile
          ? " [React Internal - use source maps in DevTools]"
          : "";
        return `  ${funcName} @ ${location}${marker}`;
      }
    }

    return index === 0 ? trimmed : `  ${trimmed}`;
  });

  return enhanced.join("\n");
}

export default function AppError({
  error,
}: {
  readonly error: Error & { digest?: string };
}) {
  useEffect(() => {
    const { decoded, code } = decodeReactError(error.message);

    console.group("🚨 Route Error (Server Components)");
    console.error("Message:", decoded);
    if (code) {
      console.error(`React Error Code: #${code}`);
      console.error(`Full Details: https://react.dev/errors/${code}`);
    }
    console.error("Error Name:", error.name);
    if (error.digest) {
      console.error("Digest:", error.digest);
      console.error(
        "💡 Tip: Use this digest to search server logs for the full error details"
      );
    }
    console.error("\n📚 Stack Trace:");
    console.error(enhanceStackTrace(error.stack));
    if (!error.stack) {
      console.error(
        "⚠️  No stack trace available. This is common for Server Components errors in production."
      );
      console.error(
        "   Check your server logs or run in development mode to see full details."
      );
    }
    console.error(
      "\n💡 Tip: Enable source maps in DevTools (Settings → Sources → Enable JavaScript source maps)"
    );
    console.error(
      "   to see original file names and line numbers mapped from the minified code."
    );
    console.groupEnd();
  }, [error]);

  return (
    <main className={styles.main}>
      <Suspense fallback={null}>
        <ErrorComponent />
      </Suspense>
    </main>
  );
}
