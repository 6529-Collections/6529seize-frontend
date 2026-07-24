import type { SentryStackFrame } from "@/utils/sentry-client-filters";

type ReactDomRawInsertBeforeTerminalFunction = "sN" | "sR";

const sanitizedReactDomChunkPath =
  "app:///_next/static/chunks/0example-react-dom-runtime.js";

// Sanitized from the observed production raw stack. Only the vendor function
// order remains; the production chunk name and all event context are omitted.
const observedRawFunctionNames = [
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

export function createObservedReactDomRawInsertBeforeFrames(
  terminalFunction: ReactDomRawInsertBeforeTerminalFunction = "sN"
): SentryStackFrame[] {
  return observedRawFunctionNames.map((functionName) => ({
    filename: sanitizedReactDomChunkPath,
    abs_path: sanitizedReactDomChunkPath,
    function: functionName === "sN" ? terminalFunction : functionName,
    in_app: true,
  }));
}
