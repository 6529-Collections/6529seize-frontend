"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useNavigationHistoryContext } from "@/contexts/NavigationHistoryContext";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { markDropCloseNavigation } from "@/helpers/drop-close-navigation.helpers";
import {
  getActiveWaveIdFromUrl,
  getMessagesBaseRoute,
  getWaveHomeRoute,
  getWavesBaseRoute,
} from "@/helpers/navigation.helpers";
import { useClosingDropId } from "@/hooks/useClosingDropId";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";

import Spinner from "../utils/Spinner";

import { useViewContext } from "./ViewContext";


export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [loading, setLoading] = useState(false);
  const { isApp } = useDeviceInfo();
  const myStream = useMyStreamOptional();
  const { clearLastVisited } = useViewContext();
  const { goBack } = useNavigationHistoryContext();

  const waveId =
    myStream?.activeWave.id ??
    getActiveWaveIdFromUrl({ pathname, searchParams }) ??
    null;
  const dropIdFromUrl = searchParams.get("drop") ?? undefined;
  const { effectiveDropId: dropId, beginClosingDrop } =
    useClosingDropId(dropIdFromUrl);

  const isInMessagesContext = pathname.startsWith("/messages");

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

  // Reset loading when URL changes
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParamsString]);

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
      markDropCloseNavigation();
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
      clearLastVisited(isDm ? "dm" : "wave");
      myStream?.activeWave.set(null, { isDirectMessage: isDm });
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
      onClick={handleClick}
      className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-border-none tw-bg-transparent"
    >
      {loading ? (
        <Spinner />
      ) : (
        <ArrowLeftIcon className="tw-size-6 tw-flex-shrink-0 tw-text-iron-50" />
      )}
    </button>
  );
}
