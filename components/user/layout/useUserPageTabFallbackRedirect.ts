"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { UserPageTabConfig } from "./userTabs.config";

// Redirect to the first visible tab whenever the resolved tab becomes hidden
// because the visibility context changed (country, feature flags, etc.).
// `isRedirectSuppressed` defers the redirect for tabs that depend on state that
// is still loading: wallet/profile restoration or the iOS country lookup.
export function useUserPageTabFallbackRedirect({
  handleOrWallet,
  isRedirectSuppressed,
  pathname,
  resolvedTabIsVisible,
  searchString,
  visibleTabs,
}: {
  readonly handleOrWallet: string;
  readonly isRedirectSuppressed: boolean;
  readonly pathname: string;
  readonly resolvedTabIsVisible: boolean;
  readonly searchString: string;
  readonly visibleTabs: readonly UserPageTabConfig[];
}) {
  const router = useRouter();

  useEffect(() => {
    const fallbackTab = visibleTabs[0];
    if (
      !fallbackTab ||
      resolvedTabIsVisible ||
      !handleOrWallet ||
      isRedirectSuppressed
    ) {
      return;
    }

    const fallbackPath = fallbackTab.route
      ? `/${handleOrWallet}/${fallbackTab.route}`
      : `/${handleOrWallet}`;

    if (fallbackPath === pathname) {
      return;
    }

    const nextUrl = searchString
      ? `${fallbackPath}?${searchString}`
      : fallbackPath;
    router.replace(nextUrl);
  }, [
    handleOrWallet,
    isRedirectSuppressed,
    pathname,
    resolvedTabIsVisible,
    router,
    searchString,
    visibleTabs,
  ]);
}
