"use client";

import type { ApiIncomingIdentitySubscriptionsPage } from "@/generated/models/ApiIncomingIdentitySubscriptionsPage";

import { skipToken, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useContext, useMemo, useState, type ReactNode } from "react";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import ButtonLink from "@/components/utils/button/ButtonLink";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { amIUser } from "@/helpers/Helpers";
import { PROFILE_PREFERENCES_HREF } from "@/helpers/preferences-navigation";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { getBannerColorValue } from "@/helpers/profile-banner.helpers";
import { useContentModeratorAccess } from "@/hooks/content-moderation/useContentModeratorAccess";
import { useProfileBlockState } from "@/hooks/content-moderation/useProfileBlockState";
import { usePublicProfileModerationStatus } from "@/hooks/content-moderation/usePublicProfileModerationStatus";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useIdentityEditingPaused } from "@/hooks/useIdentityMovePhase";
import { useIdentity } from "@/hooks/useIdentity";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { toProfileIdentitySegment } from "@/helpers/profile-identity-segment";
import { commonApiFetch } from "@/services/api/common-api";

import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import WebsiteIcon from "../utils/icons/WebsiteIcon";
import UserPageHeaderAbout from "./about/UserPageHeaderAbout";
import UserPageHeaderBanner from "./banner/UserPageHeaderBanner";
import UserPageHeaderName from "./name/UserPageHeaderName";
import UserPageHeaderPfp from "./pfp/UserPageHeaderPfp";
import UserPageHeaderPfpWrapper from "./pfp/UserPageHeaderPfpWrapper";
import UserPageHeaderStats from "./stats/UserPageHeaderStats";
import UserPageHeaderSubscriptionStatus from "./UserPageHeaderSubscriptionStatus";
import UserPageHeaderEditProfile from "./UserPageHeaderEditProfile";
import UserPageHeaderEditProfileDesktop from "./UserPageHeaderEditProfileDesktop";
import BlockedProfileHeaderIndicator from "./BlockedProfileHeaderIndicator";
import ProfileHeaderRelationshipActions, {
  type ProfileAction,
  type ProfileModerationControls,
} from "./ProfileHeaderRelationshipActions";
import SuspendedProfileHeaderIndicator from "./SuspendedProfileHeaderIndicator";
import { getUserProfileHeaderDisplayName } from "./user-page-header.messages";
import {
  PROFILE_MOBILE_ACTION_CLASS,
  USER_PAGE_HEADER_INTERACTIVE_SURFACE_CLASS,
  USER_PAGE_HEADER_SURFACE_CLASS,
  USER_PAGE_HEADER_TOUCH_TARGET_CLASS,
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
  iconOnly = false,
}: {
  readonly iconOnly?: boolean;
}) {
  if (iconOnly) {
    return (
      <ButtonLink
        variant="tertiary"
        size={null}
        href={PROFILE_PREFERENCES_HREF}
        aria-label={t(DEFAULT_LOCALE, PROFILE_PREFERENCES_BUTTON_KEY)}
        title={t(DEFAULT_LOCALE, PROFILE_PREFERENCES_BUTTON_KEY)}
        className="tw-group tw-size-11 !tw-rounded-full !tw-border-transparent !tw-bg-transparent !tw-p-1 !tw-shadow-none focus-visible:!tw-outline-none active:!tw-bg-transparent desktop-hover:hover:!tw-border-transparent desktop-hover:hover:!tw-bg-transparent"
      >
        <span className="tw-box-border tw-inline-flex tw-size-9 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-black/75 tw-text-iron-100 tw-shadow-[0_8px_24px_rgba(0,0,0,0.32)] tw-transition-colors group-focus-visible:tw-ring-2 group-focus-visible:tw-ring-primary-400 group-focus-visible:tw-ring-offset-2 group-focus-visible:tw-ring-offset-black desktop-hover:group-hover:tw-bg-black/90 motion-reduce:tw-transition-none">
          <Cog6ToothIcon className="tw-size-[1.125rem]" aria-hidden="true" />
        </span>
      </ButtonLink>
    );
  }

  return (
    <ButtonLink
      variant="tertiary"
      size="sm"
      href={PROFILE_PREFERENCES_HREF}
      aria-label={t(DEFAULT_LOCALE, PROFILE_PREFERENCES_BUTTON_KEY)}
      className={`${USER_PAGE_HEADER_SURFACE_CLASS} ${USER_PAGE_HEADER_INTERACTIVE_SURFACE_CLASS} ${USER_PAGE_HEADER_TOUCH_TARGET_CLASS}`}
    >
      <Cog6ToothIcon className="tw-size-4" aria-hidden="true" />
      <span>{t(DEFAULT_LOCALE, PROFILE_PREFERENCES_BUTTON_KEY)}</span>
    </ButtonLink>
  );
}

type ProfileHeaderActionColumnProps = Readonly<{
  isApp: boolean;
  editProfileButton: ReactNode;
  canManageProfilePreferences: boolean;
  followHandle: string | null;
  moderationControls: ProfileModerationControls;
  profile: ApiIdentity;
  showSubscriptionStatus: boolean;
  websiteAction: WebsiteAction | null;
}>;

function ProfileHeaderActionColumn({
  isApp,
  editProfileButton,
  canManageProfilePreferences,
  followHandle,
  moderationControls,
  profile,
  showSubscriptionStatus,
  websiteAction,
}: ProfileHeaderActionColumnProps) {
  if (!canManageProfilePreferences && !websiteAction && !followHandle) {
    return null;
  }

  const topPaddingClass = canManageProfilePreferences
    ? "lg:tw-pt-0"
    : "lg:tw-pt-5";
  let visibilityClass = isApp ? "tw-hidden" : "tw-hidden lg:tw-flex";
  if (followHandle) visibilityClass = "tw-flex";
  const desktopLayoutClass = isApp
    ? ""
    : `lg:tw-col-start-2 lg:tw-row-span-2 lg:tw-row-start-1 lg:tw-w-auto lg:tw-flex-none lg:tw-self-start lg:tw-pb-2 lg:tw-pt-0 ${topPaddingClass}`;
  return (
    <div
      className={`tw-col-start-2 tw-row-start-1 tw-flex-col tw-items-end tw-gap-4 tw-justify-self-end ${desktopLayoutClass} ${visibilityClass}`}
    >
      <div className="tw-flex tw-w-full tw-flex-wrap tw-items-end tw-gap-2 md:tw-w-auto md:tw-justify-end">
        {canManageProfilePreferences ? (
          <div
            className={
              isApp
                ? "tw-hidden"
                : "tw-hidden lg:tw-flex lg:tw-items-center lg:tw-gap-2"
            }
          >
            {editProfileButton}
            <ProfilePreferencesButton />
          </div>
        ) : null}
        {websiteAction ? (
          <ButtonLink
            variant="secondary"
            className={isApp ? "tw-hidden" : "tw-hidden lg:tw-inline-flex"}
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
          <ProfileHeaderRelationshipActions
            moderationControls={moderationControls}
            profile={profile}
          />
        ) : null}
      </div>
      {showSubscriptionStatus ? (
        <div className={isApp ? "tw-hidden" : "tw-hidden lg:tw-block"}>
          <UserPageHeaderSubscriptionStatus profile={profile} layout="subtle" />
        </div>
      ) : null}
    </div>
  );
}

type ProfileHeaderContentProps = Readonly<{
  isApp: boolean;
  editProfileButton: ReactNode;
  aboutStatement: CicStatement | null;
  banner1Color: string;
  banner2Color: string;
  canManageProfilePreferences: boolean;
  followHandle: string | null;
  followersCount: number | null;
  mainAddress: string;
  moderationControls: ProfileModerationControls;
  normalizedHandleOrWallet: string;
  profile: ApiIdentity;
  profileEnabledAt: string | null;
  profileLabel: string;
  showAbout: boolean;
  showSubscriptionStatus: boolean;
  websiteAction: WebsiteAction | null;
}>;

function ProfileHeaderContent({
  isApp,
  editProfileButton,
  aboutStatement,
  banner1Color,
  banner2Color,
  canManageProfilePreferences,
  followHandle,
  followersCount,
  mainAddress,
  moderationControls,
  normalizedHandleOrWallet,
  profile,
  profileEnabledAt,
  profileLabel,
  showAbout,
  showSubscriptionStatus,
  websiteAction,
}: ProfileHeaderContentProps) {
  return (
    <div className="tw-relative tw-z-20 tw-bg-black">
      <div
        className={`tw-relative tw-z-10 tw-px-4 tw-pt-3.5 sm:tw-px-6 md:tw-px-8 ${isApp ? "" : "lg:tw-grid lg:tw-grid-cols-[minmax(0,1fr)_auto] lg:tw-gap-x-6"}`}
      >
        <div
          className={`tw-relative tw-mb-4 tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-items-start tw-gap-3 ${isApp ? "" : "lg:tw-contents"}`}
        >
          <div
            className={`tw-contents ${isApp ? "" : "lg:tw-col-start-1 lg:tw-row-start-1 lg:tw-flex lg:tw-w-full lg:tw-min-w-0 lg:tw-flex-1 lg:tw-flex-row lg:tw-items-start lg:tw-gap-4"}`}
          >
            <div
              data-profile-avatar
              className={`tw-relative -tw-mt-10 tw-flex-shrink-0 ${isApp ? "" : "lg:-tw-mt-14"}`}
            >
              <UserPageHeaderPfpWrapper
                profile={profile}
                canEdit={false}
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

            <div
              className={`tw-col-span-2 tw-row-start-2 tw-min-w-0 tw-flex-1 tw-pb-1 ${isApp ? "" : "lg:tw-pb-2 lg:tw-pt-1"}`}
            >
              <UserPageHeaderName
                profile={profile}
                canEdit={false}
                mainAddress={mainAddress}
                level={profile.level}
                profileEnabledAt={profileEnabledAt}
                variant="full"
                titleAccessory={
                  moderationControls.isSuspended ||
                  moderationControls.isBlocked ? (
                    <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-2">
                      {moderationControls.isSuspended ? (
                        <SuspendedProfileHeaderIndicator />
                      ) : null}
                      {moderationControls.isBlocked ? (
                        <BlockedProfileHeaderIndicator />
                      ) : null}
                    </span>
                  ) : undefined
                }
              />
            </div>
          </div>

          <ProfileHeaderActionColumn
            isApp={isApp}
            editProfileButton={editProfileButton}
            canManageProfilePreferences={canManageProfilePreferences}
            followHandle={followHandle}
            moderationControls={moderationControls}
            profile={profile}
            showSubscriptionStatus={showSubscriptionStatus}
            websiteAction={websiteAction}
          />
        </div>

        {websiteAction ? (
          <div
            className={`tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-gap-2 ${isApp ? "" : "lg:tw-hidden"}`}
          >
            <ButtonLink
              variant="secondary"
              href={websiteAction.href}
              className={PROFILE_MOBILE_ACTION_CLASS}
              aria-label={t(DEFAULT_LOCALE, "profileCms.header.openWebsite", {
                handle: websiteAction.handle,
              })}
            >
              <WebsiteIcon />
              <span>{t(DEFAULT_LOCALE, "profileCms.header.website")}</span>
            </ButtonLink>
          </div>
        ) : null}

        {showSubscriptionStatus ? (
          <div className={isApp ? "" : "lg:tw-hidden"}>
            <UserPageHeaderSubscriptionStatus
              profile={profile}
              layout="wide-row"
            />
          </div>
        ) : null}

        {showAbout ? (
          <div className="lg:tw-col-start-1 lg:tw-row-start-2 lg:tw-self-start lg:tw-pt-4">
            <UserPageHeaderAbout statement={aboutStatement} />
          </div>
        ) : null}

        <div className="tw-mt-4 tw-flex tw-items-center sm:tw-mt-6 lg:tw-col-span-2 lg:tw-col-start-1 lg:tw-row-start-3 lg:tw-mt-4">
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

/**
 * Reads the header's shared queries. This header streams in after the rest of
 * the profile page, which can fill these queries first, so until it has
 * hydrated it renders the server snapshot it was given. That keeps the
 * hydration render identical to the server HTML.
 */
function useProfileHeaderData({
  handleOrWallet,
  profileId,
  initialStatements,
  initialProfileEnabledAt,
  initialCmsWebsiteHref,
  initialFollowersCount,
}: {
  readonly handleOrWallet: string;
  readonly profileId: string | null | undefined;
  readonly initialStatements: CicStatement[];
  readonly initialProfileEnabledAt: string | null;
  readonly initialCmsWebsiteHref: string | null | undefined;
  readonly initialFollowersCount: number | null;
}) {
  const hasHydrated = useHasHydrated();
  // Same endpoint as the server loader that primed this query, so a refresh
  // never requests a differently encoded path for the same identity.
  const statementsSegment = toProfileIdentitySegment(handleOrWallet);
  // No initialData: an empty server snapshot (for example after a failed
  // request) must not count as fresh data, or the client would skip its own
  // fetch. Until data arrives the server snapshot below is shown instead.
  const { data: statements } = useQuery<CicStatement[]>({
    queryKey: [QueryKey.PROFILE_CIC_STATEMENTS, handleOrWallet],
    queryFn:
      statementsSegment === null
        ? skipToken
        : async () =>
            await commonApiFetch<CicStatement[]>({
              endpoint: `profiles/${statementsSegment}/cic/statements`,
            }),
    staleTime: 60_000,
  });
  const { data: enabledAt } = useQuery<string | null>({
    queryKey: [QueryKey.PROFILE_HEADER, handleOrWallet, "enabledAt"],
    queryFn: skipToken,
  });
  const { data: websiteHref } = useQuery<string | null>({
    queryKey: [QueryKey.PROFILE_HEADER, handleOrWallet, "cmsWebsiteHref"],
    queryFn: skipToken,
  });
  const { data: followers } = useQuery<ApiIncomingIdentitySubscriptionsPage>({
    queryKey: [
      QueryKey.IDENTITY_FOLLOWERS,
      { profile_id: profileId, page_size: 1 },
    ],
    queryFn: () => {
      if (!profileId) throw new Error("Missing profile ID for followers");
      return commonApiFetch<ApiIncomingIdentitySubscriptionsPage>({
        endpoint: `identity-subscriptions/incoming/IDENTITY/${profileId}`,
        params: { page_size: "1" },
      });
    },
    enabled: !!profileId,
    staleTime: 60_000,
  });

  return {
    // Before hydration, and until the client has statements of its own, show
    // exactly what the server rendered.
    statements: (hasHydrated ? statements : undefined) ?? initialStatements,
    profileEnabledAt:
      hasHydrated && enabledAt !== undefined
        ? enabledAt
        : initialProfileEnabledAt,
    cmsWebsiteHref:
      hasHydrated && websiteHref !== undefined
        ? websiteHref
        : initialCmsWebsiteHref,
    followersCount:
      (hasHydrated ? followers?.count : undefined) ?? initialFollowersCount,
  };
}

export default function UserPageHeaderClient({
  profile: initialProfile,
  handleOrWallet,
  fallbackMainAddress,
  defaultBanner1,
  defaultBanner2,
  initialStatements,
  profileEnabledAt: initialProfileEnabledAt,
  followersCount: initialFollowersCount,
  cmsWebsiteHref: initialCmsWebsiteHref,
}: Readonly<Props>) {
  const params = useParams();
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const routeHandleOrWallet = params["user"]?.toString().toLowerCase() ?? null;
  const normalizedHandleOrWallet =
    routeHandleOrWallet ?? handleOrWallet.toLowerCase();

  const { address } = useSeizeConnectContext();
  const { connectedProfile, activeProfileProxy, isDirectProfileSession } =
    useContext(AuthContext);
  const hasHydrated = useHasHydrated();
  const identityEditingPaused = useIdentityEditingPaused();

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

  const [profileBlockConfirmation, setProfileBlockConfirmation] =
    useState<ProfileAction | null>(null);

  const isMyProfile = useMemo(
    () =>
      amIUser({
        profile,
        address,
        connectedHandle: connectedProfile?.handle ?? undefined,
      }),
    [profile, address, connectedProfile?.handle]
  );

  const canEdit = Boolean(
    hasHydrated &&
    isDirectProfileSession === true &&
    profile.handle &&
    isMyProfile &&
    !activeProfileProxy &&
    !identityEditingPaused
  );

  const { statements, profileEnabledAt, cmsWebsiteHref, followersCount } =
    useProfileHeaderData({
      handleOrWallet: normalizedHandleOrWallet,
      profileId: profile.id,
      initialStatements,
      initialProfileEnabledAt,
      initialCmsWebsiteHref,
      initialFollowersCount,
    });

  const aboutStatement = useMemo(
    () => getAboutStatement(statements),
    [statements]
  );

  const showAbout = aboutStatement !== null;

  const websiteAction =
    cmsWebsiteHref && profile.handle
      ? { href: cmsWebsiteHref, handle: profile.handle }
      : null;
  const followHandle =
    hasHydrated && !isMyProfile && profile.handle && connectedProfile
      ? profile.handle
      : null;
  const profileBlockState = useProfileBlockState({
    profileId: profile.id,
    profileHandle: profile.handle,
    profilePfp: profile.pfp,
  });
  const profileModerationStatus = usePublicProfileModerationStatus(profile.id);
  const moderatorAccess = useContentModeratorAccess();
  const canModerateProfile =
    hasHydrated &&
    !isMyProfile &&
    !!profile.id &&
    moderatorAccess.data?.moderator === true;
  const canManageProfilePreferences =
    hasHydrated && isMyProfile && !activeProfileProxy;
  const showSubscriptionStatus = canManageProfilePreferences;

  const isProfileBlockMutationPending =
    profileBlockState.isBlocking || profileBlockState.isUnblocking;
  const isProfileActionPending = isProfileBlockMutationPending;
  const closeProfileBlockConfirmation = () => {
    if (!isProfileActionPending) {
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
      } else if (profileBlockConfirmation === "unblock") {
        await profileBlockState.unblock();
      } else {
        router.push(
          `/content-moderation/checks?profile=${encodeURIComponent(profile.id ?? "")}`
        );
        return;
      }
      setProfileBlockConfirmation(null);
    } catch {
      // The hook restores the previous state and reports the request failure.
    }
  };
  const confirmationProfileLabel = profile.handle
    ? `@${profile.handle}`
    : profileLabel;
  const confirmationCopy = (() => {
    switch (profileBlockConfirmation) {
      case "block":
        return {
          title: t(DEFAULT_LOCALE, "contentModeration.block.confirmTitle", {
            profile: confirmationProfileLabel,
          }),
          message: t(
            DEFAULT_LOCALE,
            "contentModeration.report.blockDescription"
          ),
          confirmText: t(
            DEFAULT_LOCALE,
            "contentModeration.actions.blockProfile"
          ),
          confirmVariant: "destructive" as const,
        };
      case "unblock":
        return {
          title: t(DEFAULT_LOCALE, "contentModeration.unblock.confirmTitle", {
            profile: confirmationProfileLabel,
          }),
          message: t(
            DEFAULT_LOCALE,
            "contentModeration.unblock.confirmDescription"
          ),
          confirmText: t(DEFAULT_LOCALE, "contentModeration.actions.unblock"),
          confirmVariant: "primary" as const,
        };
      case "suspend":
        return {
          title: t(DEFAULT_LOCALE, "contentModeration.moderator.suspend"),
          message: t(
            DEFAULT_LOCALE,
            "contentModeration.moderator.confirmSuspend"
          ),
          confirmText: t(DEFAULT_LOCALE, "contentModeration.moderator.suspend"),
          confirmVariant: "destructive" as const,
        };
      case "reinstate":
        return {
          title: t(DEFAULT_LOCALE, "contentModeration.moderator.reinstate"),
          message: t(
            DEFAULT_LOCALE,
            "contentModeration.moderator.confirmReinstate"
          ),
          confirmText: t(
            DEFAULT_LOCALE,
            "contentModeration.moderator.reinstate"
          ),
          confirmVariant: "primary" as const,
        };
      case null:
        return {
          title: "",
          message: "",
          confirmText: "",
          confirmVariant: "primary" as const,
        };
    }
  })();
  const moderationControls: ProfileModerationControls = {
    canManageBlock: profileBlockState.canManage,
    canModerate: canModerateProfile,
    isActionPending: isProfileActionPending,
    isBlocked: profileBlockState.isBlocked,
    isBlocking: profileBlockState.isBlocking,
    isLoading: profileBlockState.isLoading,
    isSuspended: profileModerationStatus.isSuspended,
    isUnblocking: profileBlockState.isUnblocking,
    onSelectAction: (action) => {
      if (action === "suspend" || action === "reinstate") {
        router.push(
          `/content-moderation/checks?profile=${encodeURIComponent(profile.id ?? "")}`
        );
      } else {
        setProfileBlockConfirmation(action);
      }
    },
  };

  const editProfileProps = {
    profile,
    statement: aboutStatement,
    defaultBanner1: banner1Color,
    defaultBanner2: banner2Color,
  };
  const editProfileButton = canEdit ? (
    <UserPageHeaderEditProfileDesktop {...editProfileProps} />
  ) : null;
  const mobileEditProfileButton = canEdit ? (
    <UserPageHeaderEditProfile {...editProfileProps} />
  ) : null;
  const mobileOwnerControls =
    canEdit || canManageProfilePreferences ? (
      <div className="tw-flex tw-items-center">
        {mobileEditProfileButton}
        {canManageProfilePreferences ? (
          <ProfilePreferencesButton iconOnly />
        ) : null}
      </div>
    ) : null;

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
            canEdit={false}
            profileLabel={profileLabel}
          />
          {mobileOwnerControls ? (
            <div
              className={`tw-absolute tw-right-4 tw-top-3 tw-z-20 sm:tw-right-6 sm:tw-top-4 md:tw-right-8 ${isApp ? "" : "lg:tw-hidden"}`}
            >
              {mobileOwnerControls}
            </div>
          ) : null}
        </div>

        <ProfileHeaderContent
          isApp={isApp}
          editProfileButton={editProfileButton}
          aboutStatement={aboutStatement}
          banner1Color={banner1Color}
          banner2Color={banner2Color}
          canManageProfilePreferences={canManageProfilePreferences}
          followHandle={followHandle}
          followersCount={followersCount}
          mainAddress={mainAddress}
          moderationControls={moderationControls}
          normalizedHandleOrWallet={normalizedHandleOrWallet}
          profile={profile}
          profileEnabledAt={profileEnabledAt}
          profileLabel={profileLabel}
          showAbout={showAbout}
          showSubscriptionStatus={showSubscriptionStatus}
          websiteAction={websiteAction}
        />
      </section>
      <MobileWrapperConfirmationDialog
        isOpen={profileBlockConfirmation !== null}
        onClose={closeProfileBlockConfirmation}
        onConfirm={() => void confirmProfileBlockChange()}
        title={confirmationCopy.title}
        message={confirmationCopy.message}
        confirmText={confirmationCopy.confirmText}
        cancelText={t(DEFAULT_LOCALE, "contentModeration.report.cancel")}
        isConfirming={isProfileActionPending}
        confirmVariant={confirmationCopy.confirmVariant}
      />
    </div>
  );
}
