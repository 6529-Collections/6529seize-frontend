"use client";

import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PlusIcon } from "@heroicons/react/24/outline";
import { usePathname, useSearchParams } from "next/navigation";
import { useViewContext } from "../navigation/ViewContext";
import useCreateModalState from "@/hooks/useCreateModalState";

export default function HeaderViewActionButtons() {
  const { activeView } = useViewContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openWave, openDirectMessage } = useCreateModalState();

  const baseButtonClasses =
    "tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-h-10 tw-w-10 tw-border-0 tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out tw-bg-black active:tw-bg-iron-800";

  const waveParam = searchParams?.get("wave");
  const viewParam = searchParams?.get("view");
  const isWaveContext =
    activeView === "waves" || (viewParam === "waves" && !waveParam);
  const isMessagesContext =
    activeView === "messages" || (viewParam === "messages" && !waveParam);
  const isOnWavesRoute = pathname === "/waves" && !waveParam;
  const isOnMessagesRoute = pathname === "/messages" && !waveParam;
  const showWaveButton = isOnWavesRoute || isWaveContext;
  const showMessagesButton = isOnMessagesRoute || isMessagesContext;

  if (showWaveButton) {
    const onCreateWave = openWave;

    return (
      <button
        type="button"
        aria-label="Create Wave"
        title="Create Wave"
        onClick={onCreateWave}
        className={baseButtonClasses}>
        <PlusIcon className="tw-h-6 tw-w-6 tw-flex-shrink-0" />
      </button>
    );
  }

  if (showMessagesButton) {
    const onCreateDm = openDirectMessage;

    return (
      <button
        type="button"
        aria-label="Create DM"
        title="Create DM"
        onClick={onCreateDm}
        className={baseButtonClasses}>
        <FontAwesomeIcon
          icon={faPaperPlane}
          className="tw-h-4 tw-w-4 tw-flex-shrink-0"
        />
      </button>
    );
  }

  return null;
}
