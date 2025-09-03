import { ApiIdentity } from "../../../../generated/models/ApiIdentity";
import Image from "next/image";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";

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
      <Image
        unoptimized
        src={getScaledImageUri(profile.pfp, ImageScale.W_200_H_200)}
        alt="Profile picture"
        width="176"
        height="176"
        className="tw-flex-shrink-0 tw-object-contain tw-max-h-28 sm:tw-max-h-44 tw-w-auto tw-h-auto tw-rounded-lg tw-ring-[3px] tw-ring-white/30 tw-bg-iron-800"
      />
    );
  }
  return (
    <div
      className="tw-flex-shrink-0 tw-h-36 sm:tw-h-44 tw-w-36 sm:tw-w-44 tw-rounded-lg tw-ring-[3px] tw-ring-white/30"
      style={{
        background: `linear-gradient(45deg, ${defaultBanner1} 0%, ${defaultBanner2} 100%)`,
      }}
    ></div>
  );
}
