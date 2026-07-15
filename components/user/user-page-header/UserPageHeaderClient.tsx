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

  const websiteAction =
    cmsWebsiteHref && profile.handle
      ? { href: cmsWebsiteHref, handle: profile.handle }
      : null;
  const followHandle =
    !isMyProfile && profile.handle && connectedProfile?.handle
      ? profile.handle
      : null;

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
      <section className="tw-relative tw-bg-black tw-pb-4 md:tw-pb-8">
        <div className="tw-relative tw-w-full">
          <UserPageHeaderBanner
            profile={profile}
            defaultBanner1={banner1Color}
            defaultBanner2={banner2Color}
            canEdit={canEdit}
            profileLabel={profileLabel}
          />
        </div>

        <div className="tw-relative tw-z-20 tw-bg-black md:-tw-mt-[164px] md:tw-bg-transparent">
          <div className="tw-relative tw-z-10 tw-px-4 sm:tw-px-6 md:tw-px-8">
            <div className="tw-mb-4 tw-flex tw-flex-col tw-items-start tw-gap-5 md:tw-mb-8 md:tw-flex-row md:tw-items-end">
              <div className="tw-relative -tw-mt-10 tw-flex-shrink-0 sm:-tw-mt-[58px] md:tw-mt-0">
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

              <div className="tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-start tw-gap-6 md:tw-flex-1 md:tw-flex-row md:tw-items-center md:tw-justify-between">
                <div className="tw-min-w-0">
                  <UserPageHeaderName
                    profile={profile}
                    canEdit={canEdit}
                    mainAddress={mainAddress}
                    level={profile.level}
                    profileEnabledAt={profileEnabledAt}
                    variant="title"
                  />
                  <div className="tw-mt-1.5">
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

                {websiteAction || followHandle ? (
                  <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
                    {websiteAction ? (
                      <Link
                        className="tw-inline-flex tw-h-9 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 tw-transition hover:tw-border-primary-400 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 md:tw-h-10"
                        href={websiteAction.href}
                        aria-label={t(
                          locale,
                          "profileCms.header.openWebsite",
                          {
                            handle: websiteAction.handle,
                          }
                        )}
                      >
                        <WebsiteIcon />
                        <span>
                          {t(locale, "profileCms.header.website")}
                        </span>
                      </Link>
                    ) : null}
                    {followHandle ? (
                      <UserFollowBtn
                        handle={followHandle}
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
                  </div>
                ) : null}
              </div>
            </div>

            {showAbout ? (
              <div>
                <UserPageHeaderAbout
                  profile={profile}
                  statement={aboutStatement}
                  canEdit={canEdit}
                />
              </div>
            ) : null}

            <div className="tw-mt-4 tw-flex tw-items-center md:tw-mt-6">
              <UserPageHeaderStats
                profile={profile}
                handleOrWallet={normalizedHandleOrWallet}
                followersCount={followersCount}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
