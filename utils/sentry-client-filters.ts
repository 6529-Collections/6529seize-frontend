export type SentryStackFrame = { filename?: string; abs_path?: string };
export type SentryEventHint = {
  originalException?: unknown;
  syntheticException?: unknown;
};

const filenameExceptions = ["inpage.js", "extensionServiceWorker.js", "injectLeap.js", "inject.chrome"];

function shouldFilterFilenameExceptions(
  frames: SentryStackFrame[] | undefined
): boolean {
  if (!frames) {
    return false;
  }
  return frames.some((frame) =>
    filenameExceptions.some(
      (pattern) =>
        frame?.filename?.includes(pattern) || frame?.abs_path?.includes(pattern)
    )
  );
}

function shouldFilterExceptionStack(hint?: SentryEventHint): boolean {
  const exception = hint?.originalException ?? hint?.syntheticException;
  if (!(exception instanceof Error)) {
    return false;
  }
  const stack = exception.stack;
  if (typeof stack !== "string") {
    return false;
  }
  return filenameExceptions.some((pattern) => stack.includes(pattern));
}

export function shouldFilterByFilenameExceptions(
  frames: SentryStackFrame[] | undefined,
  hint?: SentryEventHint
): boolean {
  return shouldFilterFilenameExceptions(frames) || shouldFilterExceptionStack(hint);
}

export const __testing = { filenameExceptions };
