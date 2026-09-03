"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { ProfileWaveActivityQueryState } from "@/hooks/useProfileWaveActivityWaves";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";
import UserPageBrainSidebarLoadMore from "./UserPageBrainSidebarLoadMore";
import UserPageBrainSidebarSectionState, {
  BRAIN_SIDEBAR_ACTION_BUTTON_CLASS,
  BRAIN_SIDEBAR_COMPLETION_CLASS,
} from "./UserPageBrainSidebarSectionState";
import UserPageBrainSidebarWaveItem from "./UserPageBrainSidebarWaveItem";
import { keepFocusedSidebarControlVisible } from "./userPageBrainSidebar.helpers";

const DEFAULT_VISIBLE_CREATED_WAVES = 5;
const CREATED_WAVES_LIST_ID = "brain-created-waves-list";

interface UserPageBrainSidebarCreatedProps {
  readonly identity: string;
  readonly state: ProfileWaveActivityQueryState;
}

export default function UserPageBrainSidebarCreated({
  identity,
  state,
}: UserPageBrainSidebarCreatedProps) {
  const locale = useBrowserLocale();
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const [expandedIdentity, setExpandedIdentity] = useState<string | null>(null);
  const isExpanded = expandedIdentity === identity;
  const visibleWaves = isExpanded
    ? state.waves
    : state.waves.slice(0, DEFAULT_VISIBLE_CREATED_WAVES);
  const canRevealMore =
    state.waves.length > DEFAULT_VISIBLE_CREATED_WAVES || state.hasNextPage;

  useLayoutEffect(() => {
    const button = toggleButtonRef.current;
    if (button && globalThis.document.activeElement === button) {
      keepFocusedSidebarControlVisible(button);
    }
  }, [isExpanded]);

  if (state.status === "success" && state.waves.length === 0) {
    return null;
  }

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

      <UserPageBrainSidebarSectionState
        state={state}
        loadErrorMessageKey="user.brain.sidebar.createdLoadError"
        emptyMessageKey="user.brain.sidebar.createdEmpty"
      />

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
                ref={toggleButtonRef}
                type="button"
                onClick={() =>
                  setExpandedIdentity(isExpanded ? null : identity)
                }
                className={BRAIN_SIDEBAR_ACTION_BUTTON_CLASS}
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
                  buttonClassName={BRAIN_SIDEBAR_ACTION_BUTTON_CLASS}
                  completionClassName={BRAIN_SIDEBAR_COMPLETION_CLASS}
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
