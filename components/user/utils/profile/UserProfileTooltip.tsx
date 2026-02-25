import { useQuery } from "@tanstack/react-query";
import { useContext, useEffect, useMemo, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import DropPfp from "@/components/drops/create/utils/DropPfp";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserFollowBtn, {
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import type {
  ApiProfileRepRatesState,
  CicStatement} from "@/entities/IProfile";
import {
  CLASSIFICATIONS
} from "@/entities/IProfile";
import type { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";

import UserStatsRow, { UserStatsRowSize } from "../stats/UserStatsRow";
import UserCICAndLevel, { UserCICAndLevelSize } from "../UserCICAndLevel";

import UserProfileTooltipTopRep from "./UserProfileTooltipTopRep";






export default function UserProfileTooltip({
  user,
}: {
  readonly user: string;
}) {
  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile: null,
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

  const { data: followersData } = useQuery<ApiIncomingIdentitySubscriptionsPage>({
    queryKey: [
      QueryKey.IDENTITY_FOLLOWERS,
      { profile_id: profile?.id, page_size: 1 },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiIncomingIdentitySubscriptionsPage>({
        endpoint: `identity-subscriptions/incoming/IDENTITY/${profile?.id}`,
        params: { page_size: "1" },
      }),
    enabled: !!profile?.id,
  });

  const followersCount = followersData?.count ?? 0;

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
                  size={UserCICAndLevelSize.SMALL}
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
      <div className="tw-mt-4">
        <UserStatsRow
          handle={profile?.handle ?? user}
          tdh={profile?.tdh ?? 0}
          tdh_rate={profile?.tdh_rate ?? 0}
          xtdh={profile?.xtdh ?? 0}
          xtdh_rate={profile?.xtdh_rate ?? 0}
          rep={profile?.rep ?? 0}
          cic={profile?.cic ?? 0}
          followersCount={followersCount}
          size={UserStatsRowSize.SMALL}
        />
      </div>
      <UserProfileTooltipTopRep repRates={repRates} />
    </div>
  );
}
