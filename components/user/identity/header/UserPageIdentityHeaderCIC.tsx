"use client";

import { useEffect, useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import UserCICTypeIconWrapper from "@/components/user/utils/user-cic-type/UserCICTypeIconWrapper";
import UserCICStatus from "@/components/user/utils/user-cic-status/UserCICStatus";

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
    <div className="tw-mb-8">
      <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.05em] tw-text-iron-500 tw-mb-2">
        NIC
      </div>
      <div className="tw-text-3xl tw-font-semibold tw-text-white tw-tracking-tight tw-leading-none">
        {formatNumberWithCommas(cicRating)}
      </div>
      <div className="tw-mt-3 tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-semibold tw-uppercase">
        <span className="tw-h-4 tw-w-4 tw-flex-shrink-0 -tw-mt-0.5">
          <UserCICTypeIconWrapper profile={profile} />
        </span>
        <UserCICStatus cic={cicRating} />
      </div>
    </div>
  );
}
