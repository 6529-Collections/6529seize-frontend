import type { NavSearchParams } from "./isNavItemActive";
import { isNavItemActive } from "./isNavItemActive";
import type { NavItem as NavItemData, ViewKey } from "./navTypes";

export const getProfileHref = ({
  address,
  handle,
  normalisedHandle,
}: {
  readonly address?: string | null | undefined;
  readonly handle?: string | null | undefined;
  readonly normalisedHandle?: string | null | undefined;
}): string | null => {
  const normalizedConnectedHandle = (
    normalisedHandle ?? handle
  )?.toLowerCase();
  const normalizedConnectedAddress = address?.toLowerCase();
  const profileSlug = normalizedConnectedHandle ?? normalizedConnectedAddress;

  return profileSlug ? `/${profileSlug}` : null;
};

export const getResolvedNavItemState = ({
  activeView,
  isCurrentWaveDm,
  item,
  pathname,
  profileHref,
  searchParams,
}: {
  readonly activeView: ViewKey | null;
  readonly isCurrentWaveDm: boolean;
  readonly item: NavItemData;
  readonly pathname: string;
  readonly profileHref: string | null;
  readonly searchParams: NavSearchParams;
}): {
  readonly isActive: boolean;
  readonly resolvedItem: NavItemData;
} => {
  const isProfileItem = item.kind === "route" && item.name === "Profile";
  const normalizedPathname = pathname.toLowerCase();

  if (isProfileItem && profileHref !== null) {
    const isProfileActive =
      activeView === null &&
      (normalizedPathname === profileHref ||
        normalizedPathname.startsWith(`${profileHref}/`));

    return {
      isActive: isProfileActive,
      resolvedItem: {
        ...item,
        href: profileHref,
      },
    };
  }

  return {
    isActive: isNavItemActive(
      item,
      pathname,
      searchParams,
      activeView,
      isCurrentWaveDm
    ),
    resolvedItem: item,
  };
};
