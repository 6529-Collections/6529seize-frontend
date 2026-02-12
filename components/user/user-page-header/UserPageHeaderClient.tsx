"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useContext, useMemo, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { amIUser } from "@/helpers/Helpers";
import { navigateToDirectMessage } from "@/helpers/navigation.helpers";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { createDirectMessageWave } from "@/helpers/waves/waves.helpers";
import { getBannerColorValue } from "@/helpers/profile-banner.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useIdentity } from "@/hooks/useIdentity";
import { useArtistPreviewModal } from "@/hooks/useArtistPreviewModal";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { ArtistPreviewModal } from "@/components/waves/drops/ArtistPreviewModal";
import UserFollowBtn from "../utils/UserFollowBtn";
import UserPageHeaderAbout from "./about/UserPageHeaderAbout";
import UserPageHeaderBanner from "./banner/UserPageHeaderBanner";
import UserPageHeaderName from "./name/UserPageHeaderName";
import UserPageHeaderPfp from "./pfp/UserPageHeaderPfp";
import UserPageHeaderPfpWrapper from "./pfp/UserPageHeaderPfpWrapper";
import UserPageHeaderStats from "./stats/UserPageHeaderStats";

type Props = {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly fallbackMainAddress: string;
  readonly defaultBanner1: string;
  readonly defaultBanner2: string;
  readonly initialStatements: CicStatement[];
  readonly profileEnabledAt: string | null;
  readonly followersCount: number | null;
};

export default function UserPageHeaderClient({
  profile: initialProfile,
  handleOrWallet,
  fallbackMainAddress,
  defaultBanner1,
  defaultBanner2,
  initialStatements,
  profileEnabledAt,
  followersCount,
}: Readonly<Props>) {
  const params = useParams();
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const routeHandleOrWallet = params["user"]?.toString().toLowerCase() ?? null;
  const normalizedHandleOrWallet =
    routeHandleOrWallet ?? handleOrWallet.toLowerCase();

  const { address } = useSeizeConnectContext();
  const { connectedProfile, activeProfileProxy, setToast } =
    useContext(AuthContext);

  const { profile: hydratedProfile } = useIdentity({
    handleOrWallet: normalizedHandleOrWallet,
    initialProfile,
  });

  const profile = useMemo(
    () => hydratedProfile ?? initialProfile,
    [hydratedProfile, initialProfile]
  );

  const banner1Color = getBannerColorValue(profile.banner1) ?? defaultBanner1;
  const banner2Color = getBannerColorValue(profile.banner2) ?? defaultBanner2;

  const mainAddress = useMemo(() => {
    const primaryWallet = profile.primary_wallet;
    if (primaryWallet) {
      return primaryWallet.toLowerCase();
    }
    return fallbackMainAddress.toLowerCase();
  }, [profile.primary_wallet, fallbackMainAddress]);

  const [directMessageLoading, setDirectMessageLoading] =
    useState<boolean>(false);

  const isMyProfile = useMemo(
    () =>
      amIUser({
        profile,
        address,
        connectedHandle: connectedProfile?.handle ?? undefined,
      }),
    [profile, address, connectedProfile?.handle]
  );

  const canEdit = useMemo(
    () => !!(profile.handle && isMyProfile && !activeProfileProxy),
    [profile.handle, isMyProfile, activeProfileProxy]
  );

  const { data: statements } = useQuery<CicStatement[]>({
    queryKey: [QueryKey.PROFILE_CIC_STATEMENTS, normalizedHandleOrWallet],
    queryFn: async () =>
      await commonApiFetch<CicStatement[]>({
        endpoint: `profiles/${normalizedHandleOrWallet}/cic/statements`,
      }),
    enabled: !!normalizedHandleOrWallet,
    initialData: initialStatements,
    staleTime: 60_000,
  });

  const findAboutStatement = (
    statementsList: CicStatement[] | null | undefined
  ): CicStatement | null =>
    statementsList?.find(
      (statement) =>
        statement.statement_type === STATEMENT_TYPE.BIO &&
        statement.statement_group === STATEMENT_GROUP.GENERAL
    ) ?? null;

  const aboutStatement = useMemo(
    () => findAboutStatement(statements),
    [statements]
  );

  const showAbout = useMemo(
    () => aboutStatement !== null || canEdit,
    [aboutStatement, canEdit]
  );

  const submissionCount = profile.active_main_stage_submission_ids?.length ?? 0;
  const winnerCount = profile.winner_main_stage_drop_ids?.length ?? 0;

  const {
    isModalOpen: isArtistPreviewOpen,
    modalInitialTab,
    handleBadgeClick: handleArtistBadgeClick,
    handleModalClose: handleArtistModalClose,
  } = useArtistPreviewModal();

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
    <div className="tailwind-scope">
      <section className="tw-relative tw-pb-6 md:tw-pb-8">
        <div className="tw-relative tw-w-full">
          <UserPageHeaderBanner
            profile={profile}
            defaultBanner1={banner1Color}
            defaultBanner2={banner2Color}
            canEdit={canEdit}
          />
        </div>

        <div className="tw-relative tw-bg-zinc-950">
          <div className="tw-relative tw-z-10 tw-px-6 md:tw-px-9">
            <div className="tw-flex tw-flex-wrap tw-justify-between tw-gap-x-4 md:tw-pt-2">
              <div className="tw-relative tw-order-1 -tw-mt-10 tw-flex-shrink-0 tw-self-start sm:-tw-mt-[58px]">
                <UserPageHeaderPfpWrapper profile={profile} canEdit={canEdit}>
                  <UserPageHeaderPfp
                    profile={profile}
                    defaultBanner1={banner1Color}
                    defaultBanner2={banner2Color}
                  />
                </UserPageHeaderPfpWrapper>
              </div>

              <div className="tw-order-3 tw-w-full tw-pt-2 md:tw-order-2 md:tw-w-auto md:tw-flex-1 md:tw-pt-1">
                <UserPageHeaderName
                  profile={profile}
                  canEdit={canEdit}
                  mainAddress={mainAddress}
                  level={profile.level}
                  profileEnabledAt={profileEnabledAt}
                  variant="title"
                  submissionCount={submissionCount}
                  winnerCount={winnerCount}
                  onBadgeClick={handleArtistBadgeClick}
                />
                <div className="tw-mt-2 sm:tw-mt-0.5">
                  <UserPageHeaderName
                    profile={profile}
                    canEdit={canEdit}
                    mainAddress={mainAddress}
                    level={profile.level}
                    profileEnabledAt={profileEnabledAt}
                    variant="meta"
                  />
                </div>
              </div>

              <div className="tw-order-2 tw-mb-2 tw-mt-2 tw-flex tw-items-center tw-gap-3 tw-self-start md:tw-order-3 md:tw-mb-0">
                {!isMyProfile && profile.handle && connectedProfile?.handle ? (
                  <UserFollowBtn
                    handle={profile.handle}
                    onDirectMessage={
                      profile.primary_wallet
                        ? () =>
                            handleCreateDirectMessage(profile.primary_wallet)
                        : undefined
                    }
                    directMessageLoading={directMessageLoading}
                  />
                ) : null}
              </div>
            </div>

            {showAbout ? (
              <div className="tw-mt-4">
                <UserPageHeaderAbout
                  profile={profile}
                  statement={aboutStatement}
                  canEdit={canEdit}
                />
              </div>
            ) : null}

            <div className="tw-mt-4 tw-flex tw-items-center tw-gap-4 tw-overflow-x-auto tw-border-b tw-border-white/5 sm:tw-overflow-visible sm:tw-border-b-0 sm:tw-pb-0">
              <UserPageHeaderStats
                profile={profile}
                handleOrWallet={normalizedHandleOrWallet}
                followersCount={followersCount}
              />
            </div>
          </div>
        </div>
      </section>

      {(submissionCount > 0 || winnerCount > 0) && (
        <ArtistPreviewModal
          isOpen={isArtistPreviewOpen}
          onClose={handleArtistModalClose}
          user={profile as unknown as ApiProfileMin}
          initialTab={modalInitialTab}
        />
      )}
    </div>
  );
}
