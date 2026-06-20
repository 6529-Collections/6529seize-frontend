import NativeRouteOverlay from "@/components/native-navigation/NativeRouteOverlay";
import BrainPage from "@/app/[user]/brain/page";
import CollectedPage from "@/app/[user]/collected/page";
import CurationsPage from "@/app/[user]/curations/page";
import ProfileCmsPage from "@/app/[user]/[...cmsPath]/page";
import ProxyPage from "@/app/[user]/proxy/page";
import SubscriptionsPage from "@/app/[user]/subscriptions/page";
import UserPage from "@/app/[user]/page";
import XtdhPage from "@/app/[user]/xtdh/page";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfile } from "@/helpers/server.helpers";
import type { ReactNode } from "react";
import { notFound, permanentRedirect, redirect } from "next/navigation";

type OverlaySearchParams = Record<string, string | string[] | undefined>;
type UserRouteParams = { readonly user: string };
type ProfileCatchAllRouteParams = UserRouteParams & {
  readonly cmsPath?: string[] | undefined;
};

type ProfileRootOverlayProps = {
  readonly params?: Promise<UserRouteParams>;
  readonly searchParams?: Promise<OverlaySearchParams>;
};

type UserPageProps = {
  readonly params: Promise<UserRouteParams>;
  readonly searchParams?: Promise<OverlaySearchParams>;
};

type ProfileCatchAllPageProps = {
  readonly params: Promise<ProfileCatchAllRouteParams>;
  readonly searchParams: Promise<OverlaySearchParams>;
};

type UserSubrouteRenderer = (props: UserPageProps) => ReactNode;

const getUserPageProps = ({
  user,
  searchParams,
}: {
  readonly user: string;
  readonly searchParams?: Promise<OverlaySearchParams> | undefined;
}): UserPageProps => ({
  params: Promise.resolve({ user }),
  ...(searchParams ? { searchParams } : {}),
});

const USER_SUBROUTE_RENDERERS: Record<string, UserSubrouteRenderer> = {
  brain: (props) => <BrainPage {...props} />,
  collected: (props) => <CollectedPage {...props} />,
  curations: (props) => <CurationsPage {...props} />,
  proxy: (props) => <ProxyPage {...props} />,
  subscriptions: (props) => <SubscriptionsPage {...props} />,
  xtdh: (props) => <XtdhPage {...props} />,
};

const buildQueryString = (params: OverlaySearchParams | undefined): string => {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined) {
      continue;
    }

    const values = Array.isArray(value) ? value : [value];
    values.forEach((entry) => query.append(key, entry));
  }

  return query.toString();
};

const redirectWithSearchParams = ({
  destination,
  permanent = false,
  searchParams,
}: {
  readonly destination: string;
  readonly permanent?: boolean | undefined;
  readonly searchParams: OverlaySearchParams | undefined;
}) => {
  const queryString = buildQueryString(searchParams);
  const resolvedDestination = queryString
    ? `${destination}?${queryString}`
    : destination;

  if (permanent) {
    permanentRedirect(resolvedDestination);
  }

  redirect(resolvedDestination);
};

const redirectLegacyProfileSubroute = async ({
  cmsPath,
  searchParams,
  user,
}: {
  readonly cmsPath: readonly string[];
  readonly searchParams: Promise<OverlaySearchParams>;
  readonly user: string;
}) => {
  const firstSegment = cmsPath[0]?.toLowerCase();

  if (firstSegment === "identity") {
    redirectWithSearchParams({
      destination: `/${encodeURIComponent(user)}`,
      permanent: true,
      searchParams: await searchParams,
    });
    return true;
  }

  if (firstSegment === "groups" || firstSegment === "followers") {
    redirect(`/${encodeURIComponent(user)}`);
    return true;
  }

  if (firstSegment === "waves") {
    const resolvedSearchParams = await searchParams;
    let destination = `/${encodeURIComponent(user)}`;

    try {
      const profile = await getUserProfile({
        user: user.toLowerCase(),
        headers: await getAppCommonHeaders(),
      });
      const canonicalUser = profile.handle ?? profile.primary_wallet ?? user;
      destination = profile.profile_wave_id
        ? `/${encodeURIComponent(canonicalUser)}/curations`
        : `/${encodeURIComponent(canonicalUser)}`;
    } catch {
      destination = `/${encodeURIComponent(user)}`;
    }

    redirectWithSearchParams({
      destination,
      searchParams: resolvedSearchParams,
    });
    return true;
  }

  return false;
};

const renderInOverlay = (children: ReactNode) => (
  <NativeRouteOverlay>{children}</NativeRouteOverlay>
);

export async function renderNativeProfileRootOverlay({
  params,
  searchParams,
}: ProfileRootOverlayProps) {
  const resolvedParams = params ? await params : undefined;
  const user = resolvedParams?.user;

  if (!user) {
    notFound();
  }

  return renderInOverlay(
    <UserPage {...getUserPageProps({ user, searchParams })} />
  );
}

export async function renderNativeProfileCatchAllOverlay({
  params,
  searchParams,
}: ProfileCatchAllPageProps) {
  const resolvedParams = await params;
  const user = resolvedParams.user;
  const cmsPath = resolvedParams.cmsPath ?? [];
  const firstSegment = cmsPath[0]?.toLowerCase();

  const handledLegacyRedirect = await redirectLegacyProfileSubroute({
    cmsPath,
    searchParams,
    user,
  });

  if (handledLegacyRedirect) {
    return renderInOverlay(null);
  }

  const subrouteRenderer = firstSegment
    ? USER_SUBROUTE_RENDERERS[firstSegment]
    : undefined;

  if (subrouteRenderer) {
    return renderInOverlay(
      subrouteRenderer(getUserPageProps({ user, searchParams }))
    );
  }

  return renderInOverlay(
    <ProfileCmsPage
      params={Promise.resolve({ user, cmsPath })}
      searchParams={searchParams}
    />
  );
}
