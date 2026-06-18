"use client";

import React, { useCallback } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { shortenAddress } from "@/helpers/address.helpers";
import { useRouter } from "next/navigation";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { WaveCreatorPreviewUser } from "./waveCreatorPreview.types";
import {
  useWaveCreatorPreviewWaves,
  WaveCreatorPreviewList,
} from "./WaveCreatorPreviewList";

interface WaveCreatorPreviewModalContentProps {
  readonly user: WaveCreatorPreviewUser;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly isApp?: boolean | undefined;
}

export const WaveCreatorPreviewModalContent: React.FC<
  WaveCreatorPreviewModalContentProps
> = ({ user, isOpen, onClose, isApp = false }) => {
  const router = useRouter();
  const identity = user.handle ?? user.primary_address;
  const displayName = user.handle ?? shortenAddress(user.primary_address);
  const wavesState = useWaveCreatorPreviewWaves({
    identity,
    enabled: isOpen,
  });

  const handleWaveSelect = useCallback(
    (_wave: ApiWave, href: string) => {
      router.push(href);
    },
    [router]
  );

  return (
    <div className="tailwind-scope tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-white/5 tw-bg-[#0E1012] tw-shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
      <div
        className={`tw-relative tw-z-[100] tw-flex tw-items-start tw-justify-between tw-gap-4 sm:tw-items-center ${
          isApp ? "tw-px-6 tw-py-4" : "tw-p-6"
        } tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/60`}
      >
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl">
            Waves by {displayName}
          </div>
          <div className="tw-mt-1 tw-text-sm tw-text-iron-500">
            {wavesState.waveCountLabel}
          </div>
        </div>
        {!isApp && (
          <button
            onClick={onClose}
            className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-800/70 tw-bg-iron-950 tw-text-white tw-transition tw-duration-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-iron-600/70 active:tw-scale-95 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900"
            aria-label="Close wave list"
          >
            <XMarkIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          </button>
        )}
      </div>
      <div
        className={`tw-flex-1 ${
          isApp
            ? ""
            : "tw-max-h-[calc(75vh-120px)] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-max-h-[calc(90vh-140px)]"
        }`}
      >
        <div className="tw-p-6">
          <WaveCreatorPreviewList
            state={wavesState}
            onWaveSelect={handleWaveSelect}
          />
        </div>
      </div>
    </div>
  );
};
