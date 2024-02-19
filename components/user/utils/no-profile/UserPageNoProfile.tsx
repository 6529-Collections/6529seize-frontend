import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { useAccount } from "wagmi";
import { amIUser } from "../../../../helpers/Helpers";
import UserPageSetUpProfile from "./set-up-profile/UserPageSetUpProfile";

export default function UserPageIdentityNoProfile({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const { address } = useAccount();
  const user = (router.query.user as string).toLowerCase();

  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  if (isMyProfile) {
    return <UserPageSetUpProfile profile={profile} />;
  }

  return (
    <div className="tw-mt-6 tw-inline-flex tw-items-center tw-rounded-lg tw-bg-white/5 tw-border tw-border-solid tw-border-white/10 tw-px-4 tw-py-3">
      <div className="tw-flex tw-items-center">
        <svg
          className="tw-flex-shrink-0 tw-self-center tw-w-5 tw-h-5 tw-text-iron-400"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="tw-ml-3 tw-self-center">
          <h3 className="tw-text-sm tw-mb-0 tw-font-semibold tw-text-iron-400">
            Address{" "}
            <span className="tw-break-all tw-font-semibold tw-text-iron-100">
              {user}
            </span>{" "}
            have not set up profile yet.
          </h3>
        </div>
      </div>
    </div>
  );
}
