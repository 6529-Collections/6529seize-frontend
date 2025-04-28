import { useEffect, useState } from "react";
import { ApiIdentity } from "../../../../generated/models/ApiIdentity";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import UserCICTypeIconWrapper from "../../utils/user-cic-type/UserCICTypeIconWrapper";
import UserCICStatus from "../../utils/user-cic-status/UserCICStatus";

export default function UserPageIdentityHeaderCIC({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const [cicRating, setCicRating] = useState<number>(profile.cic);

  useEffect(() => {
    setCicRating(profile.cic);
  }, [profile]);

  return (
    <div className="tw-mb-6 tw-mt-4 tw-flex tw-flex-col sm:tw-flex-row sm:tw-flex-wrap sm:tw-space-x-6 tw-gap-y-1">
      <div className="tw-flex tw-items-center tw-text-base tw-font-medium tw-text-iron-300">
        <div className="tw-flex tw items-center tw-space-x-1">
          <span>NIC:</span>
          <span className="tw-text-iron-50 tw-font-semibold">
            {formatNumberWithCommas(cicRating)}
          </span>
        </div>
        <span className="tw-ml-2 tw-h-5 tw-w-5">
          <UserCICTypeIconWrapper profile={profile} />
        </span>
      </div>
      <div className="tw-flex tw-items-center tw-text-base tw-font-semibold tw-space-x-1">
        <span className="tw-text-iron-300 tw-font-medium">Status:</span>
        <UserCICStatus cic={cicRating} />
      </div>
    </div>
  );
}
