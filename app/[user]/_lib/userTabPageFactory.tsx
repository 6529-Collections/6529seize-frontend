import { TransferProvider } from "@/components/nft-transfer/TransferState";
import { getAppMetadata } from "@/components/providers/metadata";
import UserPageLayout from "@/components/user/layout/UserPageLayout";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { getMetadataForUserPage } from "@/helpers/Helpers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import {
  getUserProfile,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  isNotFoundError,
  isProbeLikeUserSlug,
  normalizeSearchParams,
  type UserRouteParams,
  type UserSearchParams,
} from "./userPageHelpers";

type TabProps = { readonly profile: ApiIdentity };

export function createUserTabPage<
  TExtra extends Record<string, unknown> = Record<string, never>
>({
  subroute,
  metaLabel,
  Tab,
  enableTransfer,
  getTabProps,
}: {
  subroute: string;
  metaLabel: string;
  Tab: (props: Readonly<TabProps & TExtra>) => React.JSX.Element;
  enableTransfer?: boolean | undefined;
  getTabProps?: (ctx: {
    profile: ApiIdentity;
    query: UserSearchParams;
  }) => Promise<TExtra>;
}) {
  async function Page({
    params,
    searchParams,
  }: {
    readonly params?: Promise<UserRouteParams> | undefined;
    readonly searchParams?: Promise<UserSearchParams> | undefined;
  }) {
    const resolvedParams = params ? await params : undefined;
    if (!resolvedParams?.user) {
      return notFound();
    }

    const user = resolvedParams.user;
    if (isProbeLikeUserSlug(user)) {
      return notFound();
    }

    const normalizedUser = user.toLowerCase();
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const query: UserSearchParams = normalizeSearchParams(resolvedSearchParams);
    const headers = await getAppCommonHeaders();
    const profile: ApiIdentity = await getUserProfile({
      user: normalizedUser,
      headers,
    }).catch((error: unknown) => {
      if (isNotFoundError(error)) {
        notFound();
      }
      throw error;
    });

    const needsRedirect = userPageNeedsRedirect({
      profile,
      req: { query: { ...query, user } },
      subroute,
    });

    if (needsRedirect) {
      redirect(needsRedirect.redirect.destination);
    }

    const extraProps = getTabProps
      ? await getTabProps({ profile, query })
      : ({} as TExtra);

    const TabComponent = (
      <UserPageLayout profile={profile} handleOrWallet={normalizedUser}>
        <Tab profile={profile} {...extraProps} />
      </UserPageLayout>
    );

    if (enableTransfer) {
      return <TransferProvider>{TabComponent}</TransferProvider>;
    }

    return TabComponent;
  }

  async function generateMetadata({
    params,
  }: {
    readonly params?: Promise<UserRouteParams> | undefined;
  }): Promise<Metadata> {
    const resolvedParams = params ? await params : undefined;
    if (!resolvedParams?.user) {
      return notFound();
    }

    if (isProbeLikeUserSlug(resolvedParams.user)) {
      return notFound();
    }

    const normalizedUser = resolvedParams.user.toLowerCase();
    const headers = await getAppCommonHeaders();
    const profile: ApiIdentity = await getUserProfile({
      user: normalizedUser,
      headers,
    }).catch((error: unknown) => {
      if (isNotFoundError(error)) {
        notFound();
      }
      throw error;
    });
    return getAppMetadata(getMetadataForUserPage(profile, metaLabel));
  }

  return { Page, generateMetadata };
}
