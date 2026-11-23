"use client";
import { useWaveChatPrefetch } from "@/hooks/competitions/useWaveChatPrefetch";
import useCapacitor from "@/hooks/useCapacitor";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { PHONE_WAVES_LAYOUT_QUERY } from "@/constants/waves-layout";
import { useOptionalHeaderContext } from "@/contexts/HeaderContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BrainView } from "./brainMobileViews";
import { useBrainMobileTabScroll } from "./useBrainMobileTabScroll";
import {
  getTabButtonClassName,
  getTabTextClassName,
} from "./brainMobileTabStyles";
import type { ApiWave } from "@/generated/models/ApiWave";
import MyStreamWaveTabsLeaderboard, {
  WaveLeaderboardTabOptions,
} from "../my-stream/MyStreamWaveTabsLeaderboard";
import PhoneWaveTabs, {
  type PhoneWaveTab,
} from "../my-stream/tabs/PhoneWaveTabs";
import { useLayout } from "../my-stream/layout/LayoutContext";
import { useWave } from "@/hooks/useWave";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAuth } from "@/components/auth/Auth";
import { getWaveHomeRoute } from "../../../helpers/navigation.helpers";
import { useWaveCurationTabs } from "@/hooks/waves/useWaveCurationTabs";
import MyStreamWaveCreateActionsMenu from "../my-stream/tabs/MyStreamWaveCreateActionsMenu";
import MobileTabsScrollControls from "../my-stream/MobileTabsScrollControls";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { TabCountBadge } from "@/components/common/TabCountBadge";
import TabButton from "@/components/common/TabButton";
import { useWaveTabNavigation } from "@/hooks/useWaveTabNavigation";
import {
  COMPETITION_TABS,
  isCompetitionPathname,
  getCompetitionTab,
  getCompetitionsRoute,
} from "@/helpers/competition.helpers";
import { useCompetitionNavigation } from "@/contexts/CompetitionNavigationContext";
import {
  getLegacyCompetitionTab,
  waveCompetitionTabs,
} from "@/helpers/default-competition.helpers";
import { hasWaveDestination } from "@/hooks/useWaveTabPreference";
import { useContentTab } from "../ContentTabContext";
import { isCompetitionSubmissionHistory } from "@/helpers/competition-lifecycle.helpers";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";
import { useSubmissionRulesTabRef } from "./useSubmissionRulesTabRef";
import { getApproveWaveTabLabelsFromMetadata } from "@/helpers/waves/wave-metadata.helpers";

const PHONE_PRIMARY_VIEWS = [
  BrainView.DEFAULT,
  BrainView.LEADERBOARD,
  BrainView.SUBMISSIONS,
  BrainView.WINNERS,
  BrainView.MY_VOTES,
  BrainView.POLLS,
  BrainView.SALES,
];

type NativeWaveTab = PhoneWaveTab & { readonly active: boolean };
type NativeLeaderboardTab = {
  readonly view: BrainView;
  readonly label: string;
  readonly active: boolean;
};

const WAVE_TAB_SKELETONS = [
  { id: "chat", widthClassName: "tw-w-14" },
  { id: "about", widthClassName: "tw-w-20" },
  { id: "primary", widthClassName: "tw-w-24" },
  { id: "secondary", widthClassName: "tw-w-16" },
  { id: "outcome", widthClassName: "tw-w-20" },
];

const getTabStateProps = (isActive: boolean) => ({
  type: "button" as const,
  "aria-current": isActive ? ("true" as const) : undefined,
});

const getIsWaveNavigationLoading = ({
  waveActive,
  hasWave,
  waveNavigationReady,
  shouldShowCurationTabs,
  isCurationsPending,
}: {
  readonly waveActive: boolean;
  readonly hasWave: boolean;
  readonly waveNavigationReady: boolean;
  readonly shouldShowCurationTabs: boolean;
  readonly isCurationsPending: boolean;
}): boolean =>
  waveActive &&
  (!hasWave ||
    !waveNavigationReady ||
    (shouldShowCurationTabs && isCurationsPending));

interface BrainMobileTabsProps {
  readonly onConfigurationButtonRef?:
    | ((element: HTMLButtonElement | null) => void)
    | undefined;
  readonly activeView: BrainView;
  readonly onViewChange: (view: BrainView) => void;
  readonly wave?: ApiWave | undefined;
  readonly waveActive: boolean;
  readonly hasPolls?: boolean | undefined;
  readonly hasCompetitions?: boolean | undefined;
  readonly hideCompetitionsTab?: boolean | undefined;
  readonly hasDefaultCompetition?: boolean | undefined;
  readonly activeCompetitionCount?: number | undefined;
  readonly waveNavigationReady?: boolean | undefined;
  readonly showWavesTab: boolean;
  readonly showStreamBack: boolean;
  readonly isApp?: boolean | undefined;
}

/** Render the app's available Wave sections and focus the committed rules tab. */
const BrainMobileTabs: React.FC<BrainMobileTabsProps> = ({
  activeView,
  onViewChange,
  wave,
  waveActive,
  hasPolls = false,
  hasCompetitions = false,
  hideCompetitionsTab = false,
  hasDefaultCompetition = false,
  activeCompetitionCount,
  waveNavigationReady = true,
  showWavesTab,
  showStreamBack,
  isApp,
  onConfigurationButtonRef,
}) => {
  const router = useRouter();
  const navigateTab = useWaveTabNavigation();
  const prefetchChat = useWaveChatPrefetch();
  const ChatButton = waveActive ? TabButton : "button";
  const pathname = usePathname();
  const isCompetitionRoute = isCompetitionPathname(pathname);
  const phoneViewport = useMediaQuery(PHONE_WAVES_LAYOUT_QUERY);
  const setWaveCreateNavigation =
    useOptionalHeaderContext()?.setWaveCreateNavigation;
  const searchParams = useSearchParams();
  const { flat, nativeCompetition } = useCompetitionNavigation();
  const { activeContentTab } = useContentTab();
  const waveId = wave?.id;
  const locale = useBrowserLocale();
  const nativePresentation = useMemo(
    () =>
      (nativeCompetition?.presentation ?? []).map((item, id) => ({
        ...item,
        id,
      })),
    [nativeCompetition?.presentation]
  );
  const approveLabels = getApproveWaveTabLabelsFromMetadata(nativePresentation);
  const nativeTabLabel = (tab: (typeof COMPETITION_TABS)[number]) => {
    if (
      tab === "leaderboard" &&
      nativeCompetition &&
      isCompetitionSubmissionHistory(nativeCompetition)
    )
      return t(locale, "competitions.submissions");
    if (nativeCompetition?.type === ApiCompetitionType.Approve) {
      if (tab === "leaderboard") return approveLabels.approvals;
      if (tab === "decisions") return approveLabels.approved;
    }
    return t(
      locale,
      tab === "rules" ? "competitions.settings" : `competitions.${tab}`
    );
  };
  const requestedCompetitionTab = getCompetitionTab(
    searchParams.get("edit") === "1" ? "rules" : searchParams.get("tab")
  );
  const selectedCompetitionTab = requestedCompetitionTab;
  const mappedCompetitionTab = getLegacyCompetitionTab(selectedCompetitionTab);
  const selectedLegacyView = nativeCompetition
    ? (mappedCompetitionTab ?? BrainView.COMPETITIONS)
    : activeContentTab;
  const effectiveActiveView =
    (flat && isCompetitionRoute) ||
    (!isCompetitionRoute &&
      !hasWaveDestination(searchParams) &&
      waveCompetitionTabs[activeContentTab] !== undefined)
      ? (selectedLegacyView as unknown as BrainView)
      : activeView;
  const { registerRef } = useLayout();
  const { isIos } = useCapacitor();
  const { connectedProfile, isAuthenticated } = useAuth();
  const hasValidNotificationAuth = isAuthenticated === true;
  const shouldShowCurationTabs = Boolean(isApp && waveActive && wave?.id);
  const activeCurationId = shouldShowCurationTabs
    ? searchParams.get("curation")
    : null;
  const { data: curations = [], isPending: isCurationsPending } =
    useWaveCurationTabs({
      waveId: wave?.id ?? "",
      enabled: shouldShowCurationTabs,
    });
  const canManageCurations =
    wave?.wave.authenticated_user_eligible_for_admin === true;

  // Local ref for component-specific needs
  const mobileTabsRef = useRef<HTMLDivElement | null>(null);

  // Callback ref for registration with LayoutContext
  const setMobileTabsRef = useCallback(
    (element: HTMLDivElement | null) => {
      // Update local ref
      mobileTabsRef.current = element;

      // Register with LayoutContext
      registerRef("mobileTabs", element);
    },
    [registerRef]
  );

  const { isMemesWave, isCurationWave, isRankWave, isApproveWave, isDm } =
    useWave(wave);
  const phoneWaveLayout =
    phoneViewport && waveActive && pathname.startsWith("/waves/") && !isDm;
  const isCompetitionWave =
    isRankWave || isApproveWave || hasDefaultCompetition;
  const canShowMyVotesTab = isCompetitionWave || Boolean(nativeCompetition);

  // Get unread indicator for messages
  const { hasUnread: hasUnreadMessages } = useUnreadIndicator({
    type: "messages",
    handle: connectedProfile?.handle ?? null,
  });

  // Get unread notifications using the dedicated hook
  const { haveUnreadNotifications } = useUnreadNotifications(
    hasValidNotificationAuth ? (connectedProfile?.handle ?? null) : null,
    {
      enabled: hasValidNotificationAuth,
      profileId: connectedProfile?.id,
    }
  );

  const scrollActiveButtonIntoView = useCallback(
    (element: HTMLButtonElement | null) => {
      const prefersReducedMotion =
        typeof globalThis.matchMedia === "function" &&
        globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

      element?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        inline: "nearest",
        block: "nearest",
      });
    },
    []
  );

  const getActiveButtonRef = useCallback(
    (isActive: boolean) => (isActive ? scrollActiveButtonIntoView : null),
    [scrollActiveButtonIntoView]
  );

  const setConfigurationButtonRef = useSubmissionRulesTabRef({
    active: effectiveActiveView === BrainView.CONFIGURATION,
    isApp,
    waveId,
    onButtonRef: onConfigurationButtonRef,
    scrollIntoView: scrollActiveButtonIntoView,
  });

  const { tabsScrollerRef, restoreTabRowScroll } = useBrainMobileTabScroll(
    waveId,
    waveActive
  );

  const updateSelectedCuration = useCallback(
    (curationId: string | null) => {
      const params = new URLSearchParams(searchParams.toString() || "");

      if (curationId) {
        params.set("curation", curationId);
      } else {
        params.delete("curation");
      }

      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      const currentQuery = searchParams.toString();
      const currentUrl = currentQuery
        ? `${pathname}?${currentQuery}`
        : pathname;
      if (nextUrl === currentUrl) {
        return;
      }

      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const isChatActive =
    !isCompetitionRoute &&
    activeView === BrainView.DEFAULT &&
    activeCurationId === null;
  const backButtonClasses =
    "tw-flex tw-min-h-10 tw-shrink-0 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-bg-iron-900/80 tw-px-3 tw-py-2 tw-no-underline tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition-colors tw-duration-150 tw-ease-out motion-reduce:tw-transition-none desktop-hover:hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black";
  const streamBackButton =
    waveActive && showStreamBack && !isApp ? (
      <>
        <button
          type="button"
          onClick={() => {
            router.push(
              getWaveHomeRoute({ isDirectMessage: false, isApp: !!isApp })
            );
            onViewChange(BrainView.DEFAULT);
          }}
          className={backButtonClasses}
        >
          <ArrowLeftIcon className="tw-size-4 tw-text-iron-400" />
          <span className="tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-text-iron-400 sm:tw-text-sm">
            My Stream
          </span>
        </button>
        <div className="tw-mx-1 tw-h-4 tw-w-px tw-flex-shrink-0 tw-self-center tw-bg-iron-700" />
      </>
    ) : null;
  const isWaveNavigationLoading = getIsWaveNavigationLoading({
    waveActive,
    hasWave: Boolean(wave),
    waveNavigationReady,
    shouldShowCurationTabs,
    isCurationsPending,
  });

  const curationTabs = React.useMemo<
    Array<{ id: string; name: string }>
  >(() => {
    const mappedCurations = curations.map((curation) => ({
      id: curation.id,
      name: curation.name,
    }));

    if (
      !activeCurationId ||
      mappedCurations.some((curation) => curation.id === activeCurationId)
    ) {
      return mappedCurations;
    }

    return [
      {
        id: activeCurationId,
        name: t(locale, "wave.navigation.fallbackCuration"),
      },
      ...mappedCurations,
    ];
  }, [activeCurationId, curations, locale]);
  const handleWaveViewChange = (view: BrainView) => {
    const shouldPreserveSelectedCuration =
      isApp && view === BrainView.ABOUT && activeCurationId !== null;

    if (!shouldPreserveSelectedCuration) {
      updateSelectedCuration(null);
    }
    onViewChange(view);
  };

  const onChatClick = () => {
    handleWaveViewChange(BrainView.DEFAULT);
  };

  const onNotificationsClick = () => {
    handleWaveViewChange(BrainView.NOTIFICATIONS);
  };

  const onCurationClick = useCallback(
    (curationId: string) => {
      onViewChange(BrainView.DEFAULT);
      updateSelectedCuration(curationId);
    },
    [onViewChange, updateSelectedCuration]
  );

  useEffect(() => {
    if (
      !isApp ||
      !phoneWaveLayout ||
      !waveId ||
      !canManageCurations ||
      !setWaveCreateNavigation
    ) {
      return;
    }
    setWaveCreateNavigation({ waveId, onCreated: onCurationClick });
    return () => setWaveCreateNavigation(null);
  }, [
    isApp,
    phoneWaveLayout,
    waveId,
    canManageCurations,
    onCurationClick,
    setWaveCreateNavigation,
  ]);

  const showRoutedCompetitionTabs =
    flat && isCompetitionRoute && Boolean(nativeCompetition);
  const showSharedCompetitionTabs =
    Boolean(wave) &&
    waveActive &&
    isCompetitionWave &&
    (!isCompetitionRoute || (flat && !nativeCompetition));
  const showSettingsTab =
    Boolean(wave) &&
    waveActive &&
    (isCompetitionWave || Boolean(flat && nativeCompetition)) &&
    (!isCompetitionRoute || flat);
  const showDecisionsTab =
    waveActive && hasCompetitions && !hideCompetitionsTab;
  const onDecisionsClick = () => {
    if (isCompetitionRoute && wave) {
      router.push(getCompetitionsRoute(wave.id), { scroll: false });
      return;
    }
    handleWaveViewChange(BrainView.COMPETITIONS);
  };

  const viewTab = (
    view: BrainView,
    label: string,
    active = effectiveActiveView === view
  ): NativeWaveTab => ({
    key: view,
    label,
    active,
    onSelect: () => handleWaveViewChange(view),
  });

  const pollsTab = viewTab(
    BrainView.POLLS,
    t(locale, "wave.navigation.polls"),
    activeView === BrainView.POLLS
  );
  const salesTab = viewTab(
    BrainView.SALES,
    t(locale, "wave.navigation.sales"),
    activeView === BrainView.SALES
  );
  const votesTab = viewTab(BrainView.MY_VOTES, t(locale, "competitions.votes"));
  const faqTab = viewTab(BrainView.FAQ, t(locale, "wave.navigation.faq"));
  const settingsTab = viewTab(
    BrainView.CONFIGURATION,
    t(locale, "competitions.settings")
  );
  const decisionsTab: NativeWaveTab = {
    key: BrainView.COMPETITIONS,
    label: t(locale, "competitions.title"),
    badgeCount: activeCompetitionCount,
    active: !flat && activeView === BrainView.COMPETITIONS,
    onSelect: onDecisionsClick,
  };
  const routes: NativeWaveTab[] = showRoutedCompetitionTabs
    ? COMPETITION_TABS.filter(
        (tab) => tab !== "rules" && (tab !== "votes" || canShowMyVotesTab)
      ).map((tab) => ({
        key: getLegacyCompetitionTab(tab) ?? tab,
        label: nativeTabLabel(tab),
        active: selectedCompetitionTab === tab,
        onSelect: () => navigateTab(`${pathname}?tab=${tab}`),
      }))
    : [];
  const curationOptions: NativeWaveTab[] = shouldShowCurationTabs
    ? curationTabs.map(({ id, name }) => ({
        key: `curation:${id}`,
        curationId: id,
        label: name,
        active: activeView === BrainView.DEFAULT && id === activeCurationId,
        onSelect: () => onCurationClick(id),
      }))
    : [];

  const renderPhoneTabs = (
    leaderboardTabs: readonly NativeLeaderboardTab[] = []
  ) => {
    const showSalesTab =
      isCurationWave && (!isCompetitionRoute || showSharedCompetitionTabs);
    const showFaqTab =
      isMemesWave && (showSharedCompetitionTabs || showRoutedCompetitionTabs);
    const tabs: NativeWaveTab[] = [
      {
        key: BrainView.DEFAULT,
        label: t(locale, "wave.navigation.chat"),
        active: isChatActive,
        onIntent: prefetchChat,
        onSelect: onChatClick,
      },
    ];
    if (hasPolls) tabs.push(pollsTab);
    if (showSalesTab) tabs.push(salesTab);
    tabs.push(...routes);
    if (showSharedCompetitionTabs) {
      tabs.push(
        ...leaderboardTabs.map(({ view, label, active }) =>
          viewTab(view, label, active)
        )
      );
      if (canShowMyVotesTab) tabs.push(votesTab);
    }
    if (showFaqTab) tabs.push(faqTab);
    if (showSettingsTab) tabs.push(settingsTab);
    if (showDecisionsTab) tabs.push(decisionsTab);
    tabs.push(...curationOptions);

    return (
      <PhoneWaveTabs
        key={waveId}
        tabs={tabs}
        primaryKeys={PHONE_PRIMARY_VIEWS}
        activeKey={tabs.find((tab) => tab.active)?.key ?? ""}
        settingsRef={showSettingsTab ? setConfigurationButtonRef : undefined}
      />
    );
  };

  const renderWideWaveTab = (
    tab: NativeWaveTab,
    ref = getActiveButtonRef(tab.active)
  ) => (
    <TabButton
      key={tab.key}
      {...getTabStateProps(tab.active)}
      ref={ref}
      onClick={tab.onSelect}
      className={getTabButtonClassName(tab.active)}
      data-curation-id={tab.curationId}
    >
      <span
        className={getTabTextClassName({
          isActive: tab.active,
          additionalClasses: tab.curationId
            ? "tw-max-w-28 tw-truncate sm:tw-max-w-36"
            : undefined,
        })}
      >
        {tab.label}
      </span>
      <TabCountBadge count={tab.badgeCount} variant="wave" />
    </TabButton>
  );
  const salesTabButton =
    waveActive && wave && isCurationWave ? renderWideWaveTab(salesTab) : null;
  const createActionsMenu =
    isApp && wave && canManageCurations && !phoneWaveLayout ? (
      <MyStreamWaveCreateActionsMenu
        wave={wave}
        variant="mobile"
        onCreated={onCurationClick}
      />
    ) : null;
  let phoneTabs: React.ReactNode = null;
  if (phoneWaveLayout && !isWaveNavigationLoading) {
    phoneTabs =
      wave && showSharedCompetitionTabs ? (
        <WaveLeaderboardTabOptions wave={wave} activeView={effectiveActiveView}>
          {renderPhoneTabs}
        </WaveLeaderboardTabOptions>
      ) : (
        renderPhoneTabs()
      );
  }

  return (
    <nav
      ref={setMobileTabsRef}
      data-compact-keyboard-chat-tabs={
        isIos && waveActive && isChatActive ? "true" : undefined
      }
      aria-label={t(
        locale,
        waveActive
          ? "wave.navigation.waveSections"
          : "wave.navigation.appSections"
      )}
      className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-2 sm:tw-px-4 md:tw-px-6"
    >
      {isWaveNavigationLoading && (
        <div className="tw-flex tw-min-h-12 tw-w-full tw-items-center tw-gap-1.5 tw-overflow-hidden tw-px-0.5">
          {streamBackButton}
          <output
            aria-label={t(locale, "wave.navigation.loadingSections")}
            aria-busy="true"
            className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-1.5 tw-overflow-hidden"
          >
            <span className="tw-sr-only">
              {t(locale, "wave.navigation.loadingSections")}
            </span>
            {WAVE_TAB_SKELETONS.map(({ id, widthClassName }) => (
              <span
                key={id}
                aria-hidden="true"
                className={`tw-flex tw-h-10 tw-shrink-0 tw-items-center tw-px-3 ${widthClassName}`}
              >
                <span className="tw-h-4 tw-w-full tw-rounded-md tw-bg-iron-700/70 motion-safe:tw-animate-pulse" />
              </span>
            ))}
          </output>
          {createActionsMenu}
        </div>
      )}
      {phoneTabs}
      {!phoneWaveLayout && !isWaveNavigationLoading && (
        <div className="tw-flex tw-min-h-12 tw-w-full tw-min-w-0 tw-items-stretch tw-gap-1.5 tw-px-0.5">
          <div className="tw-relative tw-flex tw-min-w-0 tw-flex-1">
            <div
              ref={restoreTabRowScroll}
              data-wave-tabs-scroll="app"
              className="tw-flex tw-min-w-0 tw-flex-1 tw-items-stretch tw-justify-start tw-gap-1.5 tw-overflow-x-auto tw-overflow-y-hidden tw-scrollbar-none"
            >
              {streamBackButton}
              {!waveActive && showWavesTab && (
                <button
                  {...getTabStateProps(activeView === BrainView.WAVES)}
                  ref={getActiveButtonRef(activeView === BrainView.WAVES)}
                  onClick={() => handleWaveViewChange(BrainView.WAVES)}
                  className={getTabButtonClassName(
                    activeView === BrainView.WAVES
                  )}
                >
                  <span
                    className={getTabTextClassName({
                      isActive: activeView === BrainView.WAVES,
                    })}
                  >
                    Waves
                  </span>
                </button>
              )}
              {!isApp && !waveActive && (
                <button
                  {...getTabStateProps(activeView === BrainView.MESSAGES)}
                  ref={getActiveButtonRef(activeView === BrainView.MESSAGES)}
                  onClick={() => handleWaveViewChange(BrainView.MESSAGES)}
                  className={getTabButtonClassName(
                    activeView === BrainView.MESSAGES
                  )}
                >
                  <span
                    className={getTabTextClassName({
                      isActive: activeView === BrainView.MESSAGES,
                      additionalClasses: "tw-relative",
                    })}
                  >
                    <span>Messages</span>
                    {hasUnreadMessages && (
                      <div className="tw-absolute -tw-right-3 tw-top-0 tw-h-2 tw-w-2 tw-rounded-full tw-bg-red"></div>
                    )}
                  </span>
                </button>
              )}
              <ChatButton
                {...getTabStateProps(isChatActive)}
                ref={getActiveButtonRef(isChatActive)}
                onClick={onChatClick}
                onPointerEnter={prefetchChat}
                onFocus={prefetchChat}
                className={getTabButtonClassName(isChatActive)}
              >
                <span
                  className={getTabTextClassName({ isActive: isChatActive })}
                >
                  {t(
                    locale,
                    waveActive
                      ? "wave.navigation.chat"
                      : "wave.navigation.myStream"
                  )}
                </span>
              </ChatButton>
              {waveActive && wave && hasPolls && renderWideWaveTab(pollsTab)}
              {!isCompetitionRoute && !isCompetitionWave && salesTabButton}
              {routes.map((tab) => renderWideWaveTab(tab))}
              {wave && showSharedCompetitionTabs && (
                <>
                  <MyStreamWaveTabsLeaderboard
                    wave={wave}
                    activeView={effectiveActiveView}
                    onViewChange={handleWaveViewChange}
                    renderAfterLeaderboard={salesTabButton}
                  />
                  {canShowMyVotesTab && renderWideWaveTab(votesTab)}
                  {isMemesWave && renderWideWaveTab(faqTab)}
                </>
              )}
              {showSettingsTab &&
                renderWideWaveTab(settingsTab, setConfigurationButtonRef)}
              {showDecisionsTab && renderWideWaveTab(decisionsTab)}
              {curationOptions.map((tab) => renderWideWaveTab(tab))}
              {!isApp && !waveActive && (
                <button
                  {...getTabStateProps(activeView === BrainView.NOTIFICATIONS)}
                  ref={getActiveButtonRef(
                    activeView === BrainView.NOTIFICATIONS
                  )}
                  onClick={onNotificationsClick}
                  className={getTabButtonClassName(
                    activeView === BrainView.NOTIFICATIONS
                  )}
                >
                  <span
                    className={getTabTextClassName({
                      isActive: activeView === BrainView.NOTIFICATIONS,
                      additionalClasses: "tw-relative",
                    })}
                  >
                    Notifications
                    {haveUnreadNotifications && (
                      <div className="tw-absolute -tw-right-1 -tw-top-1 tw-h-2 tw-w-2 tw-rounded-full tw-bg-red"></div>
                    )}
                  </span>
                </button>
              )}
            </div>
            <MobileTabsScrollControls
              scrollerRef={tabsScrollerRef}
              showButtons={false}
              fadeColorClassName={
                isApp
                  ? "tw-from-[#0d0d0e] tw-via-[#0d0d0e]/80"
                  : "tw-from-black tw-via-black/80"
              }
            />
          </div>
          {createActionsMenu}
        </div>
      )}
    </nav>
  );
};
export default BrainMobileTabs;
