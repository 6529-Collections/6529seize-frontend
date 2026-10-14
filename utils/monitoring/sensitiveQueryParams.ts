const REDACTED_QUERY_VALUE = "[Filtered]";
// Query parameter names that carry credentials, such as connection-sharing
// links. Telemetry keeps the parameter name so the URL shape stays debuggable.
const SENSITIVE_QUERY_PARAM_NAME_PATTERN =
  /(?:token|secret|password|passwd|signature|session|api[_-]?key|private[_-]?key|connection_share_code)/i;
// One `name=value` query parameter inside free text. The value ends at the next
// parameter, fragment, whitespace, quote, or angle bracket.
const QUERY_PARAM_PATTERN = /([?&])([^?&#=\s"'<>]+)=([^&#\s"'<>]*)/g;

/** Replaces credential-like query parameter values in URLs embedded in text. */
export function redactSensitiveQueryParams(value: string): string {
  return value.replaceAll(
    QUERY_PARAM_PATTERN,
    (match: string, separator: string, name: string, paramValue: string) =>
      paramValue && SENSITIVE_QUERY_PARAM_NAME_PATTERN.test(name)
        ? `${separator}${name}=${REDACTED_QUERY_VALUE}`
        : match
  );
}
