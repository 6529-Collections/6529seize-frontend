import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import Image from "next/image";

export default function UserPageHeaderPfp({
  profile,
  defaultBanner1,
  defaultBanner2,
  canEdit,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly defaultBanner1: string;
  readonly defaultBanner2: string;
  readonly canEdit: boolean;
}) {
  if (profile.profile?.pfp_url) {
    return (
      <Image
        src={profile.profile.pfp_url}
        alt="Profile picture"
        width="176"
        height="176"
        className="tw-flex-shrink-0 tw-object-contain tw-max-h-36 sm:tw-max-h-44 tw-w-auto tw-h-auto tw-rounded-lg tw-ring-[3px] tw-ring-white/30 tw-bg-iron-800"
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
