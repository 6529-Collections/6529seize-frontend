import type { SentryStackFrame } from "@/utils/sentry-client-filters";

export type ReactDomRawRemoveChildVariant = "base" | "with-s9";

const sanitizedReactDomChunkPath =
  "app:///_next/static/chunks/0example-react-dom-runtime.js";

// Sanitized from the two observed production raw-stack shapes. Only the
// vendor function order remains; chunk names and event context are omitted.
const baseRawFunctionNames = [
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
  "lr",
  "s7",
] as const;

const rawFunctionNamesWithS9 = [
  ...baseRawFunctionNames.slice(0, 41),
  "s7",
  "s9",
  "s7",
  "s9",
  "s7",
  "s9",
  "s7",
  "s9",
  "s7",
] as const;

export function createObservedReactDomRawRemoveChildFrames(
  variant: ReactDomRawRemoveChildVariant = "base"
): SentryStackFrame[] {
  const functionNames =
    variant === "with-s9" ? rawFunctionNamesWithS9 : baseRawFunctionNames;

  return functionNames.map((functionName) => ({
    filename: sanitizedReactDomChunkPath,
    abs_path: sanitizedReactDomChunkPath,
    function: functionName,
    in_app: true,
  }));
}
