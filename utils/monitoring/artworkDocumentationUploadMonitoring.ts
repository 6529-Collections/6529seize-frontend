import * as Sentry from "@sentry/nextjs";
import {
  getStructuredApiErrorCode,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";

export type DocumentationUploadStage =
  | "reserve"
  | "transfer"
  | "check"
  | "attach";
interface UploadFailureContext {
  readonly stage: DocumentationUploadStage;
  readonly profileVersion: number;
  readonly assetState?: string | undefined;
  /** In-memory identity only; never included in an event. */
  readonly attempt: object;
}
const stages = new Set(["reserve", "transfer", "check", "attach"]);
const states = new Set([
  "created",
  "uploading",
  "processing",
  "ready",
  "failed",
  "quarantined",
  "expired",
  "cancelled",
]);
const codes = new Set([
  "PART_UPLOAD_FAILED",
  "MISSING_SIGNED_PART",
  "INVALID_PART_POLICY",
  "UPLOAD_FILE_CHANGED",
  "UPLOAD_FILE_REQUIRED",
  "UPLOAD_MUTATION_NOT_ALLOWED",
  "PUBLICATION_ASSET_ROLE_REQUIRED",
  "UPLOAD_STATUS_CHECK_FAILED",
]);
const reportedAttempts = new WeakMap<object, Set<string>>();

function classifyUploadFailure(error: unknown) {
  const rawStatus = getStructuredApiErrorStatus(error);
  const status =
    typeof rawStatus === "number" &&
    Number.isInteger(rawStatus) &&
    rawStatus >= 400 &&
    rawStatus <= 599
      ? rawStatus
      : undefined;
  let kind = "unexpected";
  if (status !== undefined) kind = status >= 500 ? "server" : "client";
  else if (
    error instanceof Error &&
    /failed to fetch|load failed|network(?:\s|error)|connection was lost/i.test(
      error.message
    )
  )
    kind = "transport";
  const rawCode =
    getStructuredApiErrorCode(error) ??
    (error instanceof Error ? error.message : undefined);
  const code =
    rawCode !== undefined && codes.has(rawCode) ? rawCode : "unknown";
  return { status, kind, code };
}

/** Bounded upload diagnostics. Never pass through errors, URLs, file names or artist answers. */
export function reportArtworkDocumentationUploadFailure(
  error: unknown,
  context: UploadFailureContext
): void {
  try {
    if (error instanceof Error && error.name === "AbortError") return;
    const stage = stages.has(context.stage) ? context.stage : "unknown";
    const reported = reportedAttempts.get(context.attempt) ?? new Set<string>();
    if (reported.has(stage)) return;
    reported.add(stage);
    reportedAttempts.set(context.attempt, reported);
    const { status, kind, code } = classifyUploadFailure(error);
    const tags = {
      feature: "artwork-documentation-upload",
      upload_stage: stage,
      failure_kind: kind,
      error_code: code,
      http_status: status === undefined ? "unknown" : String(status),
      profile_version: [1, 2, 3].includes(context.profileVersion)
        ? String(context.profileVersion)
        : "unknown",
      asset_state:
        context.assetState !== undefined && states.has(context.assetState)
          ? context.assetState
          : "unknown",
    };
    const diagnostic = new Error(
      `Artwork documentation upload failed (${stage}, ${kind})`
    );
    diagnostic.name = "ArtworkDocumentationUploadError";
    Sentry.withScope((scope) => {
      scope.setLevel(kind === "client" ? "warning" : "error");
      scope.setFingerprint(["artwork-documentation-upload", stage, kind]);
      scope.addEventProcessor((event) => {
        // Clear inherited isolation-scope data after SDK scope merging.
        const bounded = { ...event, tags };
        delete bounded.breadcrumbs;
        delete bounded.extra;
        delete bounded.request;
        delete bounded.user;
        delete bounded.contexts;
        delete bounded.transaction;
        return bounded;
      });
      Sentry.captureException(diagnostic);
    });
  } catch {
    // Reporting must never affect recovery or expose the original error.
  }
}
