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
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import { useMemesQuickVoteDialogController } from "@/hooks/useMemesQuickVoteDialogController";
import MemesQuickVoteDialog from "../brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDialog";
import { useNativeProfileNavigation } from "../native-navigation/NativeProfileNavigationProvider";

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
// Matches HeaderPlaceholder's default shell before LayoutContext measures it.
const STREAM_ROUTE_LOADING_HEADER_FALLBACK_RESERVE = "100px";

type StreamRouteLoadingReserveStyle = CSSProperties & {
  readonly [STREAM_ROUTE_LOADING_BOTTOM_RESERVE]: "0px" | "85px";
  readonly [STREAM_ROUTE_LOADING_HEADER_RESERVE]: string;
};

const streamRouteLoadingReserveVisibleStyle: StreamRouteLoadingReserveStyle = {
  [STREAM_ROUTE_LOADING_BOTTOM_RESERVE]: "85px",
  [STREAM_ROUTE_LOADING_HEADER_RESERVE]:
    STREAM_ROUTE_LOADING_HEADER_FALLBACK_RESERVE,
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
      style={streamRouteLoadingReserveVisibleStyle}>
      <HeaderPlaceholder />
      <main>{children}</main>
      <div className="tw-h-[85px] tw-w-full" />
    </div>
  );
}

function AppLayoutContent({ children }: Props) {
  useDeepLinkNavigation();
  const { registerRef, spaces } = useLayout();
  const { setHeaderRef } = useHeaderContext();
  const headerRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense
  const searchParams = useSearchParams();
  const nativeProfileNavigation = useNativeProfileNavigation();
  const effectivePathname =
    nativeProfileNavigation.backgroundLocation?.pathname ?? pathname;
  const effectiveSearchParams = useMemo(
    () =>
      nativeProfileNavigation.backgroundLocation
        ? new URLSearchParams(nativeProfileNavigation.backgroundLocation.search)
        : searchParams,
    [nativeProfileNavigation.backgroundLocation, searchParams]
  );
  const isSingleDropOpen = effectiveSearchParams.get("drop") !== null;
  const waveParam = getActiveWaveIdFromUrl({
    pathname: effectivePathname,
    searchParams: effectiveSearchParams,
  });
  const activeView = getActiveViewFromUrl({
    activeWaveId: waveParam,
    searchParams: effectiveSearchParams,
  });
  const viewParam = effectiveSearchParams.get("view");
  const hasWaveParam = Boolean(waveParam);
  const isViewingWavesOrMessages =
    viewParam === "waves" || viewParam === "messages";
  const isWavesRoute =
    effectivePathname === "/waves" || effectivePathname.startsWith("/waves/");
  const isMessagesRoute =
    effectivePathname === "/messages" ||
    effectivePathname.startsWith("/messages/");
  const isStreamRoute =
    isWavesRoute ||
    isMessagesRoute ||
    effectivePathname === "/notifications" ||
    (effectivePathname === "/" && (hasWaveParam || isViewingWavesOrMessages));
  const editingDropId = useSelector(selectEditingDropId);
  const { isApp } = useDeviceInfo();
  const { isVisible: isAndroidKeyboardVisible, isAndroid } =
    useAndroidKeyboard();
  const { isIos, keyboardVisible: isIosKeyboardVisible } = useCapacitor();
  const isEditingOnMobile = isApp && editingDropId !== null;
  const isKeyboardVisible =
    (isAndroid && isAndroidKeyboardVisible) || (isIos && isIosKeyboardVisible);
  const shouldHideBottomNav = isKeyboardVisible;

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
  const routeLoadingHeaderReserve = spaces.measurementsComplete
    ? `${spaces.headerSpace}px`
    : STREAM_ROUTE_LOADING_HEADER_FALLBACK_RESERVE;
  const streamRouteLoadingReserveStyle = useMemo<StreamRouteLoadingReserveStyle>(
    () => ({
      [STREAM_ROUTE_LOADING_BOTTOM_RESERVE]: isNavVisible ? "85px" : "0px",
      [STREAM_ROUTE_LOADING_HEADER_RESERVE]: routeLoadingHeaderReserve,
    }),
    [isNavVisible, routeLoadingHeaderReserve]
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
    <div
      className={`${safeAreaClass} ${"tw-overflow-auto"}`}
      style={streamRouteLoadingReserveStyle}>
      <PullToRefresh triggerZoneRef={headerRef} />
      <div ref={headerWrapperRef}>
        <TouchDeviceHeader />
      </div>
      {activeContent}
      {!isSingleDropOpen && !isStreamRoute && (
        <div className="tw-h-[85px] tw-w-full" />
      )}
      {!isSingleDropOpen && !isEditingOnMobile && (
        <BottomNavigation hidden={shouldHideBottomNav} />
      )}
    </div>
  );
}

export default function AppLayout({ children }: Props) {
  return (
    <Suspense fallback={<AppLayoutFallback>{children}</AppLayoutFallback>}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  );
}
