import type { ReactNode } from "react";

import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

export enum ProfileBadgeSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
}

interface ProfileAvatarProps {
  readonly pfpUrl: string | null | undefined;
  readonly size?: ProfileBadgeSize | undefined;
  readonly alt?: string | undefined;
  readonly fallbackContent?: ReactNode | undefined;
}

const AVATAR_SIZE_CLASSES: Record<ProfileBadgeSize, string> = {
  [ProfileBadgeSize.SMALL]: "tw-h-7 tw-w-7",
  [ProfileBadgeSize.MEDIUM]: "tw-h-10 tw-w-10",
  [ProfileBadgeSize.LARGE]: "tw-h-12 tw-w-12",
};

export default function ProfileAvatar({
  pfpUrl,
  size = ProfileBadgeSize.MEDIUM,
  alt = "Profile picture",
  fallbackContent = null,
}: ProfileAvatarProps) {
  return (
    <div
      className={`${AVATAR_SIZE_CLASSES[size]} tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg`}>
      <div className="tw-rounded-lg tw-h-full tw-w-full">
        <div className="tw-ring-1 tw-ring-white/10 tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-900">
          <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
            {pfpUrl ? (
              <img
                src={getScaledImageUri(pfpUrl, ImageScale.W_AUTO_H_50)}
                alt={alt}
                className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
              />
            ) : (
              fallbackContent
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
