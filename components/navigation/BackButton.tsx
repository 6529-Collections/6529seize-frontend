"use client";

import { Capacitor } from "@capacitor/core";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import Spinner from "../utils/Spinner";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import {
  getActiveWaveIdFromUrl,
  getMessageIdFromPathname,
  getMessagesBaseRoute,
  isMessageComposePathname,
  getWavesBaseRoute,
  getWaveHomeRoute,
} from "@/helpers/navigation.helpers";
import { useNavigationHistoryContext } from "@/contexts/NavigationHistoryContext";
import { useWaveInformation } from "@/contexts/WaveInformationContext";
import { useClosingDropId } from "@/hooks/useClosingDropId";
import { useExitActiveWave } from "./useExitActiveWave";
import { isCompetitionPathname } from "@/helpers/competition.helpers";
import { getMissingWaveNavigationRoute } from "@/helpers/waves/missing-wave-navigation.helpers";
import {
  isProfileWavesFeed,
  returnsToProfileWavesFeed,
} from "@/helpers/waves/profile-feed-navigation";
import { runPhoneChevronBackTransition } from "@/helpers/waves/wave-navigation-transition";

export default function BackButton({
  returnTo,
  className,
}: {
  readonly returnTo?: string | null | undefined;
  readonly className?: string | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [loading, startNavigation] = useTransition();
  const { isApp } = useDeviceInfo();
  const myStream = useMyStreamOptional();
  const exitActiveWave = useExitActiveWave();
  const { goBack, goBackTo } = useNavigationHistoryContext();
  const information = useWaveInformation();

  const waveId =
    myStream?.activeWave.id ??
    getActiveWaveIdFromUrl({ pathname, searchParams }) ??
    null;
  const dropIdFromUrl = searchParams.get("drop") ?? undefined;
  const { effectiveDropId: dropId, beginClosingDrop } =
    useClosingDropId(dropIdFromUrl);

  const isInMessagesContext = pathname.startsWith("/messages");
  const isClientFeedReturn =
    isApp &&
    returnTo === "/waves" &&
    !!myStream &&
    isProfileWavesFeed(pathname, searchParams);

  useEffect(() => {
    if (!returnTo || isClientFeedReturn) {
      return;
    }

    router.prefetch(returnTo);
  }, [returnTo, router, isClientFeedReturn]);

  // Fetch wave to determine if it is DM
  const { data: wave } = useWaveData({
    waveId: waveId,
    onWaveNotFound: isCompetitionPathname(pathname)
      ? undefined
      : () => {
          const route = getMissingWaveNavigationRoute(waveId);
          if (!route) return;
          myStream?.activeWave.set(null);
          const params = route.searchParams;
          params.delete("wave");
          const basePath = getWaveHomeRoute({
            isDirectMessage: route.pathname.startsWith("/messages"),
            isApp,
          });
          const newUrl = params.toString()
            ? `${basePath}?${params.toString()}`
            : basePath;
          router.replace(newUrl, { scroll: false });
        },
  });

  const { isDm } = useWave(wave);

  const isMessageRoute =
    Boolean(getMessageIdFromPathname(pathname)) ||
    (pathname === getMessagesBaseRoute(isApp) && searchParams.has("wave"));
  const isDirectMessage = isMessageRoute || isDm;
  const isWaveListReturn =
    (pathname === "/waves" || pathname.startsWith("/waves/")) &&
    !isDirectMessage &&
    !returnsToProfileWavesFeed(searchParams);
  const shouldAnimateConversationBack =
    isApp &&
    Capacitor.getPlatform() === "ios" &&
    (isMessageRoute || isWaveListReturn);

  const handleClick = () => {
    if (loading) return;
    if (information?.returnFromNavigation) {
      information.returnFromNavigation();
      return;
    }

    // Create routes → go to base route
    if (pathname === "/waves/create") {
      router.replace(getWavesBaseRoute(isApp));
      return;
    }

    if (isMessageComposePathname(pathname)) {
      router.replace(getMessagesBaseRoute(isApp));
      return;
    }

    // Drop open → close drop (remove ?drop param)
    if (dropId) {
      beginClosingDrop(dropId);
      const params = new URLSearchParams(searchParamsString || "");
      params.delete("drop");
      const basePath =
        pathname ||
        getWaveHomeRoute({
          isDirectMessage: isInMessagesContext || isDm,
          isApp,
        });
      const newUrl = params.toString()
        ? `${basePath}?${params.toString()}`
        : basePath;
      router.replace(newUrl, { scroll: false });
      return;
    }

    // Inside a wave → go back to wave list
    if (waveId) {
      const leave = () => exitActiveWave(isDirectMessage);
      if (shouldAnimateConversationBack) {
        runPhoneChevronBackTransition(
          getWaveHomeRoute({ isDirectMessage, isApp }),
          leave
        );
      } else {
        leave();
      }
      return;
    }

    if (returnTo) {
      if (isClientFeedReturn) {
        myStream.activeWave.set(null);
        return;
      }
      startNavigation(() => goBackTo(returnTo));
      return;
    }

    // Fallback: use navigation history
    startNavigation(() => goBack());
  };

  return (
    <button
      type="button"
      aria-label="Back"
      aria-busy={loading}
      disabled={loading}
      onClick={handleClick}
      className={`tw-relative tw-flex tw-size-11 tw-touch-manipulation tw-items-center tw-justify-center tw-rounded-lg tw-border-none tw-bg-transparent tw-p-0 tw-transition-colors tw-duration-150 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 active:tw-bg-white/[0.08] disabled:tw-cursor-default disabled:tw-opacity-70 desktop-hover:hover:tw-bg-white/[0.06] ${className ?? ""}`}
    >
      <ChevronLeftIcon
        strokeWidth={2}
        className={`tw-size-6 tw-flex-shrink-0 tw-text-iron-50 ${loading && !returnTo ? "tw-animate-[fadeIn_0s_linear_100ms_reverse_both]" : ""}`}
      />
      {loading && !returnTo && (
        <span className="tw-absolute tw-inset-0 tw-flex tw-animate-[fadeIn_0s_linear_100ms_both] tw-items-center tw-justify-center">
          <Spinner />
        </span>
      )}
    </button>
  );
}
