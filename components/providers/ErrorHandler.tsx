"use client";

import { useEffect } from "react";

const REACT_ERROR_CODES: Record<string, string> = {
  "482":
    "An unknown Component is an async Client Component. Only Server Components can be async at the moment. This error is often caused by accidentally adding 'use client' to a module that was originally written for the server.",
  "185":
    "Hydration failed because the initial UI does not match what was rendered on the server.",
  "31": "Objects are not valid as a React child.",
  "294": "Missing Suspense boundary.",
};

function decodeReactError(message: string): { decoded: string; code?: string } {
  const regex = /Minified React error #(\d+)/;
  const match = regex.exec(message);
  if (match) {
    const code = match[1];
    const decodedMessage =
      REACT_ERROR_CODES[code] || `Unknown React error code: ${code}`;
    return {
      decoded: `${decodedMessage} (React Error #${code})`,
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

export default function ErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const { message, error, filename, lineno, colno } = event;

      const { decoded, code } = decodeReactError(message);

      console.group("🚨 Production Error (Decoded)");
      console.error("Message:", decoded);
      if (code) {
        console.error(`React Error Code: #${code}`);
        console.error(`Full Details: https://react.dev/errors/${code}`);
      }
      console.error("Original Message:", message);
      console.error("File:", filename);
      console.error("Line:", lineno, "Column:", colno);

      if (error) {
        console.error("Error Name:", error.name);
        console.error("\n📚 Stack Trace:");
        console.error(enhanceStackTrace(error.stack));
        console.error(
          "\n💡 Tip: Enable source maps in DevTools (Settings → Sources → Enable JavaScript source maps)"
        );
        console.error(
          "   to see original file names and line numbers mapped from the minified code."
        );
      }

      console.groupEnd();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const { reason } = event;

      let decodedMessage = "Unhandled Promise Rejection";
      if (reason instanceof Error) {
        const { decoded } = decodeReactError(reason.message);
        decodedMessage = decoded;
      } else if (typeof reason === "string") {
        const { decoded } = decodeReactError(reason);
        decodedMessage = decoded;
      }

      console.group("🚨 Unhandled Promise Rejection (Decoded)");
      console.error("Reason:", decodedMessage);
      if (reason instanceof Error) {
        console.error("Enhanced Stack Trace:");
        console.error(enhanceStackTrace(reason.stack));
      } else {
        console.error("Rejection Value:", reason);
      }
      console.groupEnd();
    };

    globalThis.addEventListener("error", handleError);
    globalThis.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      globalThis.removeEventListener("error", handleError);
      globalThis.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  return null;
}
