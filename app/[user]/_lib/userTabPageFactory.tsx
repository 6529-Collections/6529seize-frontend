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

type TabProps = { readonly profile: ApiIdentity };

type FactoryArgs = {
  subroute: string;
  metaLabel: string;
  Tab: (props: Readonly<TabProps>) => React.JSX.Element;
  enableTransfer?: boolean | undefined;
};

type UserRouteParams = { user: string };
type UserSearchParams = Record<string, string | string[] | undefined>;

const normalizeSearchParams = (
  params?: UserSearchParams | URLSearchParams
): UserSearchParams => {
  if (!params) {
    return {};
  }

  if (params instanceof URLSearchParams) {
    return Array.from(params.entries()).reduce((acc, [key, value]) => {
      const existing = acc[key];
      if (existing === undefined) {
        acc[key] = value;
      } else if (Array.isArray(existing)) {
        acc[key] = [...existing, value];
      } else {
        acc[key] = [existing, value];
      }
      return acc;
    }, {} as UserSearchParams);
  }

  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as UserSearchParams);
};

const isNotFoundError = (error: unknown): boolean => {
  if (!error || (typeof error !== "object" && typeof error !== "string")) {
    return false;
  }

  const status =
    typeof error === "object" && error !== null
      ? (error as { status?: number | undefined }).status ??
        (error as { statusCode?: number | undefined }).statusCode ??
        (error as { response?: { status?: number | undefined } | undefined }).response?.status
      : undefined;

  if (status === 404) {
    return true;
  }

  let message: string | undefined;

  if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return !!message && message.toLowerCase().includes("not found");
};

export function createUserTabPage({
  subroute,
  metaLabel,
  Tab,
  enableTransfer,
}: FactoryArgs) {
  async function Page({
    params,
    searchParams,
  }: {
    readonly params?: Promise<UserRouteParams> | undefined;
    readonly searchParams?: Promise<UserSearchParams> | undefined;
  }) {
    const resolvedParams = params ? await params : undefined;
    if (!resolvedParams?.user) {
      notFound();
    }

    const user = resolvedParams.user;
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

    const TabComponent = (
      <UserPageLayout profile={profile} handleOrWallet={normalizedUser}>
        <Tab profile={profile} />
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
      notFound();
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
