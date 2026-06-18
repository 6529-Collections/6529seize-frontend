import type { TypeOptions } from "react-toastify";

import { sanitizeErrorForUser } from "@/utils/error-sanitizer";

const DEFAULT_TOAST_AUTO_CLOSE_MS = 3000;
const ERROR_TOAST_AUTO_CLOSE_MS = 8000;

export const getToastAutoClose = (type: TypeOptions): number =>
  type === "error" ? ERROR_TOAST_AUTO_CLOSE_MS : DEFAULT_TOAST_AUTO_CLOSE_MS;

export type FriendlyToastContent = {
  readonly title: string;
  readonly description?: string | undefined;
  readonly details?: string | undefined;
};

export type FriendlyErrorToastInput = {
  readonly title: string;
  readonly description?: string | undefined;
  readonly error?: unknown;
  readonly fallbackDetails?: string | undefined;
};

const SENTENCE_ENDINGS = ".!?";

const collapseWhitespace = (value: string): string => {
  const trimmed = value.trim();
  let result = "";
  let needsSpace = false;

  for (const character of trimmed) {
    if (character.trim() === "") {
      needsSpace = result.length > 0;
      continue;
    }

    if (needsSpace) {
      result += " ";
      needsSpace = false;
    }

    result += character;
  }

  return result;
};

const endsWithIgnoreCase = (value: string, suffix: string): boolean =>
  value.toLowerCase().endsWith(suffix.toLowerCase());

const startsWithIgnoreCase = (value: string, prefix: string): boolean =>
  value.toLowerCase().startsWith(prefix.toLowerCase());

const stripTrailingCharacters = (value: string, characters: string): string => {
  let endIndex = value.length;

  while (endIndex > 0 && characters.includes(value[endIndex - 1]!)) {
    endIndex -= 1;
  }

  return value.slice(0, endIndex);
};

const replaceTrailingExclamations = (value: string): string => {
  const withoutExclamations = stripTrailingCharacters(value, "!");
  return withoutExclamations.length === value.length
    ? value
    : `${withoutExclamations}.`;
};

const stripTrailingSentencePunctuation = (value: string): string =>
  stripTrailingCharacters(value, SENTENCE_ENDINGS);

const includesAny = (value: string, fragments: readonly string[]): boolean =>
  fragments.some((fragment) => value.includes(fragment));

const hasInsufficientBalanceMessage = (lowerMessage: string): boolean =>
  includesAny(lowerMessage, ["insufficient balance", "insufficient funds"]) ||
  (lowerMessage.includes("insufficient") &&
    includesAny(lowerMessage, ["balance", "funds"]));

export const normalizeToastText = (message: string): string => {
  const trimmed = collapseWhitespace(message);
  if (!trimmed) {
    return "Update.";
  }

  const withoutShouting = replaceTrailingExclamations(trimmed);
  if (SENTENCE_ENDINGS.includes(withoutShouting.at(-1) ?? "")) {
    return withoutShouting;
  }

  return `${withoutShouting}.`;
};

const lowerFirst = (value: string): string =>
  value ? value.charAt(0).toLowerCase() + value.slice(1) : value;

const stripErrorPrefix = (message: string): string => {
  const prefixes = ["Error ", "Failed to ", "Could not ", "Couldn't "];
  const trimmed = message.trim();
  const prefix = prefixes.find((candidate) =>
    startsWithIgnoreCase(trimmed, candidate)
  );

  return prefix ? trimmed.slice(prefix.length).trim() : trimmed;
};

const toCouldntTitle = (action: string): string =>
  `Couldn't ${lowerFirst(
    stripTrailingSentencePunctuation(stripErrorPrefix(action))
  )}.`;

const isGenericErrorMessage = (message: string): boolean => {
  const genericMessages = new Set([
    "an error occurred",
    "an error occurred. please try again",
    "an unexpected error occurred",
    "an unexpected error occurred. please try again",
    "error",
    "error occurred",
    "failed",
    "something went wrong",
    "unexpected error occurred",
  ]);
  return genericMessages.has(
    stripTrailingSentencePunctuation(message.trim()).toLowerCase()
  );
};

export const getToastErrorDetails = (
  error: unknown,
  fallback?: string
): string | undefined => {
  const rawSanitized = sanitizeErrorForUser(error).trim();
  const normalizedFallback = fallback
    ? normalizeToastText(fallback)
    : undefined;

  if (!rawSanitized || isGenericErrorMessage(rawSanitized)) {
    return normalizedFallback;
  }

  return normalizeToastText(rawSanitized);
};

export const getFriendlyErrorToast = ({
  title,
  description = "Please try again.",
  error,
  fallbackDetails,
}: FriendlyErrorToastInput): FriendlyToastContent => ({
  title: normalizeToastText(title),
  description,
  details:
    error === undefined
      ? fallbackDetails
        ? normalizeToastText(fallbackDetails)
        : undefined
      : getToastErrorDetails(error, fallbackDetails),
});

const getValidationToast = (message: string): FriendlyToastContent => ({
  title: "Check this value.",
  description: normalizeToastText(message),
});

const removeTrailingSuccessfully = (message: string): string => {
  const trimmed = message.trim();
  const successSuffix = " successfully";
  const successSuffixWithPeriod = `${successSuffix}.`;

  if (endsWithIgnoreCase(trimmed, successSuffixWithPeriod)) {
    return `${trimmed.slice(0, trimmed.length - successSuffixWithPeriod.length)}.`;
  }

  if (endsWithIgnoreCase(trimmed, successSuffix)) {
    return trimmed.slice(0, trimmed.length - successSuffix.length);
  }

  return message;
};

const getSuccessToast = (message: string): FriendlyToastContent | null => {
  const normalized = normalizeToastText(
    removeTrailingSuccessfully(message).split(" - ").join(". ")
  );

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("updated")) return { title: normalized };
  if (lowerMessage.includes("created")) return { title: normalized };
  if (lowerMessage.includes("deleted")) return { title: normalized };
  if (lowerMessage.includes("imported")) return { title: normalized };
  if (lowerMessage.includes("submitted")) return { title: normalized };
  if (lowerMessage.includes("saved")) return { title: normalized };
  if (includesAny(lowerMessage, ["confirmed", "successful"])) {
    return { title: normalized };
  }

  return null;
};

const getActionAfterPrefix = (
  message: string,
  prefix: string
): string | null => {
  const trimmed = message.trim();
  if (!startsWithIgnoreCase(trimmed, prefix)) {
    return null;
  }

  const action = trimmed.slice(prefix.length).trim();
  return action || null;
};

const getFailedWithDetails = (
  message: string
): { readonly action: string; readonly details: string } | null => {
  const actionWithDetails = getActionAfterPrefix(message, "Failed to ");
  if (!actionWithDetails) {
    return null;
  }

  const colonIndex = actionWithDetails.indexOf(":");
  if (colonIndex < 1) {
    return null;
  }

  const action = actionWithDetails.slice(0, colonIndex).trim();
  const details = actionWithDetails.slice(colonIndex + 1).trim();

  return action && details ? { action, details } : null;
};

export const getFriendlyToastContent = ({
  message,
  type,
}: {
  readonly message: string;
  readonly type: TypeOptions;
}): FriendlyToastContent | null => {
  const normalized = normalizeToastText(message);

  if (type === "success") {
    return getSuccessToast(message) ?? { title: normalized };
  }

  if (type === "info") {
    return { title: normalized };
  }

  if (type === "warning") {
    return { title: normalized };
  }

  if (type !== "error") {
    return null;
  }

  const lowerMessage = message.toLowerCase();

  if (message.trim().toLowerCase() === "unauthorized") {
    return {
      title: "Please reconnect your wallet.",
      description: "Your session is no longer authorized.",
    };
  }

  if (
    includesAny(lowerMessage, [
      "unauthorized",
      "authorization failed",
      "forbidden",
    ])
  ) {
    return {
      title: "Please reconnect your wallet.",
      description: "Your session or permissions need to be refreshed.",
      details: normalized,
    };
  }

  if (
    includesAny(lowerMessage, [
      "failed to authenticate",
      "authentication failed",
    ])
  ) {
    return {
      title: "Couldn't authenticate.",
      description: "Reconnect your wallet and try again.",
    };
  }

  if (
    includesAny(lowerMessage, [
      "authentication rejected",
      "signature rejected",
      "user rejected",
      "request rejected",
      "rejected request",
      "denied",
      "declined",
      "4001",
    ])
  ) {
    return {
      title: "Request canceled in your wallet.",
      description: "No changes were made.",
    };
  }

  if (
    includesAny(lowerMessage, ["network", "failed to fetch", "load failed"])
  ) {
    return {
      title: "Network error.",
      description: "Check your connection and try again.",
      details: normalized,
    };
  }

  if (includesAny(lowerMessage, ["timeout", "timed out"])) {
    return {
      title: "Request timed out.",
      description: "Please try again.",
      details: normalized,
    };
  }

  if (hasInsufficientBalanceMessage(lowerMessage)) {
    return {
      title: "Insufficient balance.",
      description: "Check your wallet balance and try again.",
      details: normalized,
    };
  }

  if (lowerMessage.includes("something went wrong")) {
    return {
      title: "Couldn't complete this action.",
      description: "Please try again.",
    };
  }

  if (
    startsWithIgnoreCase(message, "invalid") ||
    includesAny(lowerMessage, ["must be", "missing", "required"])
  ) {
    return getValidationToast(message);
  }

  const failedWithDetails = getFailedWithDetails(message);
  if (failedWithDetails) {
    return {
      title: toCouldntTitle(failedWithDetails.action),
      description: "Please try again.",
      details: normalizeToastText(failedWithDetails.details),
    };
  }

  const errorAction = getActionAfterPrefix(message, "Error ");
  if (errorAction) {
    return {
      title: toCouldntTitle(errorAction),
      description: "Please try again.",
    };
  }

  const failedAction = getActionAfterPrefix(message, "Failed to ");
  if (failedAction) {
    return {
      title: toCouldntTitle(failedAction),
      description: "Please try again.",
    };
  }

  return {
    title: "Couldn't complete this action.",
    description: "Please try again.",
    details: normalized,
  };
};
