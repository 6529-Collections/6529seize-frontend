"use client";

import { DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { ProfileWaveActivityQueryState } from "@/hooks/useProfileWaveActivityWaves";
import { formatInteger } from "@/i18n/format";
import { PreviewModalShell } from "@/components/waves/drops/PreviewModalShell";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";
import UserPageBrainSidebarLoadMore from "./UserPageBrainSidebarLoadMore";
import UserPageBrainSidebarWaveItem from "./UserPageBrainSidebarWaveItem";

const MODAL_ACTION_BUTTON_CLASS =
  "tw-inline-flex tw-min-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800 motion-reduce:tw-transition-none";

function getCreatedCountMessageKey({
  hasNextPage,
  count,
}: {
  readonly hasNextPage: boolean;
  readonly count: number;
}) {
  if (hasNextPage) {
    if (count === 1) {
      return "user.brain.sidebar.loadedCreatedCount.one" as const;
    }
    return "user.brain.sidebar.loadedCreatedCount.other" as const;
  }

  if (count === 1) {
    return "user.brain.sidebar.createdCount.one" as const;
  }
  return "user.brain.sidebar.createdCount.other" as const;
}

interface UserPageBrainSidebarCreatedModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly profileDisplayName: string;
  readonly state: ProfileWaveActivityQueryState;
}

export default function UserPageBrainSidebarCreatedModal({
  isOpen,
  onClose,
  profileDisplayName,
  state,
}: UserPageBrainSidebarCreatedModalProps) {
  const locale = useBrowserLocale();
  const formattedCount = formatInteger(locale, state.waves.length);
  const countLabel = getUserPageBrainSidebarMessage(
    locale,
    getCreatedCountMessageKey({
      hasNextPage: state.hasNextPage,
      count: state.waves.length,
    }),
    { count: formattedCount }
  );
  return (
    <PreviewModalShell isOpen={isOpen} onClose={onClose} maxWidth="3xl">
      {(isApp) => (
        <div className="tailwind-scope tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-white/5 tw-bg-[#0E1012] tw-shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
          <header
            className={`tw-relative tw-z-[100] tw-flex tw-items-start tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/60 ${
              isApp ? "tw-px-6 tw-py-4" : "tw-p-6"
            }`}
          >
            <div className="tw-min-w-0 tw-flex-1">
              <DialogTitle className="tw-m-0 tw-truncate tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100 sm:tw-text-2xl">
                {getUserPageBrainSidebarMessage(
                  locale,
                  "user.brain.sidebar.createdModalTitle",
                  { profile: profileDisplayName }
                )}
              </DialogTitle>
              {!state.isInitialLoading && !state.isInitialError && (
                <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-500">
                  {countLabel}
                </p>
              )}
            </div>

            {!isApp && (
              <button
                type="button"
                onClick={onClose}
                className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-800/70 tw-bg-iron-950 tw-text-white tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-scale-95 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900 motion-reduce:tw-transition-none"
                aria-label={getUserPageBrainSidebarMessage(
                  locale,
                  "user.brain.sidebar.closeCreatedWaves"
                )}
              >
                <XMarkIcon aria-hidden="true" className="tw-h-5 tw-w-5" />
              </button>
            )}
          </header>

          <div
            className={
              isApp
                ? "tw-flex-1"
                : "tw-max-h-[calc(75vh-120px)] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 sm:tw-max-h-[calc(90vh-140px)]"
            }
          >
            <div className="tw-p-6">
              {state.isInitialLoading && (
                <div className="tw-space-y-2.5" aria-hidden="true">
                  {[0, 1, 2].map((key) => (
                    <div
                      key={key}
                      className="tw-h-[66px] tw-animate-pulse tw-rounded-xl tw-bg-white/5 motion-reduce:tw-animate-none"
                    />
                  ))}
                </div>
              )}

              {state.isInitialError && (
                <div className="tw-border-red-500/20 tw-bg-red-500/5 tw-rounded-xl tw-border tw-border-solid tw-p-4">
                  <p className="tw-m-0 tw-text-sm tw-text-iron-300">
                    {getUserPageBrainSidebarMessage(
                      locale,
                      "user.brain.sidebar.createdLoadError"
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => void state.refetch()}
                    className={`${MODAL_ACTION_BUTTON_CLASS} tw-mt-3`}
                  >
                    {getUserPageBrainSidebarMessage(
                      locale,
                      "user.brain.sidebar.retry"
                    )}
                  </button>
                </div>
              )}

              {state.status === "success" && state.waves.length === 0 && (
                <p className="tw-m-0 tw-py-8 tw-text-center tw-text-sm tw-text-iron-500">
                  {getUserPageBrainSidebarMessage(
                    locale,
                    "user.brain.sidebar.createdEmpty"
                  )}
                </p>
              )}

              {state.waves.length > 0 && (
                <div className="tw-space-y-2.5">
                  {state.waves.map((wave) => (
                    <UserPageBrainSidebarWaveItem
                      key={wave.id}
                      wave={wave}
                      showTotalPosts
                    />
                  ))}

                  <UserPageBrainSidebarLoadMore
                    state={state}
                    buttonClassName={`${MODAL_ACTION_BUTTON_CLASS} tw-w-full`}
                    completionClassName="tw-m-0 tw-rounded-sm tw-py-2 tw-text-center tw-text-sm tw-font-semibold tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                    containerClassName="tw-mt-2 tw-space-y-2"
                    errorClassName="tw-m-0 tw-text-sm tw-text-red-300/80"
                    showErrorMessage
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PreviewModalShell>
  );
}
