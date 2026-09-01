"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useContext, useMemo, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import ProfilePreferencesSettings from "@/components/header/ProfilePreferencesSettings";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import ButtonLink from "@/components/utils/button/ButtonLink";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { amIUser } from "@/helpers/Helpers";
import { navigateToDirectMessage } from "@/helpers/navigation.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { createDirectMessageWave } from "@/helpers/waves/waves.helpers";
import { getBannerColorValue } from "@/helpers/profile-banner.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useIdentity } from "@/hooks/useIdentity";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
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
const ABOUT_STATEMENT_TYPE: CicStatement["statement_type"] = STATEMENT_TYPE.BIO;

type WebsiteAction = Readonly<{
  href: string;
  handle: string;
}>;

function getAboutStatement(
  statements: CicStatement[] | null | undefined
): CicStatement | null {
  return (
    statements?.find(
      (statement) =>
        statement.statement_type === ABOUT_STATEMENT_TYPE &&
        statement.statement_group === STATEMENT_GROUP.GENERAL
    ) ?? null
  );
}

function ProfilePreferencesButton({
  onClick,
}: Readonly<{ onClick: () => void }>) {
  return (
    <Button
      variant="tertiary"
      size={null}
      onClick={onClick}
      aria-label={t(DEFAULT_LOCALE, PROFILE_PREFERENCES_BUTTON_KEY)}
      title={t(DEFAULT_LOCALE, PROFILE_PREFERENCES_BUTTON_KEY)}
      className={`tw-size-11 !tw-rounded-full !tw-p-0 ${USER_PAGE_HEADER_SURFACE_CLASS} ${USER_PAGE_HEADER_INTERACTIVE_SURFACE_CLASS}`}
    >
      <Cog6ToothIcon className="tw-size-5" aria-hidden="true" />
    </Button>
  );
}

type ProfileHeaderActionColumnProps = Readonly<{
  aboutStatement: CicStatement | null;
  banner1Color: string;
  banner2Color: string;
  canEdit: boolean;
  canManageProfilePreferences: boolean;
  directMessageLoading: boolean;
  followHandle: string | null;
  onCreateDirectMessage: (primaryWallet: string | undefined) => void;
  onOpenPreferences: () => void;
  profile: ApiIdentity;
  showSubscriptionStatus: boolean;
  websiteAction: WebsiteAction | null;
}>;

function ProfileHeaderActionColumn({
  aboutStatement,
  banner1Color,
  banner2Color,
  canEdit,
  canManageProfilePreferences,
  directMessageLoading,
  followHandle,
  onCreateDirectMessage,
  onOpenPreferences,
  profile,
  showSubscriptionStatus,
  websiteAction,
}: ProfileHeaderActionColumnProps) {
  if (
    !canEdit &&
    !canManageProfilePreferences &&
    !websiteAction &&
    !followHandle
  ) {
    return null;
  }

  const directMessageAction = profile.primary_wallet
    ? () => onCreateDirectMessage(profile.primary_wallet)
    : undefined;

  return (
    <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-start lg:tw-w-auto lg:tw-max-w-[36rem] lg:tw-justify-self-end">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 lg:tw-flex-none">
        {canEdit ? (
          <UserPageHeaderEditProfile
            profile={profile}
            statement={aboutStatement}
            defaultBanner1={banner1Color}
            defaultBanner2={banner2Color}
          />
        ) : null}
        {canManageProfilePreferences ? (
          <ProfilePreferencesButton onClick={onOpenPreferences} />
        ) : null}
        {websiteAction ? (
          <ButtonLink
            variant="secondary"
            href={websiteAction.href}
            aria-label={t(DEFAULT_LOCALE, "profileCms.header.openWebsite", {
              handle: websiteAction.handle,
            })}
          >
            <WebsiteIcon />
            <span>{t(DEFAULT_LOCALE, "profileCms.header.website")}</span>
          </ButtonLink>
        ) : null}
        {followHandle ? (
          <UserFollowBtn
            handle={followHandle}
            onDirectMessage={directMessageAction}
            directMessageLoading={directMessageLoading}
          />
        ) : null}
      </div>
      {showSubscriptionStatus ? (
        <div className="tw-min-w-0 tw-flex-1 lg:tw-flex-none lg:tw-pt-3">
          <UserPageHeaderSubscriptionStatus profile={profile} layout="header" />
        </div>
      ) : null}
    </div>
  );
}

type ProfileHeaderContentProps = Readonly<{
  aboutStatement: CicStatement | null;
  banner1Color: string;
  banner2Color: string;
  canEdit: boolean;
  canInlineEdit: boolean;
  canManageProfilePreferences: boolean;
  directMessageLoading: boolean;
  followHandle: string | null;
  followersCount: number | null;
  mainAddress: string;
  normalizedHandleOrWallet: string;
  onCreateDirectMessage: (primaryWallet: string | undefined) => void;
  onOpenPreferences: () => void;
  profile: ApiIdentity;
  profileEnabledAt: string | null;
  profileLabel: string;
  showAbout: boolean;
  showSubscriptionStatus: boolean;
  websiteAction: WebsiteAction | null;
}>;

function ProfileHeaderContent({
  aboutStatement,
  banner1Color,
  banner2Color,
  canEdit,
  canInlineEdit,
  canManageProfilePreferences,
  directMessageLoading,
  followHandle,
  followersCount,
  mainAddress,
  normalizedHandleOrWallet,
  onCreateDirectMessage,
  onOpenPreferences,
  profile,
  profileEnabledAt,
  profileLabel,
  showAbout,
  showSubscriptionStatus,
  websiteAction,
}: ProfileHeaderContentProps) {
  return (
    <div className="tw-relative tw-z-20 tw-bg-black">
      <div className="tw-relative tw-z-10 tw-px-4 sm:tw-px-6 md:tw-px-8">
        <div className="tw-relative tw-mb-6 tw-flex tw-flex-col tw-gap-3 sm:tw-mb-4 sm:tw-block sm:tw-pt-16 lg:tw-pl-[132px] lg:tw-pt-0">
          <div className="tw-relative -tw-mt-10 tw-flex-shrink-0 sm:tw-absolute sm:-tw-top-14 sm:tw-left-0 sm:tw-mt-0">
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

          <div className="tw-grid tw-min-w-0 tw-gap-4 sm:tw-pt-2 lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-gap-x-6 lg:tw-pt-1">
            <div className="tw-min-w-0 tw-pb-1 sm:tw-pb-2">
              <UserPageHeaderName
                profile={profile}
                canEdit={canInlineEdit}
                mainAddress={mainAddress}
                level={profile.level}
                profileEnabledAt={profileEnabledAt}
                variant="full"
              />
            </div>

            <ProfileHeaderActionColumn
              aboutStatement={aboutStatement}
              banner1Color={banner1Color}
              banner2Color={banner2Color}
              canEdit={canEdit}
              canManageProfilePreferences={canManageProfilePreferences}
              directMessageLoading={directMessageLoading}
              followHandle={followHandle}
              onCreateDirectMessage={onCreateDirectMessage}
              onOpenPreferences={onOpenPreferences}
              profile={profile}
              showSubscriptionStatus={showSubscriptionStatus}
              websiteAction={websiteAction}
            />
          </div>
        </div>

        {showAbout ? (
          <div className="lg:tw-pt-4">
            <UserPageHeaderAbout
              profile={profile}
              statement={aboutStatement}
              canEdit={canInlineEdit}
            />
          </div>
        ) : null}

        <div className="tw-mt-4 tw-flex tw-items-center sm:tw-mt-6 lg:tw-mt-4">
          <UserPageHeaderStats
            profile={profile}
            handleOrWallet={normalizedHandleOrWallet}
            followersCount={followersCount}
          />
        </div>
      </div>
    </div>
  );
}

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
  const [isProfilePreferencesOpen, setIsProfilePreferencesOpen] =
    useState(false);

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

  const aboutStatement = useMemo(
    () => getAboutStatement(statements),
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

  return (
    <div className="tailwind-scope">
      <section
        aria-labelledby="profile-heading"
        className="tw-relative tw-bg-black tw-pb-4 md:tw-pb-8"
      >
        <UserPageHeaderBanner
          profile={profile}
          defaultBanner1={banner1Color}
          defaultBanner2={banner2Color}
          canEdit={canInlineEdit}
          profileLabel={profileLabel}
        />

        <ProfileHeaderContent
          aboutStatement={aboutStatement}
          banner1Color={banner1Color}
          banner2Color={banner2Color}
          canEdit={canEdit}
          canInlineEdit={canInlineEdit}
          canManageProfilePreferences={canManageProfilePreferences}
          directMessageLoading={directMessageLoading}
          followHandle={followHandle}
          followersCount={followersCount}
          mainAddress={mainAddress}
          normalizedHandleOrWallet={normalizedHandleOrWallet}
          onCreateDirectMessage={handleCreateDirectMessage}
          onOpenPreferences={() => setIsProfilePreferencesOpen(true)}
          profile={profile}
          profileEnabledAt={profileEnabledAt}
          profileLabel={profileLabel}
          showAbout={showAbout}
          showSubscriptionStatus={showSubscriptionStatus}
          websiteAction={websiteAction}
        />
      </section>
      {canManageProfilePreferences ? (
        <ProfilePreferencesSettings
          isOpen={isProfilePreferencesOpen}
          onClose={() => setIsProfilePreferencesOpen(false)}
        />
      ) : null}
    </div>
  );
}
