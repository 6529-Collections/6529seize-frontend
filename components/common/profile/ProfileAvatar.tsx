import type { ReactNode } from "react";

import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

export enum ProfileBadgeSize {
  COMPACT = "COMPACT",
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
}

interface ProfileAvatarProps {
  readonly pfpUrl: string | null | undefined;
  readonly size?: ProfileBadgeSize | undefined;
  readonly shape?: "rounded" | "circle" | undefined;
  readonly alt?: string | undefined;
  readonly fallbackContent?: ReactNode | undefined;
  /** Nullish values keep the existing default image. */
  readonly imageContent?: ReactNode | undefined;
}

const AVATAR_SIZE_CLASSES: Record<ProfileBadgeSize, string> = {
  [ProfileBadgeSize.COMPACT]: "tw-h-8 tw-w-8",
  [ProfileBadgeSize.SMALL]: "tw-h-7 tw-w-7",
  [ProfileBadgeSize.MEDIUM]: "tw-h-10 tw-w-10",
  [ProfileBadgeSize.LARGE]: "tw-h-12 tw-w-12",
};

export default function ProfileAvatar({
  pfpUrl,
  size = ProfileBadgeSize.MEDIUM,
  shape = "rounded",
  alt = "Profile picture",
  fallbackContent = null,
  imageContent,
}: ProfileAvatarProps) {
  const radiusClass = shape === "circle" ? "tw-rounded-full" : "tw-rounded-lg";
  return (
    <div
      className={`${AVATAR_SIZE_CLASSES[size]} ${radiusClass} tw-relative tw-flex-shrink-0 tw-bg-iron-900`}
    >
      <div className={`${radiusClass} tw-h-full tw-w-full`}>
        <div
          className={`${radiusClass} tw-h-full tw-w-full tw-max-w-full tw-overflow-hidden tw-bg-iron-900 tw-ring-1 tw-ring-white/10`}
        >
          <div
            className={`${radiusClass} tw-flex tw-h-full tw-items-center tw-justify-center tw-overflow-hidden tw-text-center`}
          >
            {pfpUrl
              ? (imageContent ?? (
                  // Preserve arbitrary remote sources for callers without the Coming up opt-in.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getScaledImageUri(pfpUrl, ImageScale.W_AUTO_H_50)}
                    alt={alt}
                    className="tw-h-full tw-w-full tw-bg-transparent tw-object-cover"
                  />
                ))
              : fallbackContent}
          </div>
        </div>
      </div>
    </div>
  );
}
