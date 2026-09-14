const SENSITIVE_KEY_FRAGMENT_PATTERN =
  /(auth|authorization|cookie|set-cookie|token|secret|password|passwd|session|api[_-]?key|private[_-]?key|signature|body|payload)/i;
const MODERATION_SENSITIVE_KEY_PATTERN =
  /(evidence|content_snapshot|preview|statement_value|moderator_note)/i;
const SENSITIVE_HEADER_NAME_PATTERN =
  /^(authorization|cookie|set-cookie|x-api-key|x-auth-token|x-csrf-token|x-xsrf-token|proxy-authorization|x-forwarded-for|x-real-ip|cf-connecting-ip)$/i;

export const isSensitiveSentryField = (key: string): boolean =>
  SENSITIVE_KEY_FRAGMENT_PATTERN.test(key) ||
  MODERATION_SENSITIVE_KEY_PATTERN.test(key);

export const isSensitiveSentryHeader = (name: string): boolean =>
  SENSITIVE_HEADER_NAME_PATTERN.test(name);
