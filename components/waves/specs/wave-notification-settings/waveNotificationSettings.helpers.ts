import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

export type NotificationLoadingTarget = "all-group" | "all-drops";

export const ALL_GROUP_MENTION = ApiDropGroupMention.All;

export const getErrorMessage = (error: unknown, defaultMessage: string) =>
  typeof error === "string" ? error : defaultMessage;

export function getAllDropsTooltip({
  disableAllDropsSelection,
  subscribedToAllDrops,
  subscribersLimit,
}: {
  readonly disableAllDropsSelection: boolean;
  readonly subscribedToAllDrops: boolean;
  readonly subscribersLimit: number;
}) {
  if (disableAllDropsSelection) {
    return `'All' notifications unavailable for waves with ${subscribersLimit.toLocaleString()}+ followers.`;
  }

  if (subscribedToAllDrops) {
    return "Click to disable notifications for all drops";
  }

  return "Click to enable notifications for all drops";
}
