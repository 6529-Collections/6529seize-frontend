import * as Sentry from "@sentry/nextjs";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";

type SubmissionFailureKind = "transport" | "server" | "unexpected";

function getFailureKind(error: unknown): SubmissionFailureKind | null {
  if (error instanceof DOMException && error.name === "AbortError") {
    return null;
  }
  const status = getStructuredApiErrorStatus(error);
  if (status !== undefined && status >= 400 && status < 500) {
    return null;
  }
  if (status !== undefined && status >= 500 && status <= 599) {
    return "server";
  }
  if (
    error instanceof Error &&
    /failed to fetch|load failed|network(?:\s|error)|connection was lost/i.test(
      error.message
    )
  ) {
    return "transport";
  }
  return "unexpected";
}

/** Report failed submissions without copying content, URLs, or moderation evidence. */
export function reportDropSubmissionFailure(error: unknown): void {
  try {
    const kind = getFailureKind(error);
    if (kind === null) {
      return;
    }
    const reported = new Error(`Drop submission failed (${kind})`);
    reported.name = "DropSubmissionError";
    Sentry.withScope((scope) => {
      scope.clearBreadcrumbs();
      scope.setUser(null);
      scope.setLevel("error");
      scope.setFingerprint(["drop-submission", kind]);
      scope.setTag("feature", "drop-submission");
      scope.setTag("failure_kind", kind);
      Sentry.captureException(reported);
    });
  } catch {
    // Error reporting must not change submission cleanup or user feedback.
  }
}
