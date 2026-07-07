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
  labels,
}: {
  readonly disableAllDropsSelection: boolean;
  readonly subscribedToAllDrops: boolean;
  readonly labels: {
    readonly unavailable: string;
    readonly disable: string;
    readonly enable: string;
  };
}) {
  if (disableAllDropsSelection && !subscribedToAllDrops) {
    return labels.unavailable;
  }

  if (subscribedToAllDrops) {
    return labels.disable;
  }

  return labels.enable;
}
