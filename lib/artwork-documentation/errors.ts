const MUSEUM_ERROR_CODES = new Set([
  "PROGRAM_TERMS_FIXED",
  "UNSUPPORTED_PROGRAM",
  "DUPLICATE_MUSEUM_ID",
  "INVALID_TIME_RANGE",
  "DURATION_REQUIRED",
  "MEASUREMENT_NOTE_REQUIRED",
  "INCOMPLETE_COORDINATES",
  "INVALID_TGN_IDENTITY",
  "MUSEUM_RECORD_INCOMPLETE",
  "PROFILE_UPGRADE_REQUIRES_REVIEW",
  "PROFILE_DOWNGRADE_NOT_ALLOWED",
]);
/** Only known codes become copy keys; server payloads and user values are never used as UI messages. */
export function documentationErrorMessageKey(
  code: string | undefined
): string | undefined {
  return code && MUSEUM_ERROR_CODES.has(code)
    ? `museum.error.${code}`
    : undefined;
}
