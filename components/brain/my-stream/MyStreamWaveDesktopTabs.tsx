"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
  EllipsisVerticalIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
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
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import { TabToggle } from "@/components/common/TabToggle";
import { useSearchParams } from "next/navigation";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { useWaveCurationReorderMutation } from "@/hooks/waves/useWaveCurationReorderMutation";
import { useProfileWave } from "@/hooks/useProfileWave";
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
import MyStreamActionTooltip from "./MyStreamActionTooltip";
import MyStreamWaveCreateCurationAction from "./tabs/MyStreamWaveCreateCurationAction";
import MyStreamWaveCurationTabMenu from "./tabs/MyStreamWaveCurationTabMenu";

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
  readonly leadingIcon?: React.ReactNode | undefined;
  readonly leadingIconTooltipId?: string | undefined;
  readonly hasIndicator?: boolean | undefined;
  readonly action?: React.ReactNode | undefined;
}

interface ProfileLookupSource {
  readonly query?: string | null | undefined;
  readonly handle?: string | null | undefined;
  readonly primary_wallet?: string | null | undefined;
  readonly primary_address?: string | null | undefined;
  readonly id?: string | null | undefined;
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

const getProfileLookupKey = (
  profile: ProfileLookupSource | null | undefined
): string | null => {
  const identity =
    profile?.query ??
    profile?.handle ??
    profile?.primary_wallet ??
    profile?.primary_address ??
    profile?.id ??
    null;

  const normalizedIdentity = identity?.trim() ?? "";
  return normalizedIdentity.length > 0 ? normalizedIdentity : null;
};

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
const MOBILE_INLINE_CURATION_LIMIT = 1;

const TAB_LABELS: Record<MyStreamWaveTab, string> = {
  [MyStreamWaveTab.CHAT]: "Chat",
  [MyStreamWaveTab.LEADERBOARD]: "Leaderboard",
  [MyStreamWaveTab.SUBMISSIONS]: "Submissions",
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

interface DesktopTabButtonProps {
  readonly option: TabOption;
  readonly activeKey: string;
  readonly onSelect: (key: string) => void;
  readonly fullWidth?: boolean | undefined;
}

function DesktopTabButton({
  option,
  activeKey,
  onSelect,
  fullWidth = false,
}: DesktopTabButtonProps) {
  return (
    <button
      onClick={() => onSelect(option.key)}
      role="tab"
      aria-selected={activeKey === option.key}
      aria-controls={option.panelId}
      className={`tw-relative tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-py-3 tw-text-sm tw-font-medium tw-transition-all tw-duration-200 ${
        fullWidth ? "tw-flex tw-flex-1 tw-justify-center tw-text-center" : ""
      } ${
        activeKey === option.key
          ? "tw-border-primary-300 tw-text-white"
          : "tw-border-transparent tw-text-iron-500 desktop-hover:hover:tw-text-iron-200"
      }`}
    >
      <span className="tw-inline-flex tw-h-5 tw-items-center tw-gap-1 tw-align-middle tw-leading-5">
        {option.leadingIcon}
        <span className="tw-leading-5">{option.label}</span>
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
      className="tw-inline-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-leading-none tw-text-primary-300"
    >
      <UserCircleIcon
        aria-hidden="true"
        className="tw-block tw-size-4 tw-flex-shrink-0"
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
    <div role="presentation" className="tw-flex tw-items-center">
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
    <div
      ref={setNodeRef}
      style={style}
      role="presentation"
      className="tw-flex tw-items-center"
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        disabled={isSortingDisabled}
        aria-label={`Drag ${option.label} curation tab`}
        data-tooltip-id={reorderTooltipId}
        data-tooltip-content="Drag to reorder"
        className="tw-inline-flex tw-h-8 tw-w-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-600 tw-transition hover:tw-bg-iron-900 hover:tw-text-iron-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-40"
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
  showCreateCurationAction = true,
}) => {
  const searchParams = useSearchParams();
  const { availableTabs, updateAvailableTabs, setActiveContentTab } =
    useContentTab();
  const { activeProfileProxy, connectedProfile } = useAuth();
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
  const isConnectedProfileWaveAuthor = connectedProfile?.id === wave.author.id;
  const profileWaveIdentity = getProfileLookupKey(
    isConnectedProfileWaveAuthor ? connectedProfile : wave.author
  );
  const { data: profileWave } = useProfileWave({
    identity: profileWaveIdentity,
    enabled: profileWaveIdentity !== null && curations.length > 0,
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
        icon: option.leadingIcon,
        onSelect: () => onSelectCuration(getCurationIdFromTabKey(option.key)),
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
                  onSelectCuration(getCurationIdFromTabKey(key));
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
          <DndContext
            sensors={sortableSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCurationDragEnd}
          >
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
          </DndContext>
        </div>
      </div>
      {showCreateCurationAction && (
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2 sm:tw-ml-auto">
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
