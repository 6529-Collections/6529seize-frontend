import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import Image from "next/image";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

export default function UserPageHeaderPfp({
  profile,
  profileLabel,
  defaultBanner1,
  defaultBanner2,
}: {
  readonly profile: ApiIdentity;
  readonly profileLabel: string;
  readonly defaultBanner1: string;
  readonly defaultBanner2: string;
}) {
  const wrapperClass =
    "tw-relative tw-z-10 tw-inline-flex tw-flex-shrink-0 tw-rounded-xl tw-bg-black tw-p-1 tw-shadow-xl tw-ring-1 tw-ring-white/15";

  if (profile.pfp) {
    return (
      <div className={wrapperClass}>
        <Image
          unoptimized
          src={getScaledImageUri(profile.pfp, ImageScale.W_200_H_200)}
          alt={getUserProfileHeaderMessage("user.profileHeader.pfp.alt", {
            name: profileLabel,
          })}
          width="128"
          height="128"
          className="tw-size-24 tw-rounded-lg tw-bg-iron-800 tw-object-cover sm:tw-size-32"
        />
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <div
        aria-hidden="true"
        className="tw-size-24 tw-rounded-lg sm:tw-size-32"
        style={{
          background: `linear-gradient(45deg, ${defaultBanner1} 0%, ${defaultBanner2} 100%)`,
        }}
      />
    </div>
  );
}
