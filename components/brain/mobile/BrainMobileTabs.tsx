"use client";

import React, { useCallback, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BrainView } from "./brainMobileViews";
import type { ApiWave } from "@/generated/models/ApiWave";
import MyStreamWaveTabsLeaderboard from "../my-stream/MyStreamWaveTabsLeaderboard";
import { useLayout } from "../my-stream/layout/LayoutContext";
import { useWave } from "@/hooks/useWave";
import { ArrowLeftIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAuth } from "@/components/auth/Auth";
import { getWaveHomeRoute } from "../../../helpers/navigation.helpers";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import MyStreamWaveCurationCreateDialog from "../my-stream/tabs/MyStreamWaveCurationCreateDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const ACTIVE_TAB_BACKGROUND = "tw-border-primary-300 tw-bg-transparent";
const INACTIVE_TAB_BACKGROUND =
  "tw-border-transparent tw-bg-transparent active:tw-bg-white/[0.05]";
const ACTIVE_TAB_TEXT = "tw-text-white";
const INACTIVE_TAB_TEXT =
  "tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-200 group-active:tw-text-iron-100";
const BASE_TAB_BUTTON_CLASS_NAME =
  "tw-group -tw-mb-px tw-flex tw-min-h-10 tw-shrink-0 tw-items-center tw-justify-center tw-gap-1 tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-px-3 tw-py-2 tw-no-underline tw-transition-colors tw-duration-150 tw-ease-out motion-reduce:tw-transition-none focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-300";
const BASE_TAB_TEXT_CLASS_NAME =
  "tw-max-w-36 tw-truncate tw-whitespace-nowrap tw-text-sm tw-font-medium sm:tw-max-w-44";

const WAVE_TAB_SKELETONS = [
  { id: "chat", widthClassName: "tw-w-14" },
  { id: "about", widthClassName: "tw-w-20" },
  { id: "primary", widthClassName: "tw-w-24" },
  { id: "secondary", widthClassName: "tw-w-16" },
  { id: "outcome", widthClassName: "tw-w-20" },
];

const getTabButtonClassName = (isActive: boolean): string =>
  `${BASE_TAB_BUTTON_CLASS_NAME} ${
    isActive ? ACTIVE_TAB_BACKGROUND : INACTIVE_TAB_BACKGROUND
  }`;

const getTabTextClassName = ({
  isActive,
  additionalClasses,
}: {
  readonly isActive: boolean;
  readonly additionalClasses?: string | undefined;
}): string => {
  const additionalClassName = additionalClasses ? ` ${additionalClasses}` : "";
  const textColorClassName = isActive ? ACTIVE_TAB_TEXT : INACTIVE_TAB_TEXT;

  return `${BASE_TAB_TEXT_CLASS_NAME}${additionalClassName} ${textColorClassName}`;
};

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
  readonly activeView: BrainView;
  readonly onViewChange: (view: BrainView) => void;
  readonly wave?: ApiWave | undefined;
  readonly waveActive: boolean;
  readonly hasPolls?: boolean | undefined;
  readonly outcomesVisible?: boolean | undefined;
  readonly waveNavigationReady?: boolean | undefined;
  readonly showWavesTab: boolean;
  readonly showStreamBack: boolean;
  readonly isApp?: boolean | undefined;
}

const BrainMobileTabs: React.FC<BrainMobileTabsProps> = ({
  activeView,
  onViewChange,
  wave,
  waveActive,
  hasPolls = false,
  outcomesVisible = true,
  waveNavigationReady = true,
  showWavesTab,
  showStreamBack,
  isApp,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useBrowserLocale();
  const { registerRef } = useLayout();
  const { connectedProfile, isAuthenticated } = useAuth();
  const hasValidNotificationAuth = isAuthenticated === true;
  const hasAuthenticatedProfile = Boolean(connectedProfile?.handle);
  const [isCreateCurationOpen, setIsCreateCurationOpen] = useState(false);
  const shouldShowCurationTabs = Boolean(isApp && waveActive && wave?.id);
  const activeCurationId = shouldShowCurationTabs
    ? searchParams.get("curation")
    : null;
  const { data: curations = [], isPending: isCurationsPending } =
    useWaveCurations({
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

  const { isMemesWave, isCurationWave, isRankWave, isApproveWave } =
    useWave(wave);
  const isCompetitionWave = isRankWave || isApproveWave;
  const supportsOutcomeView =
    isCompetitionWave && !isCurationWave && outcomesVisible;
  const canShowMyVotesTab = isCurationWave || hasAuthenticatedProfile;

  // Get unread indicator for messages
  const { hasUnread: hasUnreadMessages } = useUnreadIndicator({
    type: "messages",
    handle: connectedProfile?.handle ?? null,
  });

  // Get unread notifications using the dedicated hook
  const { haveUnreadNotifications } = useUnreadNotifications(
    hasValidNotificationAuth ? (connectedProfile?.handle ?? null) : null,
    { enabled: hasValidNotificationAuth }
  );

  const scrollActiveButtonIntoView = useCallback(
    (element: HTMLButtonElement | null) => {
      const prefersReducedMotion =
        typeof globalThis.matchMedia === "function" &&
        globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

      element?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        inline: "center",
        block: "nearest",
      });
    },
    []
  );

  const getActiveButtonRef = useCallback(
    (isActive: boolean) => (element: HTMLButtonElement | null) => {
      if (isActive) {
        scrollActiveButtonIntoView(element);
      }
    },
    [scrollActiveButtonIntoView]
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
    activeView === BrainView.DEFAULT && activeCurationId === null;
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

  const onCurationClick = (curationId: string) => {
    onViewChange(BrainView.DEFAULT);
    updateSelectedCuration(curationId);
  };

  const salesTabButton =
    waveActive && wave && isCurationWave ? (
      <button
        {...getTabStateProps(activeView === BrainView.SALES)}
        ref={getActiveButtonRef(activeView === BrainView.SALES)}
        onClick={() => handleWaveViewChange(BrainView.SALES)}
        className={getTabButtonClassName(activeView === BrainView.SALES)}
      >
        <span
          className={getTabTextClassName({
            isActive: activeView === BrainView.SALES,
          })}
        >
          Sales
        </span>
      </button>
    ) : null;
  const createCurationButton =
    isApp && canManageCurations ? (
      <button
        type="button"
        onClick={() => setIsCreateCurationOpen(true)}
        className="tw-inline-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-self-center tw-rounded-lg tw-border-0 tw-bg-iron-900/80 tw-text-iron-200 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-150 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none"
        aria-label="Create curation"
      >
        <PlusIcon className="tw-size-4 tw-flex-shrink-0" />
      </button>
    ) : null;

  return (
    <nav
      ref={setMobileTabsRef}
      aria-label={t(
        locale,
        waveActive
          ? "wave.navigation.waveSections"
          : "wave.navigation.appSections"
      )}
      className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-900 tw-px-2 sm:tw-px-4 md:tw-px-6"
    >
      {isWaveNavigationLoading ? (
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
          {createCurationButton}
        </div>
      ) : (
        <div className="tw-flex tw-min-h-12 tw-w-full tw-min-w-0 tw-items-stretch tw-gap-1.5 tw-px-0.5">
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-stretch tw-justify-start tw-gap-1.5 tw-overflow-x-auto tw-overflow-y-hidden tw-scrollbar-none">
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
            <button
              {...getTabStateProps(isChatActive)}
              ref={getActiveButtonRef(isChatActive)}
              onClick={onChatClick}
              className={getTabButtonClassName(isChatActive)}
            >
              <span className={getTabTextClassName({ isActive: isChatActive })}>
                {waveActive ? "Chat" : "My Stream"}
              </span>
            </button>
            {waveActive && (
              <button
                {...getTabStateProps(activeView === BrainView.ABOUT)}
                ref={getActiveButtonRef(activeView === BrainView.ABOUT)}
                onClick={() => handleWaveViewChange(BrainView.ABOUT)}
                className={getTabButtonClassName(
                  activeView === BrainView.ABOUT
                )}
              >
                <span
                  className={getTabTextClassName({
                    isActive: activeView === BrainView.ABOUT,
                  })}
                >
                  About
                </span>
              </button>
            )}
            {waveActive && wave && hasPolls && (
              <button
                {...getTabStateProps(activeView === BrainView.POLLS)}
                ref={getActiveButtonRef(activeView === BrainView.POLLS)}
                onClick={() => handleWaveViewChange(BrainView.POLLS)}
                className={getTabButtonClassName(
                  activeView === BrainView.POLLS
                )}
              >
                <span
                  className={getTabTextClassName({
                    isActive: activeView === BrainView.POLLS,
                  })}
                >
                  Polls
                </span>
              </button>
            )}
            {!isCompetitionWave && salesTabButton}
            {waveActive && wave && isCompetitionWave && (
              <>
                <MyStreamWaveTabsLeaderboard
                  wave={wave}
                  activeView={activeView}
                  onViewChange={handleWaveViewChange}
                  renderAfterLeaderboard={salesTabButton}
                />
                {canShowMyVotesTab && (
                  <>
                    <button
                      {...getTabStateProps(activeView === BrainView.MY_VOTES)}
                      ref={getActiveButtonRef(
                        activeView === BrainView.MY_VOTES
                      )}
                      onClick={() => handleWaveViewChange(BrainView.MY_VOTES)}
                      className={getTabButtonClassName(
                        activeView === BrainView.MY_VOTES
                      )}
                    >
                      <span
                        className={getTabTextClassName({
                          isActive: activeView === BrainView.MY_VOTES,
                        })}
                      >
                        My Votes
                      </span>
                    </button>
                  </>
                )}
                {supportsOutcomeView && (
                  <button
                    {...getTabStateProps(activeView === BrainView.OUTCOME)}
                    ref={getActiveButtonRef(activeView === BrainView.OUTCOME)}
                    onClick={() => handleWaveViewChange(BrainView.OUTCOME)}
                    className={getTabButtonClassName(
                      activeView === BrainView.OUTCOME
                    )}
                  >
                    <span
                      className={getTabTextClassName({
                        isActive: activeView === BrainView.OUTCOME,
                      })}
                    >
                      Outcome
                    </span>
                  </button>
                )}
                {isMemesWave && (
                  <button
                    {...getTabStateProps(activeView === BrainView.FAQ)}
                    ref={getActiveButtonRef(activeView === BrainView.FAQ)}
                    onClick={() => handleWaveViewChange(BrainView.FAQ)}
                    className={getTabButtonClassName(
                      activeView === BrainView.FAQ
                    )}
                  >
                    <span
                      className={getTabTextClassName({
                        isActive: activeView === BrainView.FAQ,
                      })}
                    >
                      FAQ
                    </span>
                  </button>
                )}
              </>
            )}
            {shouldShowCurationTabs &&
              curationTabs.map((curation) => {
                const isActive =
                  activeView === BrainView.DEFAULT &&
                  curation.id === activeCurationId;

                return (
                  <button
                    key={curation.id}
                    type="button"
                    data-curation-id={curation.id}
                    aria-current={isActive ? "true" : undefined}
                    ref={getActiveButtonRef(isActive)}
                    onClick={() => onCurationClick(curation.id)}
                    className={getTabButtonClassName(isActive)}
                  >
                    <span
                      className={getTabTextClassName({
                        isActive,
                        additionalClasses:
                          "tw-max-w-28 tw-truncate sm:tw-max-w-36",
                      })}
                    >
                      {curation.name}
                    </span>
                  </button>
                );
              })}
            {!isApp && !waveActive && (
              <button
                {...getTabStateProps(activeView === BrainView.NOTIFICATIONS)}
                ref={getActiveButtonRef(activeView === BrainView.NOTIFICATIONS)}
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
          {createCurationButton}
        </div>
      )}
      {wave && isCreateCurationOpen && (
        <MyStreamWaveCurationCreateDialog
          wave={wave}
          isOpen={isCreateCurationOpen}
          onClose={() => setIsCreateCurationOpen(false)}
          onSaved={(curation) => {
            onCurationClick(curation.id);
            setIsCreateCurationOpen(false);
          }}
        />
      )}
    </nav>
  );
};
export default BrainMobileTabs;
