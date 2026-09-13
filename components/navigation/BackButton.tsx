"use client";

import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Spinner from "../utils/Spinner";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import {
  getActiveWaveIdFromUrl,
  getMessagesBaseRoute,
  getWavesBaseRoute,
  getWaveHomeRoute,
} from "@/helpers/navigation.helpers";
import { useNavigationHistoryContext } from "@/contexts/NavigationHistoryContext";
import { useClosingDropId } from "@/hooks/useClosingDropId";
import { useExitActiveWave } from "./useExitActiveWave";

export default function BackButton({
  returnTo,
}: {
  readonly returnTo?: string | null | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [loading, setLoading] = useState(false);
  const { isApp } = useDeviceInfo();
  const myStream = useMyStreamOptional();
  const exitActiveWave = useExitActiveWave();
  const { goBack, goBackTo } = useNavigationHistoryContext();

  const waveId =
    myStream?.activeWave.id ??
    getActiveWaveIdFromUrl({ pathname, searchParams }) ??
    null;
  const dropIdFromUrl = searchParams.get("drop") ?? undefined;
  const { effectiveDropId: dropId, beginClosingDrop } =
    useClosingDropId(dropIdFromUrl);

  const isInMessagesContext = pathname.startsWith("/messages");

  useEffect(() => {
    if (!returnTo) {
      return;
    }

    router.prefetch(returnTo);
  }, [returnTo, router]);

  // Fetch wave to determine if it is DM
  const { data: wave } = useWaveData({
    waveId: waveId,
    onWaveNotFound: () => {
      myStream?.activeWave.set(null);
      const params = new URLSearchParams(searchParamsString || "");
      params.delete("wave");
      const basePath = getWaveHomeRoute({
        isDirectMessage: isInMessagesContext,
        isApp,
      });
      const newUrl = params.toString()
        ? `${basePath}?${params.toString()}`
        : basePath;
      router.replace(newUrl, { scroll: false });
    },
  });

  const { isDm } = useWave(wave);

  const handleClick = () => {
    if (loading) return;

    // Create routes → go to base route
    if (pathname === "/waves/create") {
      router.replace(getWavesBaseRoute(isApp));
      return;
    }

    if (pathname === "/messages/create") {
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
      exitActiveWave(isDm);
      return;
    }

    if (returnTo) {
      setLoading(true);
      goBackTo(returnTo);
      return;
    }

    // Fallback: use navigation history
    setLoading(true);
    goBack();
  };

  return (
    <button
      type="button"
      aria-label="Back"
      aria-busy={loading}
      disabled={loading}
      onClick={handleClick}
      className="tw-flex tw-size-11 tw-touch-manipulation tw-items-center tw-justify-center tw-rounded-lg tw-border-none tw-bg-transparent tw-p-0 tw-transition-colors tw-duration-150 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 active:tw-bg-white/[0.08] desktop-hover:hover:tw-bg-white/[0.06] disabled:tw-cursor-default disabled:tw-opacity-70"
    >
      {loading && !returnTo ? (
        <Spinner />
      ) : (
        <ChevronLeftIcon
          strokeWidth={2}
          className="tw-size-6 tw-flex-shrink-0 tw-text-iron-50"
        />
      )}
    </button>
  );
}
