const REDACTED_QUERY_VALUE = "[Filtered]";
// Query parameter names that carry credentials, such as connection-sharing
// links. Telemetry keeps the parameter name so the URL shape stays debuggable.
// Matching is deliberately broad (any name containing `session`, for example):
// over-redacting a telemetry value is the safe failure mode.
const SENSITIVE_QUERY_PARAM_NAME_PATTERN =
  /(?:token|secret|password|passwd|signature|session|api[_-]?key|private[_-]?key|connection_share_code)/i;
// One `name=value` query parameter inside free text. The value ends at the next
// parameter, fragment, whitespace, quote, or angle bracket; other punctuation
// such as a closing parenthesis is redacted with it.
const QUERY_PARAM_PATTERN = /([?&])([^?&#=\s"'<>]+)=([^&#\s"'<>]*)/g;

/**
 * Replaces credential-like query parameter values in URLs embedded in text.
 * Only parameters that follow `?` or `&` are URL query parameters; bare
 * `name=value` prose is out of scope here.
 */
export function redactSensitiveQueryParams(value: string): string {
  return value.replaceAll(
    QUERY_PARAM_PATTERN,
    (match: string, separator: string, name: string, paramValue: string) =>
      paramValue && SENSITIVE_QUERY_PARAM_NAME_PATTERN.test(name)
        ? `${separator}${name}=${REDACTED_QUERY_VALUE}`
        : match
  );
}
