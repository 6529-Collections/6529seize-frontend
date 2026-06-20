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

type UserSubrouteRenderer = (
  props: UserPageProps
) => Promise<ReactNode | void> | ReactNode | void;

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
  brain: (props) => BrainPage(props),
  collected: (props) => CollectedPage(props),
  curations: (props) => CurationsPage(props),
  followers: (props) => FollowersPage({ params: props.params }),
  groups: (props) => GroupsPage({ params: props.params }),
  identity: (props) => IdentityPage(props),
  proxy: (props) => ProxyPage(props),
  subscriptions: (props) => SubscriptionsPage(props),
  waves: (props) => UserWavesPage(props),
  xtdh: (props) => XtdhPage(props),
};

const renderInOverlay = (children: ReactNode) => (
  <NativeRouteOverlay>{children}</NativeRouteOverlay>
);

export async function renderNativeProfileRootOverlay({
  params,
  searchParams,
}: ProfileRootOverlayProps) {
  const resolvedParams = params ? await params : undefined;
  const user = resolvedParams?.user ?? "";

  return renderInOverlay(
    await UserPage(getUserPageProps({ user, searchParams }))
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
  const subrouteRenderer = firstSegment
    ? USER_SUBROUTE_RENDERERS[firstSegment]
    : undefined;

  if (subrouteRenderer) {
    const content = await subrouteRenderer(
      getUserPageProps({ user, searchParams })
    );
    return renderInOverlay(content ?? null);
  }

  return renderInOverlay(
    await ProfileCmsPage({
      params: Promise.resolve({ user, cmsPath }),
      searchParams,
    })
  );
}
