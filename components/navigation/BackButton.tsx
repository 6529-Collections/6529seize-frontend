"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigationHistoryContext } from "../../contexts/NavigationHistoryContext";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Spinner from "../utils/Spinner";
import { useWaveData } from "../../hooks/useWaveData";
import { useWave } from "../../hooks/useWave";
import { useViewContext } from "./ViewContext";

export default function BackButton() {
  const { canGoBack, goBack } = useNavigationHistoryContext();
  const { hardBack } = useViewContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stopLoading = () => setLoading(false);
    router.events.on("routeChangeComplete", stopLoading);
    router.events.on("routeChangeError", stopLoading);
    return () => {
      router.events.off("routeChangeComplete", stopLoading);
      router.events.off("routeChangeError", stopLoading);
    };
  }, [router.events]);

  const waveId =
    typeof router.query.wave === "string" ? router.query.wave : null;
  const dropId =
    typeof router.query.drop === "string" ? router.query.drop : null;

  // Fetch wave to determine if it is DM
  const { data: wave } = useWaveData({
    waveId: waveId,
    onWaveNotFound: () => {
      const newQuery = { ...router.query } as Record<string, any>;
      delete newQuery.wave;
      router.replace(
        { pathname: router.pathname, query: newQuery },
        undefined,
        { shallow: true }
      );
    },
  });

  const { isDm } = useWave(wave);

  const handleClick = () => {
    if (loading) return;
    setLoading(true);
    if (dropId) {
      const newQuery = { ...router.query } as Record<string, any>;
      delete newQuery.drop;
      router.replace(
        { pathname: router.pathname, query: newQuery },
        undefined,
        {
          shallow: true,
        }
      );
      return;
    }

    if (waveId) {
      const targetView = isDm ? "messages" : "waves";
      hardBack(targetView);
      return;
    }

    if (canGoBack) {
      goBack();
    }
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
