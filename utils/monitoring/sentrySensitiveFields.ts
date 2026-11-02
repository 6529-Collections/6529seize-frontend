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

// Telemetry attribute names routinely carry coarse states and timings such as
// "auth_state", "reauth_required" or "step_auth_ready_ms". Those words only
// signal a credential at the end of a name ("basic_auth") or when followed by
// an identifier-like word ("session_id").
const STATE_KEY_WORDS = new Set(["auth", "reauth", "session"]);
const CREDENTIAL_KEY_SUFFIX_WORDS = new Set([
  "code",
  "data",
  "header",
  "id",
  "key",
  "value",
]);

const splitKeyWords = (key: string): string[] =>
  key
    .replaceAll(/([a-z\d])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z\d]+/)
    .filter(Boolean);

export const isSensitiveSentryLogAttribute = (key: string): boolean => {
  const words = splitKeyWords(key);
  const remainingWords = words.filter((word) => !STATE_KEY_WORDS.has(word));
  if (isSensitiveSentryField(remainingWords.join("_"))) {
    return true;
  }

  return words.some((word, index) => {
    if (word !== "auth" && word !== "session") {
      return false;
    }
    const nextWord = words[index + 1];
    return nextWord === undefined || CREDENTIAL_KEY_SUFFIX_WORDS.has(nextWord);
  });
};
