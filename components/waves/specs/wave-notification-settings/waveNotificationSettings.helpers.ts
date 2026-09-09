import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

export type NotificationLoadingTarget = "broadcast-mentions" | "all-drops";

// The persisted ALL value is the backward-compatible preference key for both
// admin-only broadcast mentions: @all and @contributors.
export const BROADCAST_MENTION_PREFERENCE = ApiDropGroupMention.All;

export const getErrorMessage = (error: unknown, defaultMessage: string) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  if (typeof error === "string") {
    return error;
  }

  return defaultMessage;
};
