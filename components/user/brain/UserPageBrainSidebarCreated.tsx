"use client";

import { useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { ProfileWaveActivityQueryState } from "@/hooks/useProfileWaveActivityWaves";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";
import UserPageBrainSidebarLoadMore from "./UserPageBrainSidebarLoadMore";
import UserPageBrainSidebarWaveItem from "./UserPageBrainSidebarWaveItem";

const DEFAULT_VISIBLE_CREATED_WAVES = 5;
const CREATED_WAVES_LIST_ID = "brain-created-waves-list";

const ACTION_BUTTON_CLASS =
  "tw-cursor-pointer tw-rounded-sm tw-border-none tw-bg-transparent tw-px-1 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-500 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-60 desktop-hover:hover:tw-text-iron-300 motion-reduce:tw-transition-none";

function CreatedWavesSkeleton() {
  return (
    <div className="tw-mt-3 tw-space-y-2.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((key) => (
        <div
          key={key}
          className="tw-h-[66px] tw-animate-pulse tw-rounded-xl tw-bg-white/5 motion-reduce:tw-animate-none"
        />
      ))}
    </div>
  );
}

interface UserPageBrainSidebarCreatedProps {
  readonly identity: string;
  readonly state: ProfileWaveActivityQueryState;
}

export default function UserPageBrainSidebarCreated({
  identity,
  state,
}: UserPageBrainSidebarCreatedProps) {
  const locale = useBrowserLocale();
  const [expandedIdentity, setExpandedIdentity] = useState<string | null>(null);
  const isExpanded = expandedIdentity === identity;
  const visibleWaves = isExpanded
    ? state.waves
    : state.waves.slice(0, DEFAULT_VISIBLE_CREATED_WAVES);
  const canRevealMore =
    state.waves.length > DEFAULT_VISIBLE_CREATED_WAVES || state.hasNextPage;

  return (
    <section aria-labelledby="brain-created-waves-heading">
      <h2
        id="brain-created-waves-heading"
        className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500"
      >
        {getUserPageBrainSidebarMessage(
          locale,
          "user.brain.sidebar.createdHeading"
        )}
      </h2>

      {state.isInitialLoading && <CreatedWavesSkeleton />}

      {state.isInitialError && (
        <div className="tw-border-red-500/20 tw-bg-red-500/5 tw-mt-3 tw-rounded-xl tw-border tw-border-solid tw-p-3">
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {getUserPageBrainSidebarMessage(
              locale,
              "user.brain.sidebar.createdLoadError"
            )}
          </p>
          <button
            type="button"
            onClick={() => void state.refetch()}
            className={`${ACTION_BUTTON_CLASS} tw-mt-2`}
          >
            {getUserPageBrainSidebarMessage(locale, "user.brain.sidebar.retry")}
          </button>
        </div>
      )}

      {state.status === "success" && state.waves.length === 0 && (
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-text-iron-600">
          {getUserPageBrainSidebarMessage(
            locale,
            "user.brain.sidebar.createdEmpty"
          )}
        </p>
      )}

      {state.waves.length > 0 && (
        <div className="tw-mt-3">
          <div id={CREATED_WAVES_LIST_ID} className="tw-space-y-2.5">
            {visibleWaves.map((wave) => (
              <UserPageBrainSidebarWaveItem
                key={wave.id}
                wave={wave}
                showTotalPosts
              />
            ))}
          </div>

          {(canRevealMore || isExpanded) && (
            <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
              <button
                type="button"
                onClick={() =>
                  setExpandedIdentity(isExpanded ? null : identity)
                }
                className={ACTION_BUTTON_CLASS}
                aria-controls={CREATED_WAVES_LIST_ID}
                aria-expanded={isExpanded}
              >
                {getUserPageBrainSidebarMessage(
                  locale,
                  isExpanded
                    ? "user.brain.sidebar.showLess"
                    : "user.brain.sidebar.showMore"
                )}
              </button>

              {isExpanded && (
                <UserPageBrainSidebarLoadMore
                  state={state}
                  buttonClassName={ACTION_BUTTON_CLASS}
                  completionClassName="tw-m-0 tw-rounded-sm tw-px-1 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                  containerClassName="tw-contents"
                  errorClassName="tw-m-0 tw-text-xs tw-text-red-300/80"
                  showErrorMessage
                />
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
