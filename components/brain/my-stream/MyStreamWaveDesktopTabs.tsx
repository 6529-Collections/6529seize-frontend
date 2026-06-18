"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TabToggle } from "@/components/common/TabToggle";
import { useSearchParams } from "next/navigation";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { useWaveCurationReorderMutation } from "@/hooks/waves/useWaveCurationReorderMutation";
import {
  useApproveWaveCustomTabLabels,
  useWaveOutcomeVisibility,
} from "@/hooks/waves/useWaveMetadata";
import { getProfileWaveIdentity, useProfileWave } from "@/hooks/useProfileWave";
import { useWave } from "@/hooks/useWave";
import { useWavePollSummary } from "@/hooks/useWaveHasPolls";
import { useDecisionPoints } from "@/hooks/waves/useDecisionPoints";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { Time } from "@/helpers/time";
import { useAuth } from "@/components/auth/Auth";
import { TabCountBadge } from "@/components/common/TabCountBadge";
import { MyStreamWaveTab } from "@/types/waves.types";
import {
  useContentTab,
  WaveVotingState,
  type SetActiveContentTab,
} from "../ContentTabContext";
import MyStreamActionTooltip from "./MyStreamActionTooltip";
import MyStreamWaveCreateActionsMenu from "./tabs/MyStreamWaveCreateActionsMenu";
import MyStreamWaveCurationTabMenu from "./tabs/MyStreamWaveCurationTabMenu";

interface MyStreamWaveDesktopTabsProps {
  readonly activeTab: MyStreamWaveTab;
  readonly wave: ApiWave;
  readonly setActiveTab: SetActiveContentTab;
  readonly activeCurationId: string | null;
  readonly onSelectCuration: (curationId: string | null) => void;
  readonly showCreateActionsMenu?: boolean | undefined;
}

interface TabOption {
  readonly key: string;
  readonly label: string;
  readonly panelId: string;
  readonly badgeCount?: number | null | undefined;
  readonly leadingIcon?: React.ReactNode | undefined;
  readonly leadingIconTooltipId?: string | undefined;
  readonly hasIndicator?: boolean | undefined;
  readonly action?: React.ReactNode | undefined;
}

interface ApproveTabLabels {
  readonly approvals: string;
  readonly approved: string;
}

const getContentTabPanelId = (tab: MyStreamWaveTab): string =>
  `my-stream-wave-tabpanel-${tab.toLowerCase()}`;

const getCurationPanelId = (curationId: string): string =>
  `my-stream-wave-tabpanel-curation-${curationId}`;

const getCurationTabKey = (curationId: string): string =>
  `curation:${curationId}`;

const getCurationIdFromTabKey = (key: string): string =>
  key.replace("curation:", "");

const getProfileCurationTooltipId = (curationId: string): string =>
  `my-stream-profile-curation-${curationId}`;

const getEffectiveProfileCurationId = ({
  curations,
  isProfileWave,
  profileCurationId,
}: {
  readonly curations: readonly { id: string }[];
  readonly isProfileWave: boolean;
  readonly profileCurationId: string | null | undefined;
}): string | null => {
  if (!isProfileWave) {
    return null;
  }

  if (
    profileCurationId &&
    curations.some((curation) => curation.id === profileCurationId)
  ) {
    return profileCurationId;
  }

  return curations[0]?.id ?? null;
};

const AUTO_EXPAND_LIMIT = 5;

const TAB_LABELS: Record<MyStreamWaveTab, string> = {
  [MyStreamWaveTab.CHAT]: "Chat",
  [MyStreamWaveTab.LEADERBOARD]: "Leaderboard",
  [MyStreamWaveTab.SUBMISSIONS]: "Submissions",
  [MyStreamWaveTab.SALES]: "Sales",
  [MyStreamWaveTab.WINNERS]: "Winners",
  [MyStreamWaveTab.OUTCOME]: "Outcome",
  [MyStreamWaveTab.MY_VOTES]: "My Votes",
  [MyStreamWaveTab.POLLS]: "Polls",
  [MyStreamWaveTab.FAQ]: "FAQ",
};

const getTabLabel = ({
  approveLabels,
  isApproveWave,
  tab,
}: {
  readonly approveLabels: ApproveTabLabels;
  readonly isApproveWave: boolean;
  readonly tab: MyStreamWaveTab;
}): string => {
  if (isApproveWave && tab === MyStreamWaveTab.LEADERBOARD) {
    return approveLabels.approvals;
  }

  if (isApproveWave && tab === MyStreamWaveTab.WINNERS) {
    return approveLabels.approved;
  }

  return TAB_LABELS[tab];
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

interface DesktopTabButtonProps {
  readonly option: TabOption;
  readonly activeKey: string;
  readonly onSelect: (key: string) => void;
}

function DesktopTabButton({
  option,
  activeKey,
  onSelect,
}: DesktopTabButtonProps) {
  return (
    <button
      onClick={() => onSelect(option.key)}
      role="tab"
      aria-selected={activeKey === option.key}
      aria-controls={option.panelId}
      className={`tw-relative tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-py-3 tw-text-sm tw-font-medium tw-transition-all tw-duration-200 ${
        activeKey === option.key
          ? "tw-border-primary-300 tw-text-white"
          : "tw-border-transparent tw-text-iron-500 desktop-hover:hover:tw-text-iron-200"
      }`}
    >
      <span className="tw-inline-flex tw-h-5 tw-items-center tw-gap-1 tw-align-middle tw-leading-5">
        <span className="tw-leading-5">{option.label}</span>
        <TabCountBadge count={option.badgeCount} />
        {option.leadingIcon}
      </span>
      {option.hasIndicator && (
        <div className="tw-absolute -tw-right-1 tw-top-1 tw-h-2 tw-w-2 tw-rounded-full tw-bg-red"></div>
      )}
    </button>
  );
}

function ProfileCurationIcon({ tooltipId }: { readonly tooltipId: string }) {
  return (
    <span
      aria-label="Profile curation"
      data-tooltip-id={tooltipId}
      data-tooltip-content="Profile curation"
      className="tw-inline-flex tw-size-3.5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-leading-none tw-text-primary-300"
    >
      <UserCircleIcon
        aria-hidden="true"
        className="tw-block tw-size-3.5 tw-flex-shrink-0"
      />
    </span>
  );
}

function ReorderHandleIcon({
  className,
}: {
  readonly className?: string | undefined;
}) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function DesktopTabOption({
  option,
  activeKey,
  onSelect,
}: DesktopTabButtonProps) {
  return (
    <div className="tw-flex tw-items-center">
      <DesktopTabButton
        option={option}
        activeKey={activeKey}
        onSelect={onSelect}
      />
      {option.leadingIconTooltipId !== undefined && (
        <MyStreamActionTooltip id={option.leadingIconTooltipId} />
      )}
      {option.action !== undefined && option.action !== null && (
        <div className="tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-border-transparent">
          {option.action}
        </div>
      )}
    </div>
  );
}

function SortableCurationTabOption({
  option,
  activeKey,
  isSortingDisabled,
  onSelect,
}: DesktopTabButtonProps & {
  readonly isSortingDisabled: boolean;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: option.key,
    disabled: isSortingDisabled,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : undefined,
  };
  const reorderTooltipId = `${option.key}-reorder-tooltip`;

  return (
    <div ref={setNodeRef} style={style} className="tw-flex tw-items-center">
      <button
        ref={setActivatorNodeRef}
        type="button"
        disabled={isSortingDisabled}
        aria-label={`Drag ${option.label} curation tab`}
        data-tooltip-id={reorderTooltipId}
        data-tooltip-content="Drag to reorder"
        className="tw-inline-flex tw-h-8 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-text-iron-600 tw-transition hover:tw-text-iron-300 disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
        {...attributes}
        {...listeners}
      >
        <ReorderHandleIcon className="tw-block tw-size-4 tw-flex-shrink-0" />
      </button>
      <MyStreamActionTooltip id={reorderTooltipId} />
      <DesktopTabButton
        option={option}
        activeKey={activeKey}
        onSelect={onSelect}
      />
      {option.leadingIconTooltipId !== undefined && (
        <MyStreamActionTooltip id={option.leadingIconTooltipId} />
      )}
      {option.action !== undefined && option.action !== null && (
        <div className="tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-border-transparent">
          {option.action}
        </div>
      )}
    </div>
  );
}

const MyStreamWaveDesktopTabs: React.FC<MyStreamWaveDesktopTabsProps> = ({
  activeTab,
  wave,
  setActiveTab,
  activeCurationId,
  onSelectCuration,
  showCreateActionsMenu = true,
}) => {
  const searchParams = useSearchParams();
  const { availableTabs, updateAvailableTabs } = useContentTab();
  const { activeProfileProxy, connectedProfile } = useAuth();
  const hasAuthenticatedProfile = Boolean(connectedProfile?.handle);
  const {
    isChatWave,
    isApproveWave,
    isMemesWave,
    isCurationWave,
    isRankWave,
    pauses: { filterDecisionsDuringPauses },
  } = useWave(wave);
  const approveLabels = useApproveWaveCustomTabLabels(wave);
  const outcomesVisible = useWaveOutcomeVisibility(wave);
  const isCompetitionWave = isRankWave || isApproveWave;
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
  const isConnectedProfileWaveAuthor = connectedProfile?.id === wave.author.id;
  const profileWaveIdentity = getProfileWaveIdentity(
    isConnectedProfileWaveAuthor ? connectedProfile : wave.author
  );
  const { data: profileWave } = useProfileWave({
    identity: profileWaveIdentity,
    enabled: profileWaveIdentity.length > 0 && curations.length > 0,
  });
  const { reorderCuration, isPending: isCurationReorderPending } =
    useWaveCurationReorderMutation({ waveId: wave.id });
  const canManageCurations =
    wave.wave.authenticated_user_eligible_for_admin === true;
  const isProfileWave = profileWave?.profile_wave_id === wave.id;
  const profileCurationId = getEffectiveProfileCurationId({
    curations,
    isProfileWave,
    profileCurationId: profileWave?.profile_curation_id,
  });
  const canSetProfileCuration =
    isProfileWave &&
    isConnectedProfileWaveAuthor &&
    activeProfileProxy === null;
  const { hasPolls, unansweredPolls } = useWavePollSummary({
    waveId: wave.id,
  });

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
  const sortableSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      hasPolls,
      hasAuthenticatedProfile,
      isCurationWave,
      isApproveWave,
      showOutcomeTab: outcomesVisible,
      votingState,
      hasFirstDecisionPassed: firstDecisionDone,
      transientPreferredTab: hasSerialTarget ? MyStreamWaveTab.CHAT : null,
    });
  }, [
    wave,
    isMemesWave,
    isChatWave,
    hasPolls,
    isApproveWave,
    outcomesVisible,
    hasAuthenticatedProfile,
    isCurationWave,
    votingState,
    firstDecisionDone,
    searchParams,
    updateAvailableTabs,
  ]);

  const standardOptions: TabOption[] = useMemo(
    () =>
      availableTabs
        .filter((tab) => {
          if (tab === MyStreamWaveTab.MY_VOTES) {
            return (
              isCurationWave ||
              (hasAuthenticatedProfile && (isMemesWave || isCompetitionWave))
            );
          }
          if (tab === MyStreamWaveTab.SALES) {
            return isCurationWave;
          }
          if (tab === MyStreamWaveTab.FAQ) {
            return isMemesWave;
          }
          if (tab === MyStreamWaveTab.OUTCOME) {
            return outcomesVisible;
          }
          return true;
        })
        .map((tab) => ({
          key: tab,
          label: getTabLabel({ approveLabels, isApproveWave, tab }),
          panelId: getContentTabPanelId(tab),
          badgeCount:
            tab === MyStreamWaveTab.POLLS ? unansweredPolls : undefined,
        })),
    [
      availableTabs,
      approveLabels,
      hasAuthenticatedProfile,
      isApproveWave,
      isCompetitionWave,
      isMemesWave,
      isCurationWave,
      outcomesVisible,
      unansweredPolls,
    ]
  );

  const curationOptions: TabOption[] = useMemo(
    () =>
      curations.map((curation) => ({
        key: getCurationTabKey(curation.id),
        label: curation.name,
        panelId: getCurationPanelId(curation.id),
        leadingIcon:
          curation.id === profileCurationId ? (
            <ProfileCurationIcon
              tooltipId={getProfileCurationTooltipId(curation.id)}
            />
          ) : undefined,
        leadingIconTooltipId:
          curation.id === profileCurationId
            ? getProfileCurationTooltipId(curation.id)
            : undefined,
        action: canManageCurations ? (
          <MyStreamWaveCurationTabMenu
            wave={wave}
            curation={curation}
            canSetAsProfileCuration={
              canSetProfileCuration && curation.id !== profileCurationId
            }
            onDeleted={
              activeCurationId === curation.id
                ? () => onSelectCuration(null)
                : undefined
            }
          />
        ) : undefined,
      })),
    [
      activeCurationId,
      canManageCurations,
      canSetProfileCuration,
      curations,
      onSelectCuration,
      profileCurationId,
      wave,
    ]
  );

  const options: TabOption[] = useMemo(
    () => [...standardOptions, ...curationOptions],
    [curationOptions, standardOptions]
  );

  const activeKey = activeCurationId
    ? getCurationTabKey(activeCurationId)
    : activeTab;
  const curationTabKeys = useMemo(
    () => curations.map((curation) => getCurationTabKey(curation.id)),
    [curations]
  );
  const canDragCurations = canManageCurations && curations.length > 1;
  const handleCurationDragEnd = ({ active, over }: DragEndEvent) => {
    if (over === null || active.id === over.id) {
      return;
    }

    const curationId = getCurationIdFromTabKey(String(active.id));
    const targetIndex = curations.findIndex(
      (curation) => getCurationTabKey(curation.id) === over.id
    );
    const curation = curations.find((item) => item.id === curationId) ?? null;

    if (curation === null || targetIndex < 0) {
      return;
    }

    reorderCuration({
      curation,
      targetPriorityOrder: targetIndex + 1,
      curations,
    });
  };

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

  if (
    isChatWave &&
    !canManageCurations &&
    curations.length === 0 &&
    standardOptions.length <= 1
  ) {
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
              options={options}
              activeKey={activeKey}
              onSelect={(key) => {
                if (key.startsWith("curation:")) {
                  onSelectCuration(getCurationIdFromTabKey(key));
                  return;
                }

                onSelectCuration(null);
                setActiveTab(key as MyStreamWaveTab);
              }}
            />
          </div>
        </div>
      </div>
      <div
        ref={desktopTabsScrollerRef}
        className="tw-hidden tw-min-w-0 tw-flex-1 tw-overflow-x-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-block"
      >
        <DndContext
          sensors={sortableSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCurationDragEnd}
        >
          <div className="tw-flex tw-w-auto tw-gap-x-1" role="tablist">
            {standardOptions.map((option) => (
              <DesktopTabOption
                key={option.key}
                option={option}
                activeKey={activeKey}
                onSelect={(key) => {
                  onSelectCuration(null);
                  setActiveTab(key as MyStreamWaveTab);
                }}
              />
            ))}
            <SortableContext
              items={curationTabKeys}
              strategy={horizontalListSortingStrategy}
            >
              {curationOptions.map((option) => (
                <React.Fragment key={option.key}>
                  {canDragCurations ? (
                    <SortableCurationTabOption
                      option={option}
                      activeKey={activeKey}
                      isSortingDisabled={isCurationReorderPending}
                      onSelect={(key) =>
                        onSelectCuration(getCurationIdFromTabKey(key))
                      }
                    />
                  ) : (
                    <DesktopTabOption
                      option={option}
                      activeKey={activeKey}
                      onSelect={(key) =>
                        onSelectCuration(getCurationIdFromTabKey(key))
                      }
                    />
                  )}
                </React.Fragment>
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </div>
      {showCreateActionsMenu && (
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2 sm:tw-ml-auto">
          <MyStreamWaveCreateActionsMenu
            wave={wave}
            onCreated={onSelectCuration}
          />
        </div>
      )}
    </div>
  );
};

export default MyStreamWaveDesktopTabs;
