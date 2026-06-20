import NativeRouteOverlay from "@/components/native-navigation/NativeRouteOverlay";
import BrainPage from "@/app/[user]/brain/page";
import CollectedPage from "@/app/[user]/collected/page";
import CurationsPage from "@/app/[user]/curations/page";
import FollowersPage from "@/app/[user]/followers/page";
import GroupsPage from "@/app/[user]/groups/page";
import IdentityPage from "@/app/[user]/identity/page";
import ProfileCmsPage from "@/app/[user]/[...cmsPath]/page";
import ProxyPage from "@/app/[user]/proxy/page";
import SubscriptionsPage from "@/app/[user]/subscriptions/page";
import UserPage from "@/app/[user]/page";
import UserWavesPage from "@/app/[user]/waves/page";
import XtdhPage from "@/app/[user]/xtdh/page";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

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

  // These canonical profile subroutes are redirect-only modules. Calling them
  // here delegates to the same redirect logic without rendering them as pages.
  if (firstSegment === "identity") {
    await IdentityPage(getUserPageProps({ user, searchParams }));
    return true;
  }

  if (firstSegment === "groups") {
    await GroupsPage({ params: Promise.resolve({ user }) });
    return true;
  }

  if (firstSegment === "followers") {
    await FollowersPage({ params: Promise.resolve({ user }) });
    return true;
  }

  if (firstSegment === "waves") {
    await UserWavesPage(getUserPageProps({ user, searchParams }));
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
