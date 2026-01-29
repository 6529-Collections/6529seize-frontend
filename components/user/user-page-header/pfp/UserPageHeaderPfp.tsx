import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import Image from "next/image";
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
  if (profile.pfp) {
    return (
      <div>
        <div className="tw-relative tw-z-10 tw-h-28 tw-w-28 tw-overflow-hidden tw-rounded-xl tw-bg-white/10 tw-shadow-2xl tw-ring-2 tw-ring-white/20 tw-backdrop-blur-md sm:tw-h-36 sm:tw-w-36">
          <Image
            unoptimized
            src={getScaledImageUri(profile.pfp, ImageScale.W_200_H_200)}
            alt="Profile picture"
            width="128"
            height="128"
            className="tw-relative tw-z-10 tw-h-full tw-w-auto tw-object-contain"
          />
        </div>
      </div>
    );
  }
  return (
    <div className="tw-relative tw-h-28 tw-w-28 tw-rounded-xl tw-bg-zinc-950 tw-p-1 tw-shadow-2xl tw-ring-1 tw-ring-white/10 sm:tw-h-36 sm:tw-w-36">
      <div
        className="tw-h-full tw-w-full tw-rounded-xl"
        style={{
          background: `linear-gradient(45deg, ${defaultBanner1} 0%, ${defaultBanner2} 100%)`,
        }}
      />
    </div>
  );
}
