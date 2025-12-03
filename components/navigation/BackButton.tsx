"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Spinner from "../utils/Spinner";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import {
  getMessagesBaseRoute,
  getWavesBaseRoute,
  getWaveHomeRoute,
} from "@/helpers/navigation.helpers";
import { useViewContext } from "./ViewContext";
import { useNavigationHistoryContext } from "@/contexts/NavigationHistoryContext";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { isApp } = useDeviceInfo();
  const myStream = useMyStreamOptional();
  const { clearLastVisited } = useViewContext();
  const { goBack } = useNavigationHistoryContext();

  const waveId = myStream?.activeWave.id ?? searchParams?.get("wave") ?? null;
  const dropId = searchParams?.get("drop") ?? null;

  const isInMessagesContext = pathname === "/messages";

  // Fetch wave to determine if it is DM
  const { data: wave } = useWaveData({
    waveId: waveId,
    onWaveNotFound: () => {
      myStream?.activeWave.set(null);
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("wave");
      const basePath =
        pathname ??
        getWaveHomeRoute({
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
  }, [pathname, searchParams?.toString()]);

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
      setLoading(true);
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("drop");
      const basePath =
        pathname ??
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
      className="tw-flex tw-items-center tw-justify-center tw-h-10 tw-w-10 tw-bg-transparent tw-border-none">
      {loading ? (
        <Spinner />
      ) : (
        <ArrowLeftIcon className="tw-size-6 tw-flex-shrink-0 tw-text-iron-50" />
      )}
    </button>
  );
}
