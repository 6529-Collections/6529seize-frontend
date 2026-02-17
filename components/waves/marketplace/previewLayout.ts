import type { LinkPreviewVariant } from "../LinkPreviewContext";

export const MARKETPLACE_MEDIA_FRAME_CLASS =
  "tw-aspect-[16/9] tw-min-h-[14rem] tw-w-full tw-bg-inherit md:tw-min-h-[15rem]";

export function getMarketplaceContainerClass(
  variant: LinkPreviewVariant,
  compact: boolean
): string {
  if (compact) {
    if (variant === "home") {
      return "tw-w-full tw-overflow-hidden tw-rounded-xl tw-bg-black/30";
    }

    return "tw-w-full tw-overflow-hidden tw-rounded-xl tw-bg-iron-900/40";
  }

  if (variant === "home") {
    return "tw-w-full tw-overflow-hidden tw-rounded-xl tw-bg-iron-950/50";
  }

  return "tw-w-full tw-overflow-hidden tw-bg-inherit";
}

export function getMarketplaceTitleRowClass(
  variant: LinkPreviewVariant
): string {
  if (variant === "home") {
    return "tw-bg-iron-950/50 tw-px-3 tw-py-2";
  }

  return "tw-py-1.5";
}
