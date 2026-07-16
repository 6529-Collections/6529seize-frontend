"use client";

import { useAuth } from "@/components/auth/Auth";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isOwnProfileRoute } from "@/helpers/ProfileHelpers";
import useCapacitor from "@/hooks/useCapacitor";
import { useIdentity } from "@/hooks/useIdentity";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import UserPageTab from "./UserPageTab";
import {
  DEFAULT_USER_PAGE_TAB,
  USER_PAGE_TABS,
  USER_PAGE_TAB_IDS,
  type UserPageTabKey,
  type UserPageVisibilityContext,
  getUserPageTabByRoute,
} from "./userTabs.config";
import { shouldHideSubscriptions } from "./userPageVisibility";
import { shouldDelayUserPageBrainRedirect } from "./userPageBrainAccess";
import { getUserProfileTabsMessage } from "./user-tabs.messages";
import { useUserPageTabIndicator } from "./useUserPageTabIndicator";

const DEFAULT_TAB = DEFAULT_USER_PAGE_TAB;
const subscribeToClientRender = () => () => undefined;
const getClientRenderSnapshot = () => true;
const getServerRenderSnapshot = () => false;

const getVisibilityContext = ({
  showWaves,
  hasProfileWave,
  capacitorIsIos,
  country,
  isOwnProfile,
}: {
  readonly showWaves: boolean;
  readonly hasProfileWave: boolean;
  readonly capacitorIsIos: boolean;
  readonly country: string | null | undefined;
  readonly isOwnProfile: boolean;
}): UserPageVisibilityContext => {
  return {
    showWaves,
    hasProfileWave,
    hideSubscriptions: shouldHideSubscriptions({
      capacitorIsIos,
      country,
    }),
    isOwnProfile,
  };
};

const resolveTabFromPath = (pathname: string): UserPageTabKey => {
  const segments = pathname.split("/").filter(Boolean);
  const routeSegment = segments[1] ?? "";
  const match = getUserPageTabByRoute(routeSegment);
  return match?.id ?? DEFAULT_TAB;
};

export default function UserPageTabs({
  initialProfile,
}: {
  readonly initialProfile: ApiIdentity;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const handleOrWallet = params["user"]?.toString() ?? "";
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { showWaves, connectedProfile, fetchingProfile } = useAuth();
  const { address, connectionState } = useSeizeConnectContext();
  const { profile: viewedProfile } = useIdentity({
    handleOrWallet,
    initialProfile,
  });
  const resolvedViewedProfile = viewedProfile ?? initialProfile;

  const isOwnProfile = useMemo(() => {
    return isOwnProfileRoute({
      connectedProfile,
      handleOrWallet,
    });
  }, [connectedProfile, handleOrWallet]);

  const hasProfileWave = Boolean(resolvedViewedProfile.profile_wave_id);

  const visibilityContext = useMemo(
    () =>
      getVisibilityContext({
        showWaves,
        hasProfileWave,
        capacitorIsIos: capacitor.isIos,
        country,
        isOwnProfile,
      }),
    [capacitor.isIos, country, hasProfileWave, isOwnProfile, showWaves]
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { activeIndicator, updateActiveIndicator } =
    useUserPageTabIndicator(contentContainerRef);
  const isClientHydrated = useSyncExternalStore(
    subscribeToClientRender,
    getClientRenderSnapshot,
    getServerRenderSnapshot
  );

  const resolvedTabFromPath = useMemo<UserPageTabKey>(
    () => resolveTabFromPath(pathname),
    [pathname]
  );

  const preserveProxyTabWhileOwnershipLoads =
    fetchingProfile &&
    !connectedProfile &&
    resolvedTabFromPath === USER_PAGE_TAB_IDS.PROXY;

  const shouldSuppressBrainRedirect =
    resolvedTabFromPath === USER_PAGE_TAB_IDS.BRAIN &&
    shouldDelayUserPageBrainRedirect({
      address,
      connectedProfile,
      connectionState,
      fetchingProfile,
      isClientHydrated,
    });
  const preserveBrainTabWhileAccessLoads = shouldSuppressBrainRedirect;

  const visibleTabs = useMemo(
    () =>
      USER_PAGE_TABS.filter((tab) => {
        if (
          preserveProxyTabWhileOwnershipLoads &&
          tab.id === USER_PAGE_TAB_IDS.PROXY
        ) {
          return true;
        }

        if (
          preserveBrainTabWhileAccessLoads &&
          tab.id === USER_PAGE_TAB_IDS.BRAIN
        ) {
          return true;
        }

        return tab.isVisible ? tab.isVisible(visibilityContext) : true;
      }),
    [
      preserveBrainTabWhileAccessLoads,
      preserveProxyTabWhileOwnershipLoads,
      visibilityContext,
    ]
  );

  const resolvedTabIsVisible = useMemo(
    () => visibleTabs.some((tab) => tab.id === resolvedTabFromPath),
    [resolvedTabFromPath, visibleTabs]
  );

  const activeTab = useMemo<UserPageTabKey>(() => {
    if (resolvedTabIsVisible) {
      return resolvedTabFromPath;
    }

    const firstVisibleTab = visibleTabs[0]?.id;
    // Note: If no tabs are visible, defaults to DEFAULT_TAB.
    // This is safe since rendering iterates visibleTabs (which would be empty).
    return firstVisibleTab ?? DEFAULT_TAB;
  }, [resolvedTabFromPath, resolvedTabIsVisible, visibleTabs]);

  // Redirect to the first visible tab whenever the resolved tab becomes
  // hidden because the visibility context changed (country, feature flags,
  // etc.). When loading `/brain` directly, delay the redirect until the client
  // has mounted and wallet/profile restoration has settled.
  useEffect(() => {
    if (
      !visibleTabs.length ||
      resolvedTabIsVisible ||
      !handleOrWallet ||
      shouldSuppressBrainRedirect
    ) {
      return;
    }

    const fallbackTab = visibleTabs[0];
    if (!fallbackTab) {
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
    pathname,
    resolvedTabIsVisible,
    router,
    searchString,
    shouldSuppressBrainRedirect,
    visibleTabs,
  ]);

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const contentContainer = contentContainerRef.current;
    if (!container) return;

    checkScroll();
    updateActiveIndicator();
    const updateTabsLayout = () => {
      checkScroll();
      updateActiveIndicator();
    };
    container.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", updateTabsLayout);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateTabsLayout);

      resizeObserver.observe(container);
      if (contentContainer) {
        resizeObserver.observe(contentContainer);
      }
    }

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", updateTabsLayout);
      resizeObserver?.disconnect();
    };
  }, [checkScroll, updateActiveIndicator]);

  useEffect(() => {
    if (!visibleTabs.length) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        checkScroll();
        updateActiveIndicator();
      });
    });
  }, [activeTab, checkScroll, updateActiveIndicator, visibleTabs]);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -150, behavior: "smooth" });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: 150, behavior: "smooth" });
  };

  return (
    <nav
      aria-label={getUserProfileTabsMessage(
        "user.profile.tabs.navigationLabel"
      )}
      className="tw-relative tw-overflow-hidden tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-700"
    >
      <div
        ref={scrollContainerRef}
        data-profile-tabs-scroll
        className="tw-w-full tw-overflow-x-auto tw-overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:tw-hidden"
      >
        <div
          ref={contentContainerRef}
          className="-tw-mb-px tw-relative tw-flex tw-min-w-max tw-gap-x-3 lg:tw-gap-x-4"
        >
          {visibleTabs.map((tabConfig) => (
            <UserPageTab
              key={tabConfig.id}
              tab={tabConfig}
              activeTabId={activeTab}
            />
          ))}
          <span
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-h-0.5 tw-w-px tw-origin-left tw-bg-primary-400 tw-transition-[transform,opacity] tw-duration-200 tw-ease-out motion-reduce:tw-transition-none"
            style={{
              opacity: activeIndicator.visible ? 1 : 0,
              transform: `translate3d(${activeIndicator.left}px, 0, 0) scaleX(${activeIndicator.width})`,
            }}
          />
        </div>
      </div>
      {canScrollLeft && (
        <>
          <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-top-0 tw-z-10 tw-w-16 tw-bg-gradient-to-r tw-from-black tw-via-black/40 tw-to-black/0" />
          <button
            onClick={scrollLeft}
            aria-label={getUserProfileTabsMessage(
              "user.profile.tabs.scrollLeft"
            )}
            className="tw-group tw-absolute tw-left-0 tw-top-1/2 tw-z-20 tw-inline-flex tw-h-10 tw-w-8 tw--translate-y-1/2 tw-items-center tw-justify-center tw-rounded-md tw-border-none tw-bg-transparent tw-p-0 tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400"
          >
            <FontAwesomeIcon
              icon={faChevronLeft}
              className="tw-h-3.5 tw-w-3.5 tw-text-iron-400 tw-transition-colors tw-duration-150 tw-ease-out group-hover:tw-text-iron-200"
            />
          </button>
        </>
      )}
      {canScrollRight && (
        <>
          <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-right-0 tw-top-0 tw-z-10 tw-w-16 tw-bg-gradient-to-l tw-from-black tw-via-black/40 tw-to-black/0" />
          <button
            onClick={scrollRight}
            aria-label={getUserProfileTabsMessage(
              "user.profile.tabs.scrollRight"
            )}
            className="tw-group tw-absolute tw-right-0 tw-top-1/2 tw-z-20 tw-inline-flex tw-h-10 tw-w-8 tw--translate-y-1/2 tw-items-center tw-justify-center tw-rounded-md tw-border-none tw-bg-transparent tw-p-0 tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400"
          >
            <FontAwesomeIcon
              icon={faChevronRight}
              className="tw-h-3.5 tw-w-3.5 tw-text-iron-400 tw-transition-colors tw-duration-150 tw-ease-out group-hover:tw-text-iron-200"
            />
          </button>
        </>
      )}
    </nav>
  );
}
