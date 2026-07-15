"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useContext, useMemo, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
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
import UserFollowBtn from "../utils/UserFollowBtn";
import WebsiteIcon from "../utils/icons/WebsiteIcon";
import UserPageHeaderAbout from "./about/UserPageHeaderAbout";
import UserPageHeaderBanner from "./banner/UserPageHeaderBanner";
import UserPageHeaderName from "./name/UserPageHeaderName";
import UserPageHeaderPfp from "./pfp/UserPageHeaderPfp";
import UserPageHeaderPfpWrapper from "./pfp/UserPageHeaderPfpWrapper";
import UserPageHeaderStats from "./stats/UserPageHeaderStats";
import {
  getUserProfileHeaderDisplayName,
  getUserProfileHeaderMessage,
} from "./user-page-header.messages";

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
  const showWebsiteAction = Boolean(cmsWebsiteHref && profile.handle);
  const showFollowActions = Boolean(
    !isMyProfile && profile.handle && connectedProfile?.handle
  );
  const showProfileActions = showWebsiteAction || showFollowActions;

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
      setToast({
        type: "error",
        title: getUserProfileHeaderMessage(
          "user.profileHeader.dm.createFailed.title"
        ),
        description: getUserProfileHeaderMessage(
          "user.profileHeader.dm.createFailed.description"
        ),
        details: getToastErrorDetails(error),
      });
    } finally {
      setDirectMessageLoading(false);
    }
  };

  return (
    <div className="tailwind-scope">
      <section
        aria-labelledby="profile-heading"
        className="tw-relative tw-pb-6 md:tw-pb-8"
      >
        <div className="tw-relative tw-w-full">
          <UserPageHeaderBanner
            profile={profile}
            defaultBanner1={banner1Color}
            defaultBanner2={banner2Color}
            canEdit={canEdit}
            profileLabel={profileLabel}
          />
        </div>

        <div className="tw-relative tw-bg-black">
          <div className="tw-relative tw-z-10 tw-px-4 sm:tw-px-6 md:tw-px-8">
            <div className="tw-grid tw-grid-cols-1 tw-gap-y-5 lg:tw-grid-cols-[auto_minmax(0,1fr)_auto] lg:tw-gap-x-5">
              <div className="tw-relative -tw-mt-12 tw-w-fit tw-flex-shrink-0 sm:-tw-mt-16 lg:tw-row-start-1 lg:tw-self-start">
                <UserPageHeaderPfpWrapper
                  profile={profile}
                  canEdit={canEdit}
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

              <div className="tw-min-w-0 lg:tw-col-start-2 lg:tw-row-start-1 lg:tw-self-end lg:tw-pb-1">
                <UserPageHeaderName
                  profile={profile}
                  canEdit={canEdit}
                  mainAddress={mainAddress}
                  level={profile.level}
                  profileEnabledAt={profileEnabledAt}
                />
              </div>

              {showProfileActions ? (
                <div
                  role="group"
                  aria-label={getUserProfileHeaderMessage(
                    "user.profileHeader.actions.label"
                  )}
                  className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 lg:tw-col-start-3 lg:tw-row-start-1 lg:tw-justify-end lg:tw-self-end lg:tw-pb-1"
                >
                  {showWebsiteAction && cmsWebsiteHref && profile.handle ? (
                    <Link
                      className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none"
                      href={cmsWebsiteHref}
                      aria-label={t(locale, "profileCms.header.openWebsite", {
                        handle: profile.handle,
                      })}
                    >
                      <WebsiteIcon />
                      <span>{t(locale, "profileCms.header.website")}</span>
                    </Link>
                  ) : null}
                  {showFollowActions && profile.handle ? (
                    <div className="[&_button]:tw-min-h-11 [&_button]:tw-min-w-11 [&_button]:focus-visible:tw-outline [&_button]:focus-visible:tw-outline-2 [&_button]:focus-visible:tw-outline-offset-2 [&_button]:focus-visible:tw-outline-primary-400">
                      <UserFollowBtn
                        handle={profile.handle}
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
                    </div>
                  ) : null}
                </div>
              ) : null}
              {showAbout ? (
                <div className="lg:tw-col-start-2 lg:tw-col-end-4">
                  <UserPageHeaderAbout
                    profile={profile}
                    statement={aboutStatement}
                    canEdit={canEdit}
                  />
                </div>
              ) : null}

              <div className="lg:tw-col-start-2 lg:tw-col-end-4">
                <UserPageHeaderStats
                  profile={profile}
                  handleOrWallet={normalizedHandleOrWallet}
                  followersCount={followersCount}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
