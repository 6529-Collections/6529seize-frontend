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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCompetitionNavigation } from "@/contexts/CompetitionNavigationContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";
import {
  getApproveWaveTabLabelsFromMetadata,
  getWaveOutcomeVisibilityFromMetadata,
} from "@/helpers/waves/wave-metadata.helpers";
import { getCompetitionIdFromPathname } from "@/helpers/competition.helpers";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveCurationTabs } from "@/hooks/waves/useWaveCurationTabs";
import { useWaveCurationReorderMutation } from "@/hooks/waves/useWaveCurationReorderMutation";
import {
  useApproveWaveCustomTabLabels,
  useWaveOutcomeVisibility,
} from "@/hooks/waves/useWaveMetadata";
import { getProfileWaveIdentity, useProfileWave } from "@/hooks/useProfileWave";
import { useWave } from "@/hooks/useWave";
import { useWavePollSummary } from "@/hooks/useWaveHasPolls";
import { useWaveCompetitionsTab } from "@/hooks/competitions/useWaveCompetitionsTab";
import { useDecisionPoints } from "@/hooks/waves/useDecisionPoints";
import { Time } from "@/helpers/time";
import { useAuth } from "@/components/auth/Auth";
import {
  DesktopTabButton,
  DesktopTabOption,
  type DesktopTabButtonProps,
  type TabOption,
} from "./MyStreamWaveTabOption";
import { MyStreamWaveTab } from "@/types/waves.types";
import { useContentTab, type SetActiveContentTab } from "../ContentTabContext";
import MyStreamActionTooltip from "./MyStreamActionTooltip";
import MyStreamWaveCreateActionsMenu from "./tabs/MyStreamWaveCreateActionsMenu";
import MyStreamWaveCurationTabMenu from "./tabs/MyStreamWaveCurationTabMenu";
import MobileTabsScrollControls from "./MobileTabsScrollControls";

interface MyStreamWaveDesktopTabsProps {
  readonly activeTab: MyStreamWaveTab;
  readonly wave: ApiWave;
  readonly setActiveTab: SetActiveContentTab;
  readonly activeCurationId: string | null;
  readonly onSelectCuration: (curationId: string | null) => void;
  readonly showCreateActionsMenu?: boolean | undefined;
  readonly competitionOnly?: boolean;
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
const TRAILING_TABS = [
  MyStreamWaveTab.COMPETITIONS,
  MyStreamWaveTab.CONFIGURATION,
  MyStreamWaveTab.ABOUT,
];

const TAB_LABELS: Record<
  Exclude<
    MyStreamWaveTab,
    MyStreamWaveTab.CONFIGURATION | MyStreamWaveTab.ABOUT
  >,
  string
> = {
  [MyStreamWaveTab.CHAT]: "Chat",
  [MyStreamWaveTab.COMPETITIONS]: "Competitions",
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
  locale,
}: {
  readonly approveLabels: ApproveTabLabels;
  readonly isApproveWave: boolean;
  readonly tab: MyStreamWaveTab;
  readonly locale: ReturnType<typeof useBrowserLocale>;
}): string => {
  if (tab === MyStreamWaveTab.CONFIGURATION)
    return t(locale, "competitions.configuration");
  if (tab === MyStreamWaveTab.ABOUT) return t(locale, "wave.navigation.about");
  if (isApproveWave && tab === MyStreamWaveTab.LEADERBOARD) {
    return approveLabels.approvals;
  }

  if (isApproveWave && tab === MyStreamWaveTab.WINNERS) {
    return approveLabels.approved;
  }

  return TAB_LABELS[tab];
};

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
  competitionOnly = false,
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useBrowserLocale();
  const { flat, nativeCompetition } = useCompetitionNavigation();
  const nativeDefault = flat ? nativeCompetition : null;
  const { availableTabs } = useContentTab();
  const { activeCount: activeCompetitionCount, defaultCompetitionId } =
    useWaveCompetitionsTab(wave);
  const effectiveCompetitionId =
    getCompetitionIdFromPathname(pathname) ??
    searchParams.get("competition") ??
    defaultCompetitionId;
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
  const waveApproveLabels = useApproveWaveCustomTabLabels(wave);
  const waveOutcomesVisible = useWaveOutcomeVisibility(wave);
  const nativePresentation = useMemo(
    () =>
      (nativeDefault?.presentation ?? []).map((item, id) => ({ ...item, id })),
    [nativeDefault?.presentation]
  );
  const approveLabels = nativeDefault
    ? getApproveWaveTabLabelsFromMetadata(nativePresentation)
    : waveApproveLabels;
  const outcomesVisible = nativeDefault
    ? getWaveOutcomeVisibilityFromMetadata(nativePresentation)
    : waveOutcomesVisible;
  const selectedIsApprove = nativeDefault
    ? nativeDefault.type === ApiCompetitionType.Approve
    : isApproveWave;
  const isCompetitionWave = isRankWave || isApproveWave;
  const { allDecisions, hasMoreFuture, loadMoreFuture } = useDecisionPoints(
    wave,
    {
      initialPastWindow: 3,
      initialFutureWindow: 10,
    }
  );
  const { data: curations = [] } = useWaveCurationTabs({
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
  const { unansweredPolls } = useWavePollSummary({
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

  const standardOptions: TabOption[] = useMemo(
    () => [
      ...availableTabs
        .filter((tab) => {
          if (tab === MyStreamWaveTab.MY_VOTES) {
            return (
              isCurationWave ||
              (hasAuthenticatedProfile &&
                (isMemesWave ||
                  isCompetitionWave ||
                  Boolean(effectiveCompetitionId)))
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
        .map((tab) => {
          let badgeCount: number | undefined;
          if (tab === MyStreamWaveTab.COMPETITIONS)
            badgeCount = activeCompetitionCount;
          else if (tab === MyStreamWaveTab.POLLS) badgeCount = unansweredPolls;
          return {
            key: tab,
            label: getTabLabel({
              approveLabels,
              isApproveWave: selectedIsApprove,
              tab,
              locale,
            }),
            panelId: getContentTabPanelId(tab),
            badgeCount,
          };
        }),
      ...(nativeDefault
        ? ["voters"].map((tab) => ({
            key: tab,
            label: t(locale, "competitions.voters"),
            panelId: getContentTabPanelId(MyStreamWaveTab.COMPETITIONS),
          }))
        : []),
    ],
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
      activeCompetitionCount,
      effectiveCompetitionId,
      nativeDefault,
      selectedIsApprove,
      locale,
    ]
  );

  const curationOptions: TabOption[] = useMemo(
    () =>
      (competitionOnly ? [] : curations).map((curation) => ({
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
      competitionOnly,
    ]
  );

  const trailingOptions = useMemo(
    () =>
      TRAILING_TABS.flatMap((tab) =>
        standardOptions.filter((option) => option.key === String(tab))
      ),
    [standardOptions]
  );
  const leadingOptions = useMemo(
    () =>
      standardOptions.filter(
        (option) => !TRAILING_TABS.includes(option.key as MyStreamWaveTab)
      ),
    [standardOptions]
  );
  const options: TabOption[] = useMemo(
    () => [...leadingOptions, ...curationOptions, ...trailingOptions],
    [curationOptions, leadingOptions, trailingOptions]
  );

  let activeKey: string = activeTab;
  const nativeTab =
    searchParams.get("edit") === "1" ? "rules" : searchParams.get("tab");
  if (nativeDefault && nativeTab !== null && nativeTab === "voters")
    activeKey = nativeTab;
  if (activeCurationId) activeKey = getCurationTabKey(activeCurationId);
  const selectStandardTab = (key: string) => {
    onSelectCuration(null);
    if (nativeDefault && key === "voters") {
      router.push(`${pathname}?tab=${key}`, { scroll: false });
      return;
    }
    setActiveTab(key as MyStreamWaveTab);
  };
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
    <div
      data-competition-navigation={flat ? "flat" : undefined}
      className="tw-flex tw-w-full tw-items-center tw-gap-3 tw-px-2 tw-@container/tabs sm:tw-px-4"
    >
      <div className="tw-relative tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-1 tw-overflow-hidden sm:tw-hidden">
        <div
          ref={mobileTabsScrollerRef}
          data-wave-tabs-scroll="mobile"
          className="tw-min-w-0 tw-flex-1 tw-scroll-px-8 tw-overflow-x-auto tw-overscroll-x-contain tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 [touch-action:pan-x] hover:tw-scrollbar-thumb-iron-300"
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

                selectStandardTab(key);
              }}
            />
          </div>
        </div>
        <MobileTabsScrollControls scrollerRef={mobileTabsScrollerRef} />
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
          <div className="tw-flex tw-w-auto tw-gap-x-[13px]" role="tablist">
            {leadingOptions.map((option) => (
              <DesktopTabOption
                key={option.key}
                option={option}
                activeKey={activeKey}
                onSelect={selectStandardTab}
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
            {trailingOptions.map((option) => (
              <DesktopTabOption
                key={option.key}
                option={option}
                activeKey={activeKey}
                onSelect={selectStandardTab}
              />
            ))}
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
