"use client";

import { useContext, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { AuthContext } from "@/components/auth/Auth";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { amIUser } from "@/helpers/Helpers";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { createDirectMessageWave } from "@/helpers/waves/waves.helpers";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import UserPageHeaderBanner from "./banner/UserPageHeaderBanner";
import UserPageHeaderPfpWrapper from "./pfp/UserPageHeaderPfpWrapper";
import UserPageHeaderPfp from "./pfp/UserPageHeaderPfp";
import UserPageHeaderName from "./name/UserPageHeaderName";
import UserPageHeaderAbout from "./about/UserPageHeaderAbout";
import UserPageHeaderStats from "./stats/UserPageHeaderStats";
import UserPageHeaderProfileEnabledAt from "./UserPageHeaderProfileEnabledAt";
import UserLevel from "../utils/level/UserLevel";
import UserFollowBtn from "../utils/UserFollowBtn";
import { useIdentity } from "@/hooks/useIdentity";

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
  const routeHandleOrWallet = params?.user?.toString().toLowerCase() ?? null;
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

  const mainAddress = useMemo(() => {
    const primaryWallet = profile?.primary_wallet;
    if (primaryWallet) {
      return primaryWallet.toLowerCase();
    }
    return fallbackMainAddress.toLowerCase();
  }, [profile?.primary_wallet, fallbackMainAddress]);

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

  const { isFetched, data: statements } = useQuery<CicStatement[]>({
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

  const showAbout = useMemo(() => {
    if (!isFetched) {
      return false;
    }
    return !!(aboutStatement || canEdit);
  }, [aboutStatement, canEdit, isFetched]);

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
      router.push(`/waves/${wave.id}`);
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
      <section className="tw-pb-6 md:tw-pb-8">
        <UserPageHeaderBanner
          profile={profile}
          defaultBanner1={defaultBanner1}
          defaultBanner2={defaultBanner2}
          canEdit={canEdit}
        />
        <div className="tw-relative tw-px-2 lg:tw-px-6 xl:tw-px-8 tw-mx-auto">
          <div className="tw-flex tw-flex-col">
            <div className="tw-flex tw-justify-between">
              <div className="-tw-mt-16 sm:-tw-mt-24 tw-w-min">
                <UserPageHeaderPfpWrapper profile={profile} canEdit={canEdit}>
                  <UserPageHeaderPfp
                    profile={profile}
                    defaultBanner1={profile.banner1 ?? defaultBanner1}
                    defaultBanner2={profile.banner2 ?? defaultBanner2}
                  />
                </UserPageHeaderPfpWrapper>
              </div>
              <div className="tw-mt-4">
                {!isMyProfile && profile.handle && connectedProfile?.handle && (
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
                )}
              </div>
            </div>

            <UserPageHeaderName
              profile={profile}
              canEdit={canEdit}
              mainAddress={mainAddress}
            />

            <div className="tw-mt-2">
              <UserLevel level={profile.level} />
            </div>
            {showAbout && (
              <UserPageHeaderAbout
                profile={profile}
                statement={aboutStatement}
                canEdit={canEdit}
              />
            )}
            <UserPageHeaderStats
              profile={profile}
              handleOrWallet={normalizedHandleOrWallet}
              followersCount={followersCount}
            />
            <UserPageHeaderProfileEnabledAt
              profileEnabledAt={profileEnabledAt}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
