"use client";

import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getActiveViewFromUrl } from "../navigation/ViewContext";
import useCreateModalState from "@/hooks/useCreateModalState";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";

function HeaderActionButtonsContent() {
  const pathname = usePathname();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense
  const searchParams = useSearchParams();
  const { openWave, openDirectMessage, isApp } = useCreateModalState();

  const baseButtonClasses =
    "tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-black tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 active:tw-bg-iron-800";

  const waveParam = getActiveWaveIdFromUrl({ pathname, searchParams });
  const activeView = getActiveViewFromUrl({
    activeWaveId: waveParam,
    searchParams,
  });
  const isWaveContext = activeView === "waves";
  const isMessagesContext = activeView === "messages";
  const isOnWaveCreateRoute = pathname === "/waves/create";
  const isOnWavesRoute = pathname === "/waves" && !waveParam;
  const isOnMessagesRoute = pathname === "/messages" && !waveParam;
  const showWaveButton =
    !isOnWaveCreateRoute && (isOnWavesRoute || isWaveContext);
  const showMessagesButton = isOnMessagesRoute || isMessagesContext;

  if (showWaveButton) {
    const onCreateWave = openWave;

    return (
      <button
        type="button"
        aria-label="Create Wave"
        title="Create Wave"
        onClick={onCreateWave}
        className={baseButtonClasses}
      >
        <PlusIcon className="tw-size-5 tw-flex-shrink-0" />
      </button>
    );
  }

  if (showMessagesButton) {
    const icon = (
      <FontAwesomeIcon
        icon={faPaperPlane}
        className="tw-size-[18px] tw-flex-shrink-0"
      />
    );

    if (isApp) {
      // Full prefetch includes the composer beyond the messages loading boundary.
      return (
        <Link
          href="/messages/create"
          prefetch={true}
          aria-label="Create DM"
          title="Create DM"
          className={baseButtonClasses}
        >
          {icon}
        </Link>
      );
    }

    return (
      <button
        type="button"
        aria-label="Create DM"
        title="Create DM"
        onClick={openDirectMessage}
        className={baseButtonClasses}
      >
        {icon}
      </button>
    );
  }

  return null;
}

export default function HeaderViewActionButtons() {
  return (
    <Suspense fallback={null}>
      <HeaderActionButtonsContent />
    </Suspense>
  );
}
