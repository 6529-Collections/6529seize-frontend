import { useRouter } from "next/router";
import UserPageIdentityRateButton from "../../rate/UserPageIdentityRateButton";
import UserCICAccurateIcon from "../../utils/user-cic-type/UserCICAccurateIcon";
import UserCICInaccurateIcon from "../../utils/user-cic-type/UserCICInaccurateIcon";
import UserCICUnknownIcon from "../../utils/user-cic-type/UserCICUnknownIcon";

import {
  CICType,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useEffect, useState } from "react";
import { cicToType, formatNumberWithCommas } from "../../../../helpers/Helpers";
import UserCICTypeIcon from "../../utils/user-cic-type/UserCICTypeIcon";
import UserCICStatus from "../../utils/user-cic-status/UserCICStatus";
import UserPageIdentityHeaderCIC from "./UserPageIdentityHeaderCIC";
import UserPageIdentityHeaderCICRate from "./UserPageIdentityHeaderCICRate";

export default function UserPageIdentityHeader() {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const {
    isLoading,
    isError,
    data: profile,
    error,
  } = useQuery<IProfileAndConsolidations>({
    queryKey: ["profile", user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `/profiles/${user}`,
      }),
    enabled: !!user,
  });

  return (
    <div>
      <div className="tw-mt-8 lg:tw-flex lg:tw-items-center tw-lg:justify-between">
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-col">
            <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-white tw-sm:truncate sm:tw-text-2xl sm:tw-tracking-tight">
              Community Identity Check (CIC)
            </h2>
            <p className="tw-font-normal tw-text-neutral-400 tw-text-base tw-mb-0">
              Does the community believe this profile accurately represents its
              identity?
            </p>
          </div>
          {profile && <UserPageIdentityHeaderCIC profile={profile} />}
          {profile && <UserPageIdentityHeaderCICRate profile={profile} />}
        </div>
      </div>
    </div>
  );
}
