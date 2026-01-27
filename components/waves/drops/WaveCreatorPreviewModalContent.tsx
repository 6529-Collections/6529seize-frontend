"use client";

import React, { useCallback } from "react";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { useWaves } from "@/hooks/useWaves";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { WaveCreatorPreviewItem } from "./WaveCreatorPreviewItem";
import { shortenAddress } from "@/helpers/address.helpers";
import { useRouter } from "next/navigation";
import type { ApiWave } from "@/generated/models/ApiWave";

interface WaveCreatorPreviewModalContentProps {
  readonly user: ApiProfileMin;
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

  const {
    waves,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    status,
    error,
  } = useWaves({
    identity,
    waveName: null,
    enabled: isOpen,
    directMessage: false,
  });

  const onBottomIntersection = (state: boolean) => {
    if (
      !state ||
      status === "pending" ||
      isFetching ||
      isFetchingNextPage ||
      !hasNextPage
    ) {
      return;
    }
    // React Query surfaces errors via hook state.
    void fetchNextPage();
  };

  const isInitialLoading = status === "pending" && waves.length === 0;
  const showEmptyState =
    !isInitialLoading && !isFetching && waves.length === 0 && !error;
  const wavePlural = waves.length === 1 ? "" : "s";
  const waveCountLabel = isInitialLoading
    ? "Loading waves..."
    : `Showing ${waves.length} wave${wavePlural}`;
  const handleWaveSelect = useCallback(
    (_wave: ApiWave, href: string) => {
      router.push(href);
    },
    [router]
  );

  return (
    <div className="tailwind-scope tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-white/5 tw-bg-[#0E1012] tw-shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
      <div
        className={`tw-relative tw-z-[100] tw-flex tw-flex-col tw-gap-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between ${
          isApp ? "tw-px-6 tw-py-4" : "tw-p-6"
        } tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/60`}
      >
        <div>
          <div className="tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl">
            Waves by {displayName}
          </div>
          <div className="tw-mt-1 tw-text-sm tw-text-iron-500">
            {waveCountLabel}
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
          {isInitialLoading ? (
            <div className="tw-flex tw-h-64 tw-items-center tw-justify-center">
              <div className="tw-flex tw-flex-col tw-items-center tw-gap-3">
                <CircleLoader size={CircleLoaderSize.LARGE} />
                <span className="tw-text-sm tw-text-iron-400">
                  Loading waves...
                </span>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="tw-rounded-lg tw-border tw-border-rose-500/30 tw-bg-rose-500/10 tw-px-4 tw-py-3 tw-text-sm tw-text-rose-300">
                  Unable to load waves right now. Please try again.
                </div>
              )}
              {showEmptyState && (
                <div className="tw-rounded-lg tw-border tw-border-iron-800/60 tw-bg-iron-900/40 tw-px-4 tw-py-3 tw-text-sm tw-text-iron-400">
                  No waves created yet.
                </div>
              )}
              {waves.length > 0 && (
                <div className="tw-flex tw-flex-col tw-gap-3">
                  {waves.map((wave) => (
                    <WaveCreatorPreviewItem
                      key={wave.id}
                      wave={wave}
                      onSelect={handleWaveSelect}
                    />
                  ))}
                </div>
              )}
              {(isFetchingNextPage || (isFetching && waves.length > 0)) && (
                <div className="tw-mt-4 tw-flex tw-justify-center">
                  <CircleLoader size={CircleLoaderSize.MEDIUM} />
                </div>
              )}
              <CommonIntersectionElement
                onIntersection={onBottomIntersection}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
