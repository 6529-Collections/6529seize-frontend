"use client";

import dynamic from "next/dynamic";
import type { CSSProperties, ReactNode } from "react";
import { Suspense, useCallback, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import BottomNavigation from "../navigation/BottomNavigation";
import { getActiveViewFromUrl } from "../navigation/ViewContext";
import BrainMobileWaves from "../brain/mobile/BrainMobileWaves";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import HeaderPlaceholder from "../header/HeaderPlaceholder";
import { useHeaderContext } from "@/contexts/HeaderContext";
import { useDeepLinkNavigation } from "@/hooks/useDeepLinkNavigation";
import BrainMobileMessages from "../brain/mobile/BrainMobileMessages";
import { useSelector } from "react-redux";
import { selectEditingDropId } from "@/store/editSlice";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useAndroidKeyboard } from "@/hooks/useAndroidKeyboard";
import useCapacitor from "@/hooks/useCapacitor";
import PullToRefresh from "../providers/PullToRefresh";
import {
  getActiveWaveIdFromUrl,
  hidesMobileBottomNavigation,
} from "@/helpers/navigation.helpers";
import { PULL_TO_REFRESH_TRANSFORM_ROOT_ATTRIBUTE } from "@/helpers/pull-to-refresh.helpers";
import { useMemesQuickVoteDialogController } from "@/hooks/useMemesQuickVoteDialogController";
import MemesQuickVoteDialog from "../brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDialog";

const TouchDeviceHeader = dynamic(() => import("../header/AppHeader"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

interface Props {
  readonly children: ReactNode;
}

const STREAM_ROUTE_LOADING_BOTTOM_RESERVE =
  "--stream-route-loading-bottom-reserve";
const STREAM_ROUTE_LOADING_HEADER_RESERVE =
  "--stream-route-loading-header-reserve";
const BOTTOM_NAV_RESERVE = "104px";
// Matches HeaderPlaceholder's default shell before LayoutContext measures it.
const STREAM_ROUTE_LOADING_HEADER_FALLBACK_RESERVE = "100px";

type StreamRouteLoadingReserveStyle = CSSProperties & {
  readonly [STREAM_ROUTE_LOADING_BOTTOM_RESERVE]:
    | "0px"
    | typeof BOTTOM_NAV_RESERVE;
  readonly [STREAM_ROUTE_LOADING_HEADER_RESERVE]: string;
};

const streamRouteLoadingReserveVisibleStyle: StreamRouteLoadingReserveStyle = {
  [STREAM_ROUTE_LOADING_BOTTOM_RESERVE]: BOTTOM_NAV_RESERVE,
  [STREAM_ROUTE_LOADING_HEADER_RESERVE]:
    STREAM_ROUTE_LOADING_HEADER_FALLBACK_RESERVE,
};

const contentOwnsBottomNavClearance = ({
  activeView,
  pathname,
}: {
  readonly activeView: string | null;
  readonly pathname: string | null | undefined;
}): boolean => {
  if (activeView === "waves" || activeView === "messages") {
    return true;
  }

  return (
    pathname === "/waves" ||
    pathname === "/messages" ||
    pathname === "/notifications"
  );
};

function WavesQuickVoteView() {
  const quickVote = useMemesQuickVoteDialogController();

  return (
    <>
      <BrainMobileWaves
        onOpenQuickVote={quickVote.openQuickVote}
        onPrefetchQuickVote={quickVote.prefetchQuickVote}
      />
      <MemesQuickVoteDialog {...quickVote.dialogState} />
    </>
  );
}

function AppLayoutFallback({ children }: Props) {
  return (
    <div
      className="tw-overflow-auto"
      style={streamRouteLoadingReserveVisibleStyle}
    >
      <HeaderPlaceholder />
      <main>{children}</main>
      <div className="tw-h-[104px] tw-w-full" />
    </div>
  );
}

function AppLayoutContent({ children }: Props) {
  useDeepLinkNavigation();
  const { registerRef, spaces } = useLayout();
  const { setHeaderRef } = useHeaderContext();
  const headerRef = useRef<HTMLDivElement | null>(null);
  const pullContentRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense
  const searchParams = useSearchParams();
  const isSingleDropOpen = searchParams.get("drop") !== null;
  const waveParam = getActiveWaveIdFromUrl({ pathname, searchParams });
  const activeView = getActiveViewFromUrl({
    activeWaveId: waveParam,
    searchParams,
  });
  const shouldHideBottomNavForRoute = hidesMobileBottomNavigation({
    pathname,
  });
  const editingDropId = useSelector(selectEditingDropId);
  const { isApp } = useDeviceInfo();
  const { isVisible: isAndroidKeyboardVisible, isAndroid } =
    useAndroidKeyboard();
  const { isIos, keyboardVisible: isIosKeyboardVisible } = useCapacitor();
  const isEditingOnMobile = isApp && editingDropId !== null;
  const isKeyboardVisible =
    (isAndroid && isAndroidKeyboardVisible) || (isIos && isIosKeyboardVisible);
  const shouldHideBottomNav = isKeyboardVisible || shouldHideBottomNavForRoute;

  const headerWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      headerRef.current = node;
      registerRef("header", node);
      setHeaderRef(node);
    },
    [registerRef, setHeaderRef]
  );

  const isNavVisible =
    !isSingleDropOpen && !isEditingOnMobile && !shouldHideBottomNav;
  const shouldRenderBottomNav = !isSingleDropOpen && !isEditingOnMobile;
  const shouldUseContentBottomClearance = contentOwnsBottomNavClearance({
    activeView,
    pathname,
  });
  const routeLoadingHeaderReserve = spaces.measurementsComplete
    ? `${spaces.headerSpace}px`
    : STREAM_ROUTE_LOADING_HEADER_FALLBACK_RESERVE;
  const streamRouteLoadingReserveStyle =
    useMemo<StreamRouteLoadingReserveStyle>(
      () => ({
        [STREAM_ROUTE_LOADING_BOTTOM_RESERVE]:
          isNavVisible && !shouldUseContentBottomClearance
            ? BOTTOM_NAV_RESERVE
            : "0px",
        [STREAM_ROUTE_LOADING_HEADER_RESERVE]: routeLoadingHeaderReserve,
      }),
      [isNavVisible, routeLoadingHeaderReserve, shouldUseContentBottomClearance]
    );
  const safeAreaClass =
    !isNavVisible && !isKeyboardVisible
      ? "tw-pb-[env(safe-area-inset-bottom,0px)]"
      : "";
  let activeContent: ReactNode;

  if (activeView === "messages") {
    activeContent = <BrainMobileMessages />;
  } else if (activeView === "waves") {
    activeContent = <WavesQuickVoteView />;
  } else {
    activeContent = <main>{children}</main>;
  }

  return (
    <>
      <div
        data-mobile-bottom-nav-scroll-target="true"
        className={`${safeAreaClass} ${"tw-overflow-auto"}`}
        style={streamRouteLoadingReserveStyle}
      >
        <PullToRefresh contentRef={pullContentRef} triggerZoneRef={headerRef} />
        <div
          ref={pullContentRef}
          {...{ [PULL_TO_REFRESH_TRANSFORM_ROOT_ATTRIBUTE]: "true" }}
        >
          <div ref={headerWrapperRef}>
            <TouchDeviceHeader />
          </div>
          {activeContent}
          {isNavVisible && !shouldUseContentBottomClearance && (
            <div className="tw-h-[104px] tw-w-full" />
          )}
        </div>
      </div>
      {shouldRenderBottomNav && (
        <BottomNavigation hidden={shouldHideBottomNav} />
      )}
    </>
  );
}

export default function AppLayout({ children }: Props) {
  return (
    <Suspense fallback={<AppLayoutFallback>{children}</AppLayoutFallback>}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  );
}
