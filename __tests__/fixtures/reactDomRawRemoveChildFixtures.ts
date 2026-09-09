import type { SentryStackFrame } from "@/utils/sentry-client-filters";

type ReactDomRawRemoveChildGeneration = "earlier" | "latest";

const sanitizedReactDomChunkPaths = {
  earlier: "app:///_next/static/chunks/0example-react-dom-runtime-a.js",
  latest: "app:///_next/static/chunks/0example-react-dom-runtime-b.js",
} as const;

const observedRawFunctionNames = Array.from({ length: 50 }, (_, index) =>
  index % 2 === 0 ? "s9" : "s7"
);

// Sanitized from both observed production bundle generations. Only the shared
// vendor function order remains; chunk names and event context are omitted.
export function createObservedReactDomRawRemoveChildFrames(
  generation: ReactDomRawRemoveChildGeneration = "latest"
): SentryStackFrame[] {
  const chunkPath = sanitizedReactDomChunkPaths[generation];
  return observedRawFunctionNames.map((functionName) => ({
    filename: chunkPath,
    abs_path: chunkPath,
    function: functionName,
    in_app: true,
  }));
}
