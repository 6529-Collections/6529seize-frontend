import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/Auth";
import UserFollowBtn, {
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import DropPfp from "@/components/drops/create/utils/DropPfp";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import type {
  ApiProfileRepRatesState,
  CicStatement,
} from "@/entities/IProfile";
import { CLASSIFICATIONS } from "@/entities/IProfile";
import type { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { navigateToDirectMessage } from "@/helpers/navigation.helpers";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { createDirectMessageWave } from "@/helpers/waves/waves.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useIdentity } from "@/hooks/useIdentity";
import type { ArtistPreviewTab } from "@/hooks/useArtistPreviewModal";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

import UserCICAndLevel, { UserCICAndLevelSize } from "../UserCICAndLevel";
import UserStatsRow, { UserStatsRowSize } from "../stats/UserStatsRow";
import UserProfileTooltipTopRep from "./UserProfileTooltipTopRep";

interface UserProfileTooltipProps {
  readonly user: string;
  readonly onArtistPreviewOpen?:
    | ((params: {
        readonly user: ApiProfileMin;
        readonly initialTab: ArtistPreviewTab;
      }) => void)
    | undefined;
  readonly onWaveCreatorPreviewOpen?:
    | ((user: ApiProfileMin) => void)
    | undefined;
}

export default function UserProfileTooltip({
  user,
  onArtistPreviewOpen,
  onWaveCreatorPreviewOpen,
}: UserProfileTooltipProps) {
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile: null,
  });
  const profileId = profile?.id ?? null;

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

  const { data: followersData } =
    useQuery<ApiIncomingIdentitySubscriptionsPage>({
      queryKey: [
        QueryKey.IDENTITY_FOLLOWERS,
        { profile_id: profileId, page_size: 1 },
      ],
      queryFn: async () => {
        if (!profileId) {
          throw new Error("Profile id is required");
        }

        return await commonApiFetch<ApiIncomingIdentitySubscriptionsPage>({
          endpoint: `identity-subscriptions/incoming/IDENTITY/${profileId}`,
          params: { page_size: "1" },
        });
      },
      enabled: !!profileId,
    });

  const followersCount = followersData?.count ?? 0;

  const aboutStatement = useMemo(
    () =>
      statements?.find(
        (statement) =>
          statement.statement_type === STATEMENT_TYPE.BIO &&
          statement.statement_group === STATEMENT_GROUP.GENERAL
      ) ?? null,
    [statements]
  );
  const [directMessageLoading, setDirectMessageLoading] = useState(false);

  const description =
    profile?.classification === undefined
      ? null
      : CLASSIFICATIONS[profile.classification].title;

  const { connectedProfile, activeProfileProxy, setToast } = useAuth();
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
  const tooltipInstanceId = useId();
  const badgesTooltipIdPrefix = useMemo(
    () =>
      `user-profile-tooltip-author-badges-${tooltipInstanceId.replaceAll(":", "")}`,
    [tooltipInstanceId]
  );

  const handleCreateDirectMessage = async (
    primaryWallet: string | undefined
  ) => {
    if (!primaryWallet) {
      return;
    }

    setDirectMessageLoading(true);

    try {
      const wave = await createDirectMessageWave({
        addresses: [primaryWallet],
      });
      navigateToDirectMessage({ waveId: wave.id, router, isApp });
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error
          ? `Failed to create direct message: ${error.message}`
          : "Failed to create direct message. Please try again.";
      setToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setDirectMessageLoading(false);
    }
  };

  return (
    <div className="tailwind-scope tw-min-w-[280px] tw-max-w-[320px] tw-bg-iron-950">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-3">
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-2">
          <div className="tw-flex-shrink-0">
            <DropPfp pfpUrl={profile?.pfp} />
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-col">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <span className="tw-max-w-[180px] tw-truncate tw-text-base tw-font-bold tw-text-iron-50">
                {profile?.handle ?? profile?.display}
              </span>
              {profile && (
                <UserCICAndLevel
                  level={profile.level}
                  size={UserCICAndLevelSize.SMALL}
                />
              )}
              {profile && (
                <DropAuthorBadges
                  profile={profile}
                  tooltipIdPrefix={badgesTooltipIdPrefix}
                  onArtistPreviewOpen={onArtistPreviewOpen}
                  onWaveCreatorPreviewOpen={onWaveCreatorPreviewOpen}
                />
              )}
            </div>
            {description && (
              <p className="tw-mb-0 tw-text-xs tw-text-iron-400">
                {description}
              </p>
            )}
          </div>
        </div>
        {showFollowButton && profileHandle && (
          <div className="tw-flex-shrink-0">
            <UserFollowBtn
              handle={profileHandle}
              size={UserFollowBtnSize.SMALL}
              onDirectMessage={
                connectedProfile?.handle &&
                !activeProfileProxy &&
                profile?.primary_wallet
                  ? () => handleCreateDirectMessage(profile.primary_wallet)
                  : undefined
              }
              directMessageLoading={directMessageLoading}
            />
          </div>
        )}
      </div>
      {aboutStatement && (
        <p className="tw-mb-0 tw-mt-4 tw-line-clamp-2 tw-text-sm tw-text-iron-200">
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
