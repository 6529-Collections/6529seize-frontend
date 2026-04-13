"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import { TabToggle } from "@/components/common/TabToggle";
import { useSearchParams } from "next/navigation";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { useWave } from "@/hooks/useWave";
import { useDecisionPoints } from "@/hooks/waves/useDecisionPoints";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { Time } from "@/helpers/time";
import { useAuth } from "@/components/auth/Auth";
import { MyStreamWaveTab } from "@/types/waves.types";
import {
  useContentTab,
  WaveVotingState,
  type SetActiveContentTab,
} from "../ContentTabContext";
import MyStreamWaveCreateCurationAction from "./tabs/MyStreamWaveCreateCurationAction";

interface MyStreamWaveDesktopTabsProps {
  readonly activeTab: MyStreamWaveTab;
  readonly wave: ApiWave;
  readonly setActiveTab: SetActiveContentTab;
  readonly activeCurationId: string | null;
  readonly onSelectCuration: (curationId: string | null) => void;
  readonly showCreateCurationAction?: boolean | undefined;
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
const MOBILE_INLINE_CURATION_LIMIT = 1;

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
  showCreateCurationAction = true,
}) => {
  const searchParams = useSearchParams();
  const { availableTabs, updateAvailableTabs, setActiveContentTab } =
    useContentTab();
  const { connectedProfile } = useAuth();
  const hasAuthenticatedProfile = Boolean(connectedProfile?.handle);
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
  const { data: curations = [] } = useWaveCurations({
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
  const desktopTabsScrollerRef = useRef<HTMLDivElement | null>(null);
  const mobileTabsScrollerRef = useRef<HTMLDivElement | null>(null);

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
    const hasSerialTarget = searchParams.get("serialNo") !== null;
    updateAvailableTabs({
      waveId: wave.id,
      isMemesWave,
      isChatWave,
      hasAuthenticatedProfile,
      isCurationWave,
      votingState,
      hasFirstDecisionPassed: firstDecisionDone,
      transientPreferredTab: hasSerialTarget ? MyStreamWaveTab.CHAT : null,
    });
  }, [
    wave,
    isMemesWave,
    isChatWave,
    hasAuthenticatedProfile,
    isCurationWave,
    votingState,
    firstDecisionDone,
    searchParams,
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
            return isCurationWave || (isMemesWave && hasAuthenticatedProfile);
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
    [availableTabs, hasAuthenticatedProfile, isMemesWave, isCurationWave]
  );

  const curationOptions: TabOption[] = useMemo(
    () =>
      curations.map((curation) => ({
        key: `curation:${curation.id}`,
        label: curation.name,
        panelId: getCurationPanelId(curation.id),
      })),
    [curations]
  );

  const options: TabOption[] = useMemo(
    () => [...standardOptions, ...curationOptions],
    [curationOptions, standardOptions]
  );

  const activeKey = activeCurationId
    ? `curation:${activeCurationId}`
    : activeTab;

  const mobileVisibleCurationOptions = useMemo(() => {
    if (curationOptions.length <= MOBILE_INLINE_CURATION_LIMIT) {
      return curationOptions;
    }

    const activeCurationOption =
      curationOptions.find((option) => option.key === activeKey) ?? null;
    const visibleOptions = activeCurationOption ? [activeCurationOption] : [];

    for (const option of curationOptions) {
      if (visibleOptions.length >= MOBILE_INLINE_CURATION_LIMIT) {
        break;
      }

      if (option.key === activeCurationOption?.key) {
        continue;
      }

      visibleOptions.push(option);
    }

    return visibleOptions;
  }, [activeKey, curationOptions]);

  const mobileOverflowCurationOptions = useMemo(() => {
    const visibleKeys = new Set(
      mobileVisibleCurationOptions.map((option) => option.key)
    );

    return curationOptions.filter((option) => !visibleKeys.has(option.key));
  }, [curationOptions, mobileVisibleCurationOptions]);

  const mobileOptions: TabOption[] = useMemo(
    () => [...standardOptions, ...mobileVisibleCurationOptions],
    [mobileVisibleCurationOptions, standardOptions]
  );

  const mobileOverflowItems: CompactMenuItem[] = useMemo(
    () =>
      mobileOverflowCurationOptions.map((option) => ({
        id: option.key,
        label: option.label,
        onSelect: () => onSelectCuration(option.key.replace("curation:", "")),
      })),
    [mobileOverflowCurationOptions, onSelectCuration]
  );

  useEffect(() => {
    const frameId = globalThis.window.requestAnimationFrame(() => {
      [desktopTabsScrollerRef.current, mobileTabsScrollerRef.current].forEach(
        (scroller) => {
          if (!scroller) {
            return;
          }

          const activeTabElement = scroller.querySelector<HTMLElement>(
            '[role="tab"][aria-selected="true"]'
          );
          activeTabElement?.scrollIntoView({
            block: "nearest",
            inline: "nearest",
          });
        }
      );
    });

    return () => {
      globalThis.window.cancelAnimationFrame(frameId);
    };
  }, [activeKey, options]);

  if (isChatWave && !canManageCurations && curations.length === 0) {
    return null;
  }

  return (
    <div className="tw-flex tw-w-full tw-items-center tw-gap-3 tw-px-2 tw-@container/tabs sm:tw-px-4">
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-1 sm:tw-hidden">
        <div
          ref={mobileTabsScrollerRef}
          className="tw-min-w-0 tw-flex-1 tw-overflow-x-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300"
        >
          <div className="tw-inline-flex tw-items-center tw-gap-1">
            <TabToggle
              options={mobileOptions}
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
            {mobileOverflowItems.length > 0 && (
              <CompactMenu
                triggerClassName="tw-inline-flex tw-h-9 tw-w-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 tw-transition hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white"
                trigger={<EllipsisVerticalIcon className="tw-h-5 tw-w-5" />}
                aria-label="More curations"
                items={mobileOverflowItems}
                menuWidthClassName="tw-w-52"
              />
            )}
          </div>
        </div>
      </div>
      <div
        ref={desktopTabsScrollerRef}
        className="tw-hidden tw-min-w-0 tw-flex-1 tw-overflow-x-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-block"
      >
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
      </div>
      {showCreateCurationAction && (
        <div className="sm:tw-ml-auto">
          <MyStreamWaveCreateCurationAction
            wave={wave}
            onCreated={onSelectCuration}
          />
        </div>
      )}
    </div>
  );
};

export default MyStreamWaveDesktopTabs;
