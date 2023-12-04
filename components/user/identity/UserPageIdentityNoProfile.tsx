import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useAccount } from "wagmi";
import { amIUser } from "../../../helpers/Helpers";

export default function UserPageIdentityNoProfile({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const { address } = useAccount();
  const { user } = router.query;

  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  const goToSettings = () => {
    router.push(`/${user}/settings`);
  };

  if (isMyProfile) {
    return (
      <div className="tw-mt-6 tw-text-base tw-text-neutral-300 tw-font-normal">
        You have not set up your profile yet, to set up your profile click{" "}
        <span
          onClick={goToSettings}
          className="tw-cursor-pointer tw-font-semibold tw-text-neutral-100 tw-underline hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
        >
          here.
        </span>
      </div>
    );
  }

  return (
    <div className="tw-mt-6 tw-text-base tw-text-neutral-300 tw-font-normal">
      Address{" "}
      <span className="tw-font-semibold tw-text-neutral-100">{user}</span> have
      not set up profile yet.
    </div>
  );
}
