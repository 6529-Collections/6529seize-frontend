"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useNavigationHistoryContext } from "../../contexts/NavigationHistoryContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Spinner from "../utils/Spinner";
import { useWaveData } from "../../hooks/useWaveData";
import { useWave } from "../../hooks/useWave";
import { useViewContext } from "./ViewContext";

export default function BackButton() {
  const { canGoBack, goBack } = useNavigationHistoryContext();
  const { hardBack } = useViewContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const waveId = searchParams?.get("wave") ?? null;
  const dropId = searchParams?.get("drop") ?? null;

  // Fetch wave to determine if it is DM
  const { data: wave } = useWaveData({
    waveId: waveId,
    onWaveNotFound: () => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("wave");
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : (pathname || '/my-stream');
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

    if (dropId) {
      setLoading(true);
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("drop");
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : (pathname || '/my-stream');
      router.replace(newUrl, { scroll: false });
      return;
    }

    if (waveId) {
      // In-app view switch, not a router nav — no spinner
      const targetView = isDm ? "messages" : "waves";
      hardBack(targetView);
      return;
    }

    if (canGoBack) {
      setLoading(true);
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
