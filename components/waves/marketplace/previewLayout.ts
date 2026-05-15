import type { LinkPreviewVariant } from "../LinkPreviewContext";

export const MARKETPLACE_MEDIA_FRAME_CLASS =
  "tw-box-border tw-h-64 tw-w-full tw-bg-inherit tw-p-4 md:tw-h-72 md:tw-p-6";

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

  const fullModeBaseClass =
    "tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10";

  if (variant === "home") {
    return `${fullModeBaseClass} tw-bg-black/40`;
  }

  return `${fullModeBaseClass} tw-bg-iron-950/65`;
}
