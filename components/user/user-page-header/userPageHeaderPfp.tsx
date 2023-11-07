import { IProfileAndConsolidations } from "../../../entities/IProfile";
import Image from "next/image";

export default function UserPageHeaderPfp({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  if (profile.profile?.pfp_url) {
    return (
      <Image
        src={profile.profile.pfp_url}
        alt="Profile picture"
        width="176"
        height="176"
        className="tw-flex-shrink-0 tw-object-contain tw-max-h-44 tw-min-w-44 tw-w-auto tw-h-auto tw-rounded-lg tw-ring-[3px] tw-ring-white/30 tw-bg-neutral-800"
      />
    );
  }
  return (
    <div className="tw-flex-shrink-0 tw-h-44 tw-w-44 tw-rounded-lg tw-ring-[3px] tw-ring-white/30 tw-bg-neutral-800"></div>
  );
}
