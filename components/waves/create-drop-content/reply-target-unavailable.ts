const FUTURE_REPLY_TARGET_ERROR_CODES = new Set([
  "REPLY_TARGET_DELETED",
  "REPLY_TARGET_NOT_FOUND",
  "REPLY_TARGET_UNAVAILABLE",
]);

export const REPLY_TARGET_UNAVAILABLE_TOAST_ID =
  "reply-target-unavailable";

const parseJsonIfPossible = (value: string): unknown => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const collectErrorStrings = (
  value: unknown,
  seen: Set<unknown> = new Set()
): string[] => {
  if (value === null || value === undefined || seen.has(value)) {
    return [];
  }

  if (typeof value === "string") {
    const parsed = parseJsonIfPossible(value);
    if (parsed !== value) {
      return [value, ...collectErrorStrings(parsed, seen)];
    }
    return [value];
  }

  if (typeof value !== "object") {
    return [];
  }

  seen.add(value);
  const record = value as Record<string, unknown>;
  return [
    ...collectErrorStrings(record["code"], seen),
    ...collectErrorStrings(record["error_code"], seen),
    ...collectErrorStrings(record["errorCode"], seen),
    ...collectErrorStrings(record["error"], seen),
    ...collectErrorStrings(record["message"], seen),
    ...collectErrorStrings(record["response"], seen),
    ...collectErrorStrings(record["body"], seen),
  ];
};

export const isReplyTargetUnavailableError = (error: unknown): boolean =>
  collectErrorStrings(error).some((message) => {
    const trimmed = message.trim();
    const upper = trimmed.toUpperCase();
    if (FUTURE_REPLY_TARGET_ERROR_CODES.has(upper)) {
      return true;
    }

    const lower = trimmed.toLowerCase();
    return (
      lower.includes("invalid reply.") &&
      lower.includes("drop") &&
      lower.includes("doesn't exist")
    );
  });
