import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

export type NotificationLoadingTarget = "all-group" | "all-drops";

export const ALL_GROUP_MENTION = ApiDropGroupMention.All;

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

export function getAllDropsTooltip({
  disableAllDropsSelection,
  subscribedToAllDrops,
  subscribersLimit,
}: {
  readonly disableAllDropsSelection: boolean;
  readonly subscribedToAllDrops: boolean;
  readonly subscribersLimit: number;
}) {
  if (disableAllDropsSelection && !subscribedToAllDrops) {
    return `All-message notifications are unavailable for waves with ${subscribersLimit.toLocaleString()}+ followers.`;
  }

  if (subscribedToAllDrops) {
    return "Click to disable notifications for all messages";
  }

  return "Click to enable notifications for all messages";
}
