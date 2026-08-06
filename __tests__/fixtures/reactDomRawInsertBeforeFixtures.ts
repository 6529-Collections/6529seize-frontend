import type { SentryStackFrame } from "@/utils/sentry-client-filters";

type ReactDomRawInsertBeforeTerminalFunction = "sN" | "sR";

const sanitizedReactDomChunkPath =
  "app:///_next/static/chunks/0example-react-dom-runtime.js";

// Sanitized from the observed production raw stack. Only the vendor function
// order remains; the production chunk name and all event context are omitted.
const originallyObservedRawFunctionNames = [
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lo",
  "sN",
] as const;

// The latest observed release repeats the placement function while preserving
// the same 50-frame, single-chunk runtime signature.
const latestObservedRawFunctionNames = [
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lr",
  "li",
  "lo",
  "sN",
  "sN",
] as const;

function createFrames(functionNames: readonly string[]): SentryStackFrame[] {
  return functionNames.map((functionName) => ({
    filename: sanitizedReactDomChunkPath,
    abs_path: sanitizedReactDomChunkPath,
    function: functionName,
    in_app: true,
  }));
}

export function createObservedReactDomRawInsertBeforeFrames(
  terminalFunction: ReactDomRawInsertBeforeTerminalFunction = "sN"
): SentryStackFrame[] {
  return createFrames(
    originallyObservedRawFunctionNames.map((functionName) =>
      functionName === "sN" ? terminalFunction : functionName
    )
  );
}

export function createLatestReactDomRawFrames(): SentryStackFrame[] {
  return createFrames(latestObservedRawFunctionNames);
}
