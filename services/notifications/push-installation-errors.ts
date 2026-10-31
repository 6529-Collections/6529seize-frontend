import { extractErrorStatusCode } from "@/utils/errorStatus";

type PreparationFailureReason =
  | "identity_changed"
  | "signed_out"
  | "logout_pending"
  | "installation_changed"
  | "auth_changed";

export class PushInstallationPreparationError extends Error {
  constructor(readonly reason: PreparationFailureReason) {
    let message =
      "Push registration deferred until logout reconciliation completes";
    if (reason === "identity_changed") message = "Push installation ID changed";
    if (reason === "signed_out")
      message = "Push registration belongs to a signed-out session";
    super(message);
  }
}

export function getPushPreparationFailureReason(error: unknown): string {
  return error instanceof PushInstallationPreparationError
    ? error.reason
    : "storage_or_identity_failure";
}

export function getPushLogoutFailure(error: unknown) {
  const status = extractErrorStatusCode(error);
  const message = error instanceof Error ? error.message : error;
  let reason = "transport_or_unknown_failure";
  if (status !== null) reason = "http_failure";
  if (status === 403) {
    switch (message) {
      case "A native session is required for logout before push registration":
        reason = "native_session_required";
        break;
      case "Invalid push installation credential":
        reason = "invalid_installation_credential";
        break;
      case "Legacy installation token ownership is ambiguous":
        reason = "legacy_ownership_ambiguous";
        break;
    }
  }
  return { reason, http_status: status };
}
