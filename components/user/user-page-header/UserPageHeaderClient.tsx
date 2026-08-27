"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useContext, useMemo, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import ButtonLink from "@/components/utils/button/ButtonLink";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { amIUser } from "@/helpers/Helpers";
import { navigateToDirectMessage } from "@/helpers/navigation.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { createDirectMessageWave } from "@/helpers/waves/waves.helpers";
import { getBannerColorValue } from "@/helpers/profile-banner.helpers";
import { useProfileBlockState } from "@/hooks/content-moderation/useProfileBlockState";
import { usePublicProfileModerationStatus } from "@/hooks/content-moderation/usePublicProfileModerationStatus";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useIdentity } from "@/hooks/useIdentity";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { faSliders } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserFollowBtn from "../utils/UserFollowBtn";
import WebsiteIcon from "../utils/icons/WebsiteIcon";
import UserPageHeaderAbout from "./about/UserPageHeaderAbout";
import UserPageHeaderBanner from "./banner/UserPageHeaderBanner";
import UserPageHeaderName from "./name/UserPageHeaderName";
import UserPageHeaderPfp from "./pfp/UserPageHeaderPfp";
import UserPageHeaderPfpWrapper from "./pfp/UserPageHeaderPfpWrapper";
import UserPageHeaderStats from "./stats/UserPageHeaderStats";
import UserPageHeaderSubscriptionStatus from "./UserPageHeaderSubscriptionStatus";
import UserPageHeaderEditProfile from "./UserPageHeaderEditProfile";
import BlockedProfileHeaderIndicator from "./BlockedProfileHeaderIndicator";
import ProfileBlockActionMenu from "./ProfileBlockActionMenu";
import SuspendedProfileHeaderIndicator from "./SuspendedProfileHeaderIndicator";
import {
  getUserProfileHeaderDisplayName,
  getUserProfileHeaderMessage,
} from "./user-page-header.messages";
import {
  USER_PAGE_HEADER_INTERACTIVE_SURFACE_CLASS,
  USER_PAGE_HEADER_SURFACE_CLASS,
} from "./user-page-header-surface";

type Props = {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly fallbackMainAddress: string;
  readonly defaultBanner1: string;
  readonly defaultBanner2: string;
  readonly initialStatements: CicStatement[];
  readonly profileEnabledAt: string | null;
  readonly followersCount: number | null;
  readonly cmsWebsiteHref?: string | null | undefined;
};

const PROFILE_PREFERENCES_BUTTON_KEY = "profilePreferences.button";

export default function UserPageHeaderClient({
  profile: initialProfile,
  handleOrWallet,
  fallbackMainAddress,
  defaultBanner1,
  defaultBanner2,
  initialStatements,
  profileEnabledAt,
  followersCount,
  cmsWebsiteHref,
}: Readonly<Props>) {
  const params = useParams();
  const router = useRouter();
  const { hasTouchScreen, isApp } = useDeviceInfo();
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
  const locale = DEFAULT_LOCALE;

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

  const profileLabel = useMemo(
    () => getUserProfileHeaderDisplayName(profile, mainAddress),
    [profile, mainAddress]
  );

  const [directMessageLoading, setDirectMessageLoading] =
    useState<boolean>(false);
  const [profileBlockConfirmation, setProfileBlockConfirmation] = useState<
    "block" | "unblock" | null
  >(null);

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
  const canInlineEdit = canEdit && !hasTouchScreen;

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

  const websiteAction =
    cmsWebsiteHref && profile.handle
      ? { href: cmsWebsiteHref, handle: profile.handle }
      : null;
  const followHandle =
    !isMyProfile && profile.handle && connectedProfile?.handle
      ? profile.handle
      : null;
  const profileBlockState = useProfileBlockState({
    profileId: profile.id,
    profileHandle: profile.handle,
    profilePfp: profile.pfp,
  });
  const profileModerationStatus = usePublicProfileModerationStatus(profile.id);
  const canManageProfilePreferences = isMyProfile && !activeProfileProxy;
  const showSubscriptionStatus = canManageProfilePreferences;

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
      const errorMessage = getToastErrorDetails(error);
      setToast({
        type: "error",
        title: getUserProfileHeaderMessage(
          "user.profileHeader.dm.createFailed.title"
        ),
        description:
          errorMessage ??
          getUserProfileHeaderMessage(
            "user.profileHeader.dm.createFailed.description"
          ),
      });
    } finally {
      setDirectMessageLoading(false);
    }
  };

  const isProfileBlockMutationPending =
    profileBlockState.isBlocking || profileBlockState.isUnblocking;
  const closeProfileBlockConfirmation = () => {
    if (!isProfileBlockMutationPending) {
      setProfileBlockConfirmation(null);
    }
  };
  const confirmProfileBlockChange = async () => {
    if (!profileBlockConfirmation) {
      return;
    }
    try {
      if (profileBlockConfirmation === "block") {
        await profileBlockState.block();
      } else {
        await profileBlockState.unblock();
      }
      setProfileBlockConfirmation(null);
    } catch {
      // The hook restores the previous state and reports the request failure.
    }
  };
  const confirmationProfileLabel = profile.handle
    ? `@${profile.handle}`
    : profileLabel;

  return (
    <div className="tailwind-scope">
      <section
        aria-labelledby="profile-heading"
        className="tw-relative tw-bg-black tw-pb-4 md:tw-pb-8"
      >
        <div className="tw-relative tw-w-full">
          <UserPageHeaderBanner
            profile={profile}
            defaultBanner1={banner1Color}
            defaultBanner2={banner2Color}
            canEdit={canInlineEdit}
            profileLabel={profileLabel}
          />
          {canEdit || canManageProfilePreferences ? (
            <div
              className={`tw-absolute tw-right-4 tw-top-3 tw-z-20 tw-flex tw-items-center tw-gap-1 sm:tw-right-6 sm:tw-top-4 md:tw-right-8 ${
                hasTouchScreen ? "" : "sm:tw-hidden"
              }`}
            >
              {canEdit ? (
                <UserPageHeaderEditProfile
                  profile={profile}
                  statement={aboutStatement}
                  defaultBanner1={banner1Color}
                  defaultBanner2={banner2Color}
                />
              ) : null}
              {canManageProfilePreferences ? (
                <ButtonLink
                  variant="tertiary"
                  size={null}
                  href="/preferences"
                  aria-label={t(locale, PROFILE_PREFERENCES_BUTTON_KEY)}
                  title={t(locale, PROFILE_PREFERENCES_BUTTON_KEY)}
                  className="tw-group tw-size-11 !tw-rounded-full !tw-border-transparent !tw-bg-transparent !tw-p-1 !tw-shadow-none focus-visible:!tw-outline-none active:!tw-bg-transparent desktop-hover:hover:!tw-border-transparent desktop-hover:hover:!tw-bg-transparent sm:tw-size-10 sm:!tw-p-0.5 min-[840px]:tw-hidden"
                >
                  <span className="tw-box-border tw-inline-flex tw-size-9 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-black/75 tw-text-iron-100 tw-shadow-[0_8px_24px_rgba(0,0,0,0.32)] tw-transition-[background-color,border-color,color,transform] tw-duration-200 tw-ease-out group-focus-visible:tw-ring-2 group-focus-visible:tw-ring-primary-400 group-focus-visible:tw-ring-offset-2 group-focus-visible:tw-ring-offset-black group-active:tw-scale-95 group-active:tw-bg-black desktop-hover:group-hover:tw-border-white/25 desktop-hover:group-hover:tw-bg-black/90 desktop-hover:group-hover:tw-text-white motion-reduce:tw-transform-none motion-reduce:tw-transition-none">
                    <FontAwesomeIcon
                      icon={faSliders}
                      className="tw-size-[1.125rem]"
                      aria-hidden="true"
                    />
                  </span>
                </ButtonLink>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="tw-relative tw-z-20 tw-bg-black md:tw-pointer-events-none md:-tw-mt-[164px] md:tw-bg-transparent">
          <div className="tw-relative tw-z-10 tw-px-4 sm:tw-px-6 md:tw-px-8">
            <div className="tw-mb-6 tw-flex tw-flex-col tw-items-start tw-gap-5 md:tw-flex-row md:tw-items-end lg:tw-mb-8 lg:tw-mt-8">
              <div className="tw-relative -tw-mt-10 tw-flex-shrink-0 sm:-tw-mb-2 sm:-tw-mt-[58px] md:tw-pointer-events-auto md:tw-mb-0 md:tw-mt-0">
                <UserPageHeaderPfpWrapper
                  profile={profile}
                  canEdit={canInlineEdit}
                  profileLabel={profileLabel}
                >
                  <UserPageHeaderPfp
                    profile={profile}
                    profileLabel={profileLabel}
                    defaultBanner1={banner1Color}
                    defaultBanner2={banner2Color}
                  />
                </UserPageHeaderPfpWrapper>
              </div>

              <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-start tw-gap-6 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between md:tw-flex-1 min-[840px]:tw-gap-2 lg:tw-gap-6">
                <div className="tw-flex tw-min-w-0 tw-flex-col md:tw-pointer-events-auto">
                  <UserPageHeaderName
                    profile={profile}
                    canEdit={canInlineEdit}
                    mainAddress={mainAddress}
                    level={profile.level}
                    profileEnabledAt={profileEnabledAt}
                    variant="title"
                    titleAccessory={
                      profileModerationStatus.isSuspended ||
                      profileBlockState.isBlocked ? (
                        <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-2">
                          {profileModerationStatus.isSuspended && (
                            <SuspendedProfileHeaderIndicator />
                          )}
                          {profileBlockState.isBlocked && (
                            <BlockedProfileHeaderIndicator />
                          )}
                        </span>
                      ) : undefined
                    }
                  />
                  <div className="tw-mt-2 sm:tw-mt-1.5">
                    <UserPageHeaderName
                      profile={profile}
                      canEdit={canInlineEdit}
                      mainAddress={mainAddress}
                      level={profile.level}
                      profileEnabledAt={profileEnabledAt}
                      variant="meta"
                    />
                  </div>
                </div>

                {canManageProfilePreferences && !hasTouchScreen ? (
                  <div className="tw-hidden tw-flex-none sm:tw-block md:tw-pointer-events-auto min-[840px]:tw-hidden">
                    <ButtonLink
                      variant="tertiary"
                      size="sm"
                      href="/preferences"
                      aria-label={t(locale, PROFILE_PREFERENCES_BUTTON_KEY)}
                      className={`${USER_PAGE_HEADER_SURFACE_CLASS} ${USER_PAGE_HEADER_INTERACTIVE_SURFACE_CLASS}`}
                    >
                      <FontAwesomeIcon
                        icon={faSliders}
                        className="tw-size-4"
                        aria-hidden="true"
                      />
                      <span>{t(locale, PROFILE_PREFERENCES_BUTTON_KEY)}</span>
                    </ButtonLink>
                  </div>
                ) : null}

                {websiteAction || followHandle || showSubscriptionStatus ? (
                  <div
                    className={`tw-w-full tw-flex-shrink-0 tw-flex-col tw-items-stretch tw-gap-2 sm:tw-w-auto sm:tw-flex-row sm:tw-items-center md:tw-pointer-events-auto ${
                      websiteAction || followHandle
                        ? "tw-flex"
                        : "tw-hidden min-[840px]:tw-flex"
                    }`}
                  >
                    {canManageProfilePreferences ? (
                      <div className="tw-hidden tw-flex-col tw-items-end tw-gap-4 min-[840px]:tw-flex min-[840px]:tw-w-auto">
                        <ButtonLink
                          variant="tertiary"
                          size="sm"
                          href="/preferences"
                          aria-label={t(locale, PROFILE_PREFERENCES_BUTTON_KEY)}
                          className={`${USER_PAGE_HEADER_SURFACE_CLASS} ${USER_PAGE_HEADER_INTERACTIVE_SURFACE_CLASS}`}
                        >
                          <FontAwesomeIcon
                            icon={faSliders}
                            className="tw-size-4"
                            aria-hidden="true"
                          />
                          <span>
                            {t(locale, PROFILE_PREFERENCES_BUTTON_KEY)}
                          </span>
                        </ButtonLink>
                        <div className="tw-hidden lg:tw-block">
                          <UserPageHeaderSubscriptionStatus
                            profile={profile}
                            layout="subtle"
                          />
                        </div>
                      </div>
                    ) : null}
                    {websiteAction ? (
                      <ButtonLink
                        variant="secondary"
                        href={websiteAction.href}
                        aria-label={t(locale, "profileCms.header.openWebsite", {
                          handle: websiteAction.handle,
                        })}
                      >
                        <WebsiteIcon />
                        <span>{t(locale, "profileCms.header.website")}</span>
                      </ButtonLink>
                    ) : null}
                    {followHandle ? (
                      <UserFollowBtn
                        handle={followHandle}
                        blocked={profileBlockState.isBlocked}
                        blockStateLoading={
                          profileBlockState.isLoading ||
                          profileBlockState.isBlocking
                        }
                        showFollowButton
                        showMuteButton={false}
                        unblockPending={profileBlockState.isUnblocking}
                        onUnblock={() => setProfileBlockConfirmation("unblock")}
                        onDirectMessage={
                          profile.primary_wallet
                            ? () =>
                                handleCreateDirectMessage(
                                  profile.primary_wallet
                                )
                            : undefined
                        }
                        directMessageLoading={directMessageLoading}
                      />
                    ) : null}
                    {followHandle &&
                    profileBlockState.canManage &&
                    !profileBlockState.isBlocked ? (
                      <ProfileBlockActionMenu
                        handle={followHandle}
                        disabled={
                          profileBlockState.isLoading ||
                          profileBlockState.isBlocking
                        }
                        onBlock={() => setProfileBlockConfirmation("block")}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {showSubscriptionStatus ? (
              <div className="md:tw-pointer-events-auto lg:tw-hidden">
                <UserPageHeaderSubscriptionStatus
                  profile={profile}
                  layout="wide-row"
                />
              </div>
            ) : null}

            {showAbout ? (
              <div className="md:tw-pointer-events-auto">
                <UserPageHeaderAbout
                  profile={profile}
                  statement={aboutStatement}
                  canEdit={canInlineEdit}
                />
              </div>
            ) : null}

            <div className="tw-mt-4 tw-flex tw-items-center md:tw-pointer-events-auto">
              <UserPageHeaderStats
                profile={profile}
                handleOrWallet={normalizedHandleOrWallet}
                followersCount={followersCount}
              />
            </div>
          </div>
        </div>
      </section>
      <MobileWrapperConfirmationDialog
        isOpen={profileBlockConfirmation !== null}
        onClose={closeProfileBlockConfirmation}
        onConfirm={() => void confirmProfileBlockChange()}
        title={
          profileBlockConfirmation === "block"
            ? t(locale, "contentModeration.block.confirmTitle", {
                profile: confirmationProfileLabel,
              })
            : t(locale, "contentModeration.unblock.confirmTitle", {
                profile: confirmationProfileLabel,
              })
        }
        message={
          profileBlockConfirmation === "block"
            ? t(locale, "contentModeration.report.blockDescription")
            : t(locale, "contentModeration.unblock.confirmDescription")
        }
        confirmText={
          profileBlockConfirmation === "block"
            ? t(locale, "contentModeration.actions.blockProfile")
            : t(locale, "contentModeration.actions.unblock")
        }
        cancelText={t(locale, "contentModeration.report.cancel")}
        isConfirming={isProfileBlockMutationPending}
        confirmVariant={
          profileBlockConfirmation === "block" ? "destructive" : "primary"
        }
      />
    </div>
  );
}
