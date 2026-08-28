"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { ProfileWaveActivityQueryState } from "@/hooks/useProfileWaveActivityWaves";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";

export const BRAIN_SIDEBAR_ACTION_BUTTON_CLASS =
  "tw-cursor-pointer tw-rounded-sm tw-border-none tw-bg-transparent tw-px-1 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-500 tw-transition-colors aria-disabled:tw-cursor-wait aria-disabled:tw-opacity-60 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-60 desktop-hover:hover:tw-text-iron-300 motion-reduce:tw-transition-none";

export const BRAIN_SIDEBAR_COMPLETION_CLASS =
  "tw-m-0 tw-block tw-rounded-sm tw-px-1 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

const SKELETON_KEYS = [0, 1, 2, 3, 4] as const;

type LoadErrorMessageKey =
  | "user.brain.sidebar.createdLoadError"
  | "user.brain.sidebar.recentLoadError";

type EmptyMessageKey =
  | "user.brain.sidebar.createdEmpty"
  | "user.brain.sidebar.recentEmpty";

export default function UserPageBrainSidebarSectionState({
  state,
  loadErrorMessageKey,
  emptyMessageKey,
}: {
  readonly state: ProfileWaveActivityQueryState;
  readonly loadErrorMessageKey: LoadErrorMessageKey;
  readonly emptyMessageKey: EmptyMessageKey;
}) {
  const locale = useBrowserLocale();

  if (state.isInitialLoading) {
    return (
      <div className="tw-mt-3 tw-space-y-2.5" aria-hidden="true">
        {SKELETON_KEYS.map((key) => (
          <div
            key={key}
            className="tw-h-[66px] tw-animate-pulse tw-rounded-xl tw-bg-white/5 motion-reduce:tw-animate-none"
          />
        ))}
      </div>
    );
  }

  if (state.isInitialError) {
    return (
      <div className="tw-border-red-500/20 tw-bg-red-500/5 tw-mt-3 tw-rounded-xl tw-border tw-border-solid tw-p-3">
        <p className="tw-m-0 tw-text-xs tw-text-iron-400">
          {getUserPageBrainSidebarMessage(locale, loadErrorMessageKey)}
        </p>
        <button
          type="button"
          onClick={() => void state.refetch()}
          className={`${BRAIN_SIDEBAR_ACTION_BUTTON_CLASS} tw-mt-2`}
        >
          {getUserPageBrainSidebarMessage(locale, "user.brain.sidebar.retry")}
        </button>
      </div>
    );
  }

  if (state.status === "success" && state.waves.length === 0) {
    return (
      <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-text-iron-600">
        {getUserPageBrainSidebarMessage(locale, emptyMessageKey)}
      </p>
    );
  }

  return null;
}
