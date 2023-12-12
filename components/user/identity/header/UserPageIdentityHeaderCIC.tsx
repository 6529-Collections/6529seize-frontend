import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { amIUser, formatNumberWithCommas } from "../../../../helpers/Helpers";
import UserCICTypeIcon from "../../utils/user-cic-type/UserCICTypeIcon";
import UserCICStatus from "../../utils/user-cic-status/UserCICStatus";
import { useAccount } from "wagmi";

export default function UserPageIdentityHeaderCIC({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const [cicRating, setCicRating] = useState<number>(profile.cic.cic_rating);
  const [cicRaters, setCicRaters] = useState<number>(
    profile.cic.contributor_count
  );

  useEffect(() => {
    setCicRating(profile.cic.cic_rating);
    setCicRaters(profile.cic.contributor_count);
  }, [profile]);

  const { address } = useAccount();
  const [isMyProfile, setIsMyProfile] = useState<boolean>(true);
  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );
  return (
    <div
      className={`${
        isMyProfile ? "" : "tw-mb-6"
      } tw-mt-4 tw-flex tw-flex-col sm:tw-flex-row sm:tw-flex-wrap sm:tw-space-x-6 tw-gap-y-1`}
    >
      <div className="tw-flex tw-items-center tw-text-base tw-font-semibold tw-text-iron-200">
        <div className="tw-flex tw items-center tw-space-x-1">
          <span>CIC:</span>
          <span>{formatNumberWithCommas(cicRating)}</span>
        </div>
        <span className="tw-ml-2 -tw-mt-1.5 tw-h-5 tw-w-5">
          <UserCICTypeIcon profile={profile} />
        </span>
      </div>
      <div className="tw-flex tw-items-center tw-text-base tw-font-semibold tw-text-iron-200 tw-space-x-1">
        <span>Status:</span>
        <UserCICStatus cic={cicRating} />
      </div>
      <div className="tw-flex tw-items-center tw-text-base tw-font-semibold tw-text-iron-200 tw-space-x-1">
        <span>Raters:</span>
        <span>{formatNumberWithCommas(cicRaters)}</span>
      </div>
    </div>
  );
}
