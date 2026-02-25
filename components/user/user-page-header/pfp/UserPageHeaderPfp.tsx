import Image from "next/image";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

export default function UserPageHeaderPfp({
  profile,
  defaultBanner1,
  defaultBanner2,
}: {
  readonly profile: ApiIdentity;
  readonly defaultBanner1: string;
  readonly defaultBanner2: string;
}) {
  const glassWrapperClass =
    "tw-relative tw-z-10 tw-inline-flex tw-flex-shrink-0 tw-p-0.5 tw-rounded-xl tw-bg-white/10 tw-backdrop-blur-md tw-ring-1 tw-ring-white/20 tw-shadow-2xl";

  if (profile.pfp) {
    return (
      <div className={glassWrapperClass}>
        <Image
          unoptimized
          src={getScaledImageUri(profile.pfp, ImageScale.W_200_H_200)}
          alt="Profile picture"
          width="144"
          height="144"
          className="tw-h-20 tw-w-auto tw-max-w-20 tw-rounded-xl tw-bg-iron-800 tw-object-contain sm:tw-h-28 sm:tw-max-w-28"
        />
      </div>
    );
  }

  return (
    <div className={glassWrapperClass}>
      <div
        className="tw-h-20 tw-w-20 tw-rounded-xl sm:tw-h-28 sm:tw-w-28"
        style={{
          background: `linear-gradient(45deg, ${defaultBanner1} 0%, ${defaultBanner2} 100%)`,
        }}
      />
    </div>
  );
}
