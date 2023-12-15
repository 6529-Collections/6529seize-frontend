import { useEffect, useState } from "react";
import {
  CICType,
  CIC_META,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import UserCICTypeIconTooltipHeaders from "./UserCICTypeIconTooltipHeaders";
import UserCICTypeIconTooltipRate from "./UserCICTypeIconTooltipRate";
import {
  amIUser,
  cicToType,
  formatNumberWithCommas,
} from "../../../../../helpers/Helpers";
import { useAccount } from "wagmi";

export default function UserCICTypeIconTooltip({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { address } = useAccount();
  const [isMyProfile, setIsMyProfile] = useState<boolean>(true);

  const [cicType, setCicType] = useState<CICType>(
    cicToType(profile.cic.cic_rating)
  );

  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  useEffect(() => {
    setCicType(cicToType(profile.cic.cic_rating));
  }, [profile]);

  return (
    <div className="tw-p-3">
      <UserCICTypeIconTooltipHeaders />
      <div className="tw-mt-4 tw-space-y-0.5">
        <span className="tw-block tw-text-iron-100 tw-font-semibold">
          <span>Rating:</span>
          <span className="tw-ml-1 tw-text-white tw-font-bold">
            {formatNumberWithCommas(profile.cic.cic_rating)}
          </span>
        </span>
        <span className="tw-block tw-text-iron-100 tw-font-semibold">
          <span>Status:</span>
          <span className={`${CIC_META[cicType].class} tw-ml-1 tw-font-bold`}>
            {CIC_META[cicType].title}
          </span>
        </span>
        <span className="tw-block tw-text-iron-100 tw-font-semibold">
          <span>Raters:</span>
          <span className="tw-ml-1 tw-font-bold tw-text-iron-100">
            {formatNumberWithCommas(profile.cic.contributor_count)}
          </span>
        </span>
      </div>
      {cicType === CICType.INACCURATE && (
        <div className="mt-2">
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400 tw-font-medium">
            This profile will lose its handle on Jan 4, 2024 at midnight UTC if
            its rating does not turn positive before then.
          </p>
        </div>
      )}
      {!isMyProfile && <UserCICTypeIconTooltipRate profile={profile} />}
    </div>
  );
}
