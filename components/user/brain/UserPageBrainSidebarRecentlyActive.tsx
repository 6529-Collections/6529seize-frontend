"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { ProfileWaveActivityQueryState } from "@/hooks/useProfileWaveActivityWaves";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";
import UserPageBrainSidebarLoadMore from "./UserPageBrainSidebarLoadMore";
import UserPageBrainSidebarSectionState, {
  BRAIN_SIDEBAR_ACTION_BUTTON_CLASS,
  BRAIN_SIDEBAR_COMPLETION_CLASS,
} from "./UserPageBrainSidebarSectionState";
import UserPageBrainSidebarWaveItem from "./UserPageBrainSidebarWaveItem";

export default function UserPageBrainSidebarRecentlyActive({
  state,
}: {
  readonly state: ProfileWaveActivityQueryState;
}) {
  const locale = useBrowserLocale();

  return (
    <section aria-labelledby="brain-recent-waves-heading">
      <h2
        id="brain-recent-waves-heading"
        className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500"
      >
        {getUserPageBrainSidebarMessage(
          locale,
          "user.brain.sidebar.recentlyActiveHeading"
        )}
      </h2>

      <UserPageBrainSidebarSectionState
        state={state}
        loadErrorMessageKey="user.brain.sidebar.recentLoadError"
        emptyMessageKey="user.brain.sidebar.recentEmpty"
      />

      {state.waves.length > 0 && (
        <div className="tw-mt-3 tw-space-y-2.5">
          {state.waves.map((wave) => (
            <UserPageBrainSidebarWaveItem
              key={wave.id}
              wave={wave}
              showTotalPosts={false}
            />
          ))}

          <UserPageBrainSidebarLoadMore
            state={state}
            buttonClassName={BRAIN_SIDEBAR_ACTION_BUTTON_CLASS}
            completionClassName={BRAIN_SIDEBAR_COMPLETION_CLASS}
            containerClassName="tw-space-y-1"
            errorClassName="tw-m-0 tw-text-xs tw-text-red-300/80"
            showErrorMessage
          />
        </div>
      )}
    </section>
  );
}
