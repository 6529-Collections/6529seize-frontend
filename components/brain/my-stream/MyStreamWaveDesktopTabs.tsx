"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { TabToggle } from "@/components/common/TabToggle";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useWaveCurationGroups } from "@/hooks/waves/useWaveCurationGroups";
import { useWave } from "@/hooks/useWave";
import { useDecisionPoints } from "@/hooks/waves/useDecisionPoints";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { Time } from "@/helpers/time";
import { MyStreamWaveTab } from "@/types/waves.types";
import { useContentTab, WaveVotingState } from "../ContentTabContext";
import MyStreamWaveCurationCreateDialog from "./tabs/MyStreamWaveCurationCreateDialog";
import MyStreamActionTooltip from "./MyStreamActionTooltip";

interface MyStreamWaveDesktopTabsProps {
  readonly activeTab: MyStreamWaveTab;
  readonly wave: ApiWave;
  readonly setActiveTab: (tab: MyStreamWaveTab) => void;
  readonly activeCurationId: string | null;
  readonly onSelectCuration: (curationId: string | null) => void;
}

interface TabOption {
  readonly key: string;
  readonly label: string;
  readonly panelId: string;
}

const getContentTabPanelId = (tab: MyStreamWaveTab): string =>
  `my-stream-wave-tabpanel-${tab.toLowerCase()}`;

const getCurationPanelId = (curationId: string): string =>
  `my-stream-wave-tabpanel-curation-${curationId}`;

const AUTO_EXPAND_LIMIT = 5;

const TAB_LABELS: Record<MyStreamWaveTab, string> = {
  [MyStreamWaveTab.CHAT]: "Chat",
  [MyStreamWaveTab.LEADERBOARD]: "Leaderboard",
  [MyStreamWaveTab.SALES]: "Sales",
  [MyStreamWaveTab.WINNERS]: "Winners",
  [MyStreamWaveTab.OUTCOME]: "Outcome",
  [MyStreamWaveTab.MY_VOTES]: "My Votes",
  [MyStreamWaveTab.FAQ]: "FAQ",
};

const getWaveVotingState = ({
  isUpcoming,
  isCompleted,
}: {
  readonly isUpcoming: boolean;
  readonly isCompleted: boolean;
}): WaveVotingState => {
  if (isUpcoming) {
    return WaveVotingState.NOT_STARTED;
  }

  if (isCompleted) {
    return WaveVotingState.ENDED;
  }

  return WaveVotingState.ONGOING;
};

const MyStreamWaveDesktopTabs: React.FC<MyStreamWaveDesktopTabsProps> = ({
  activeTab,
  wave,
  setActiveTab,
  activeCurationId,
  onSelectCuration,
}) => {
  const { availableTabs, updateAvailableTabs, setActiveContentTab } =
    useContentTab();
  const {
    isChatWave,
    isMemesWave,
    isCurationWave,
    pauses: { filterDecisionsDuringPauses },
  } = useWave(wave);
  const {
    voting: { isUpcoming, isCompleted },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);
  const { allDecisions, hasMoreFuture, loadMoreFuture } = useDecisionPoints(
    wave,
    {
      initialPastWindow: 3,
      initialFutureWindow: 10,
    }
  );
  const { data: curations = [] } = useWaveCurationGroups({
    waveId: wave.id,
  });
  const canManageCurations =
    wave.wave.authenticated_user_eligible_for_admin === true;

  const filteredDecisions = useMemo(() => {
    const decisionsAsApiFormat = allDecisions.map((decision) => ({
      decision_time: decision.timestamp,
    }));
    const filtered = filterDecisionsDuringPauses(decisionsAsApiFormat);

    return allDecisions.filter((decision) =>
      filtered.some((item) => item.decision_time === decision.timestamp)
    );
  }, [allDecisions, filterDecisionsDuringPauses]);

  const nextDecisionTime =
    filteredDecisions.find(
      (decision) => decision.timestamp > Time.currentMillis()
    )?.timestamp ?? null;

  const autoExpandFutureAttemptsRef = useRef(0);
  const [isCreateCurationOpen, setIsCreateCurationOpen] = useState(false);

  useEffect(() => {
    const hasUpcoming = typeof nextDecisionTime === "number";

    if (hasUpcoming || !hasMoreFuture) {
      autoExpandFutureAttemptsRef.current = 0;
      return;
    }

    if (autoExpandFutureAttemptsRef.current >= AUTO_EXPAND_LIMIT) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      autoExpandFutureAttemptsRef.current += 1;
      loadMoreFuture();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [nextDecisionTime, hasMoreFuture, loadMoreFuture]);

  const votingState = getWaveVotingState({
    isUpcoming,
    isCompleted,
  });

  useEffect(() => {
    updateAvailableTabs({
      waveId: wave.id,
      isMemesWave,
      isChatWave,
      isCurationWave,
      votingState,
      hasFirstDecisionPassed: firstDecisionDone,
    });
  }, [
    wave,
    isMemesWave,
    isChatWave,
    isCurationWave,
    votingState,
    firstDecisionDone,
    updateAvailableTabs,
  ]);

  useEffect(() => {
    if (wave.wave.type === ApiWaveType.Chat && !activeCurationId) {
      setActiveContentTab(MyStreamWaveTab.CHAT);
    }
  }, [wave.wave.type, activeCurationId, setActiveContentTab]);

  const standardOptions: TabOption[] = useMemo(
    () =>
      availableTabs
        .filter((tab) => {
          if (tab === MyStreamWaveTab.MY_VOTES) {
            return isMemesWave || isCurationWave;
          }
          if (tab === MyStreamWaveTab.SALES) {
            return isCurationWave;
          }
          if (tab === MyStreamWaveTab.FAQ) {
            return isMemesWave;
          }
          return true;
        })
        .map((tab) => ({
          key: tab,
          label: TAB_LABELS[tab],
          panelId: getContentTabPanelId(tab),
        })),
    [availableTabs, isMemesWave, isCurationWave]
  );

  const options: TabOption[] = useMemo(
    () => [
      ...standardOptions,
      ...curations.map((curation) => ({
        key: `curation:${curation.id}`,
        label: curation.name,
        panelId: getCurationPanelId(curation.id),
      })),
    ],
    [curations, standardOptions]
  );

  // The visible tab set is narrower than ContentTabContext's shared defaults,
  // so this effect snaps back to the first visible tab when needed.
  /* eslint-disable react-you-might-not-need-an-effect/no-pass-data-to-parent */
  useEffect(() => {
    const isMyVotesHidden =
      activeTab === MyStreamWaveTab.MY_VOTES && !isMemesWave && !isCurationWave;
    const isSalesHidden =
      activeTab === MyStreamWaveTab.SALES && !isCurationWave;
    const isFaqHidden = activeTab === MyStreamWaveTab.FAQ && !isMemesWave;

    if (
      !activeCurationId &&
      (isMyVotesHidden || isSalesHidden || isFaqHidden) &&
      options.length > 0
    ) {
      const firstOption = options[0];
      if (firstOption) {
        setActiveTab(firstOption.key as MyStreamWaveTab);
      }
    }
  }, [
    isMemesWave,
    isCurationWave,
    activeTab,
    activeCurationId,
    options,
    setActiveTab,
  ]);
  /* eslint-enable react-you-might-not-need-an-effect/no-pass-data-to-parent */

  const activeKey = activeCurationId
    ? `curation:${activeCurationId}`
    : activeTab;
  const createCurationTooltipId = `my-stream-create-curation-${wave.id}`;

  return (
    <>
      <div className="tw-flex tw-w-full tw-items-start tw-justify-between tw-gap-4 tw-overflow-x-auto tw-px-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 tw-@container/tabs hover:tw-scrollbar-thumb-iron-300 sm:tw-px-4">
        <TabToggle
          options={options}
          activeKey={activeKey}
          onSelect={(key) => {
            if (key.startsWith("curation:")) {
              onSelectCuration(key.replace("curation:", ""));
              return;
            }

            onSelectCuration(null);
            setActiveTab(key as MyStreamWaveTab);
          }}
        />

        {canManageCurations && (
          <button
            type="button"
            onClick={() => setIsCreateCurationOpen(true)}
            data-tooltip-id={createCurationTooltipId}
            data-tooltip-content="Create curation"
            className="tw-mt-1 tw-inline-flex tw-h-9 tw-w-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white"
            aria-label="Create curation"
          >
            <PlusIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
          </button>
        )}
      </div>
      <MyStreamActionTooltip id={createCurationTooltipId} />

      {isCreateCurationOpen && (
        <MyStreamWaveCurationCreateDialog
          wave={wave}
          isOpen={isCreateCurationOpen}
          onClose={() => setIsCreateCurationOpen(false)}
          onSaved={(curation) => onSelectCuration(curation.id)}
        />
      )}
    </>
  );
};

export default MyStreamWaveDesktopTabs;
