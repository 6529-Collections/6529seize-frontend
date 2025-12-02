"use client"

import DropPfp from "@/components/drops/create/utils/DropPfp";
import { cicToType, formatNumberWithCommasOrDash } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { useIdentityBalance } from "@/hooks/useIdentityBalance";
import UserFollowBtn, {
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import UserCICAndLevel, { UserCICAndLevelSize } from "../UserCICAndLevel";
import UserProfileTooltipTopRep from "./UserProfileTooltipTopRep";
import {
  ApiProfileRepRatesState,
  CLASSIFICATIONS,
  CicStatement,
} from "@/entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/components/auth/Auth";

export default function UserProfileTooltip({
  user,
}: {
  readonly user: string;
}) {
  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile: null,
  });

  const { data: balance } = useIdentityBalance({
    consolidationKey: profile?.consolidation_key ?? null,
  });

  const { data: repRates } = useQuery<ApiProfileRepRatesState>({
    queryKey: [
      QueryKey.PROFILE_REP_RATINGS,
      { handleOrWallet: user.toLowerCase() },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileRepRatesState>({
        endpoint: `profiles/${user}/rep/ratings/received`,
      }),
    enabled: !!user && !!profile?.handle,
  });

  const { data: statements } = useQuery<CicStatement[]>({
    queryKey: [QueryKey.PROFILE_CIC_STATEMENTS, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<CicStatement[]>({
        endpoint: `profiles/${user}/cic/statements`,
      }),
    enabled: !!user && !!profile?.handle,
  });

  const [aboutStatement, setAboutStatement] = useState<CicStatement | null>(
    null
  );

  useEffect(() => {
    const about = statements?.find(
      (statement) =>
        statement.statement_type === STATEMENT_TYPE.BIO &&
        statement.statement_group === STATEMENT_GROUP.GENERAL
    );
    setAboutStatement(about ?? null);
  }, [statements]);

  const description = profile?.classification
    ? CLASSIFICATIONS[profile.classification]?.title
    : null;

  const { connectedProfile } = useContext(AuthContext);
  const profileHandle = profile?.handle ?? null;
  const normalizedProfileHandle = useMemo(
    () => profileHandle?.toLowerCase() ?? null,
    [profileHandle]
  );
  const normalizedConnectedHandle = useMemo(
    () => connectedProfile?.handle?.toLowerCase() ?? null,
    [connectedProfile?.handle]
  );
  const showFollowButton = Boolean(
    normalizedProfileHandle &&
      normalizedProfileHandle !== normalizedConnectedHandle
  );

  return (
    <div className="tailwind-scope tw-bg-iron-950 tw-min-w-[280px] tw-max-w-[320px]">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-3">
        <div className="tw-flex tw-flex-col tw-gap-2 tw-flex-1 tw-min-w-0">
          <div className="tw-flex-shrink-0">
            <DropPfp pfpUrl={profile?.pfp} />
          </div>
          <div className="tw-flex tw-flex-col tw-min-w-0">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <span className="tw-text-base tw-font-bold tw-text-iron-50 tw-truncate tw-max-w-[180px]">
                {profile?.handle ?? profile?.display}
              </span>
              {profile && (
                <UserCICAndLevel
                  level={profile.level}
                  cicType={cicToType(profile.cic)}
                  size={UserCICAndLevelSize.MEDIUM}
                />
              )}
            </div>
            {description && (
              <p className="tw-text-xs tw-text-iron-400 tw-mb-0">{description}</p>
            )}
          </div>
        </div>
        {showFollowButton && profileHandle && (
          <div className="tw-flex-shrink-0">
            <UserFollowBtn
              handle={profileHandle}
              size={UserFollowBtnSize.SMALL}
            />
          </div>
        )}
      </div>
      {aboutStatement && (
        <p className="tw-text-sm tw-text-iron-200 tw-line-clamp-2 tw-mb-0 tw-mt-4">
          {aboutStatement.statement_value}
        </p>
      )}
      <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-1.5 tw-mt-4">
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
            {formatNumberWithCommasOrDash(profile?.tdh ?? 0)}
          </span>
          <span className="tw-text-sm tw-text-iron-400">TDH</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
            {formatNumberWithCommasOrDash(profile?.tdh_rate ?? 0)}
          </span>
          <span className="tw-text-sm tw-text-iron-400">TDH Rate</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
            {formatNumberWithCommasOrDash(profile?.rep ?? 0)}
          </span>
          <span className="tw-text-sm tw-text-iron-400">REP</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
            {formatNumberWithCommasOrDash(profile?.cic ?? 0)}
          </span>
          <span className="tw-text-sm tw-text-iron-400">NIC</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
            {formatNumberWithCommasOrDash(balance?.total_balance ?? 0)}
          </span>
          <span className="tw-text-sm tw-text-iron-400">Balance</span>
        </div>
      </div>
      <UserProfileTooltipTopRep repRates={repRates} />
    </div>
  );
}
