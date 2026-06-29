"use client";

import { useAuth } from "@/components/auth/Auth";
import MyStreamWaveChat from "@/components/brain/my-stream/MyStreamWaveChat";
import WavePicture from "@/components/waves/WavePicture";
import { SIDEBAR_MOBILE_BREAKPOINT } from "@/constants/sidebar";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import { formatAddress, isValidEthAddress } from "@/helpers/Helpers";
import {
  getMessagePathRoute,
  getMessagesBaseRoute,
} from "@/helpers/navigation.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useMarkWaveNotificationsRead } from "@/hooks/useMarkWaveNotificationsRead";
import { useWaveData } from "@/hooks/useWaveData";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getDropQueryKey } from "@/services/api/drop-api";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftRightIcon,
  InboxIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

type QuickDmView = "closed" | "list" | "chat";
type WavePictureContributors = React.ComponentProps<
  typeof WavePicture
>["contributors"];

interface QuickDmState {
  readonly view: QuickDmView;
  readonly waveId: string | null;
}

interface QuickDmAvatarSource {
  readonly name: string;
  readonly picture: string | null;
  readonly contributors: WavePictureContributors;
}

interface QuickDmChatProps {
  readonly hasUnreadOutsideCurrentChat: boolean;
  readonly listWave: MinimalWave | null;
  readonly locale: SupportedLocale;
  readonly onBack: () => void;
  readonly onClose: () => void;
  readonly onOpenAll: () => void;
  readonly waveId: string;
}

const QUICK_DM_STORAGE_KEY = "6529.quickDirectMessages.state";
const CLOSED_STATE: QuickDmState = { view: "closed", waveId: null };
const LIST_STATE: QuickDmState = { view: "list", waveId: null };
const CHAT_PANEL_STYLE: React.CSSProperties = {
  height: "100%",
  maxHeight: "100%",
};
const QUICK_DM_POSITION_CLASS =
  "tailwind-scope tw-fixed tw-bottom-24 tw-right-6 tw-z-[70] xl:tw-bottom-6";

const isQuickDmState = (value: unknown): value is QuickDmState => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<QuickDmState>;
  return (
    (candidate.view === "closed" ||
      candidate.view === "list" ||
      candidate.view === "chat") &&
    (candidate.waveId === null || typeof candidate.waveId === "string")
  );
};

const readStoredState = (): QuickDmState => {
  if (typeof globalThis.window === "undefined") {
    return CLOSED_STATE;
  }

  try {
    const raw = globalThis.window.localStorage.getItem(QUICK_DM_STORAGE_KEY);
    if (!raw) {
      return CLOSED_STATE;
    }

    const parsed = JSON.parse(raw) as unknown;
    return isQuickDmState(parsed) ? parsed : CLOSED_STATE;
  } catch {
    return CLOSED_STATE;
  }
};

const storeState = (state: QuickDmState) => {
  if (typeof globalThis.window === "undefined") {
    return;
  }

  try {
    globalThis.window.localStorage.setItem(
      QUICK_DM_STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch {
    // Ignore storage failures; in-memory state still works.
  }
};

const getUnreadCount = (wave: MinimalWave): number =>
  Math.max(wave.unreadDropsCount, wave.newDropsCount.count);

const getQuickDmLatestMessageTimestamp = (wave: MinimalWave): number | null => {
  const timestamp = wave.newDropsCount.latestDropTimestamp;
  return timestamp !== null && timestamp > 0 && Number.isFinite(timestamp)
    ? timestamp
    : null;
};

const getQuickDmTimeLabel = ({
  locale,
  referenceTime = Date.now(),
  timestamp,
}: {
  readonly locale: SupportedLocale;
  readonly referenceTime?: number;
  readonly timestamp: number;
}): string => {
  const timeDifference = referenceTime - timestamp;
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 1) {
    return formatDate(locale, timestamp, { month: "short", day: "numeric" });
  }

  if (days === 1) {
    return t(locale, "quickDm.timeYesterday");
  }

  if (hours > 0) {
    return t(locale, "quickDm.timeHours", {
      count: formatInteger(locale, hours),
    });
  }

  if (minutes > 0) {
    return t(locale, "quickDm.timeMinutes", {
      count: formatInteger(locale, minutes),
    });
  }

  return t(locale, "quickDm.timeJustNow");
};

const getQuickDmScoreLabel = (
  wave: MinimalWave,
  locale: SupportedLocale
): string | null => {
  const score = wave.waveScore?.visibility_score;
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }

  return formatInteger(locale, Math.round(score));
};

const getQuickDmConversationAriaLabel = ({
  locale,
  scoreLabel,
  timeLabel,
  title,
}: {
  readonly locale: SupportedLocale;
  readonly scoreLabel: string | null;
  readonly timeLabel: string;
  readonly title: string;
}): string => {
  if (scoreLabel === null) {
    return t(locale, "quickDm.openConversationTimeAriaLabel", {
      name: title,
      time: timeLabel,
    });
  }

  return t(locale, "quickDm.openConversationMetaAriaLabel", {
    name: title,
    score: scoreLabel,
    time: timeLabel,
  });
};

const getFormattedWaveName = (wave: Pick<MinimalWave, "name">): string => {
  const marker = "id-";
  const addressPrefix = `${marker}0x`;
  const markerIndex = wave.name.indexOf(addressPrefix);

  if (markerIndex === -1) {
    return wave.name;
  }

  const prefix = wave.name.slice(0, markerIndex + marker.length);
  const addressStart = markerIndex + marker.length;
  const candidateAddress = wave.name.slice(addressStart, addressStart + 42);

  if (!isValidEthAddress(candidateAddress)) {
    return wave.name;
  }

  const suffix = wave.name.slice(addressStart + candidateAddress.length);
  return `${prefix}${formatAddress(candidateAddress)}${suffix}`;
};

const getQuickDmAvatarSource = (
  displayName: string,
  listWave: MinimalWave | null,
  wave: ApiWave | undefined
): QuickDmAvatarSource | null => {
  if (listWave || wave) {
    return {
      name: displayName,
      picture: wave?.picture ?? listWave?.picture ?? null,
      contributors:
        wave?.contributors_overview.map((contributor) => ({
          identity: contributor.contributor_identity,
          pfp: contributor.contributor_pfp,
        })) ??
        listWave?.contributors ??
        [],
    };
  }

  return null;
};

const getDesktopViewportSnapshot = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(`(min-width: ${SIDEBAR_MOBILE_BREAKPOINT}px)`)
    .matches;
};

const subscribeDesktopViewport = (onStoreChange: () => void): (() => void) => {
  if (typeof globalThis.window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = globalThis.window.matchMedia(
    `(min-width: ${SIDEBAR_MOBILE_BREAKPOINT}px)`
  );

  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
};

const useIsQuickDmDesktop = (): boolean => {
  const { isApp, isMobileDevice } = useDeviceInfo();
  const isDesktopViewport = useSyncExternalStore(
    subscribeDesktopViewport,
    getDesktopViewportSnapshot,
    () => false
  );

  return !isApp && !isMobileDevice && isDesktopViewport;
};

const QuickDmIconButton = ({
  hasUnreadIndicator = false,
  label,
  onClick,
  children,
}: {
  readonly hasUnreadIndicator?: boolean;
  readonly label: string;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className="tw-relative tw-inline-flex tw-size-8 tw-appearance-none tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition hover:tw-bg-white/10 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
  >
    {children}
    {hasUnreadIndicator && (
      <span
        className="tw-absolute tw-right-1 tw-top-1 tw-size-2.5 tw-rounded-full tw-bg-red tw-ring-2 tw-ring-iron-950"
        aria-hidden="true"
      />
    )}
  </button>
);

const QuickDmPanelHeader = ({
  avatar,
  hasBackUnreadIndicator = false,
  locale,
  openAllHref,
  title,
  onBack,
  onClose,
  onOpenAll,
}: {
  readonly avatar?: React.ReactNode;
  readonly hasBackUnreadIndicator?: boolean;
  readonly locale: SupportedLocale;
  readonly openAllHref?: string | undefined;
  readonly title: string;
  readonly onBack?: (() => void) | undefined;
  readonly onClose: () => void;
  readonly onOpenAll?: (() => void) | undefined;
}) => (
  <div className="tw-flex tw-h-12 tw-flex-shrink-0 tw-items-center tw-gap-2 tw-border-b tw-border-white/10 tw-px-3">
    {onBack && (
      <QuickDmIconButton
        hasUnreadIndicator={hasBackUnreadIndicator}
        label={t(
          locale,
          hasBackUnreadIndicator
            ? "quickDm.backUnreadAriaLabel"
            : "quickDm.backAriaLabel"
        )}
        onClick={onBack}
      >
        <ArrowLeftIcon className="tw-size-4" aria-hidden="true" />
      </QuickDmIconButton>
    )}
    {avatar}
    <div className="tw-min-w-0 tw-flex-1">
      <h2 className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-50">
        {title}
      </h2>
    </div>
    {onOpenAll && openAllHref && (
      <Link
        href={openAllHref}
        onClick={onOpenAll}
        aria-label={t(locale, "quickDm.openConversationAriaLabel", {
          name: title,
        })}
        title={t(locale, "quickDm.openConversation")}
        className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-text-iron-300 tw-transition hover:tw-bg-white/10 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        <ArrowTopRightOnSquareIcon className="tw-size-4" aria-hidden="true" />
      </Link>
    )}
    <QuickDmIconButton
      label={t(locale, "quickDm.closeAriaLabel")}
      onClick={onClose}
    >
      <XMarkIcon className="tw-size-4" aria-hidden="true" />
    </QuickDmIconButton>
  </div>
);

const QuickDmHeaderAvatar = ({
  avatar,
}: {
  readonly avatar: QuickDmAvatarSource;
}) => (
  <div className="tw-size-7 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full tw-ring-1 tw-ring-white/15">
    <WavePicture
      name={avatar.name}
      picture={avatar.picture}
      contributors={avatar.contributors}
    />
  </div>
);

const QuickDmLoadingRows = ({
  locale,
}: {
  readonly locale: SupportedLocale;
}) => (
  <>
    <span className="tw-sr-only" role="status" aria-live="polite">
      {t(locale, "quickDm.loadingStatus")}
    </span>
    <div className="tw-flex tw-flex-col tw-gap-2 tw-p-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="tw-flex tw-items-center tw-gap-3 tw-p-2">
          <div className="tw-size-10 tw-rounded-full tw-bg-white/10" />
          <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2">
            <div className="tw-h-3 tw-w-32 tw-rounded-full tw-bg-white/10" />
            <div className="tw-h-2.5 tw-w-24 tw-rounded-full tw-bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  </>
);

const QuickDmEmptyState = ({
  locale,
}: {
  readonly locale: SupportedLocale;
}) => (
  <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-px-6 tw-py-10 tw-text-center">
    <div className="tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-bg-white/5 tw-ring-1 tw-ring-white/10">
      <InboxIcon className="tw-size-5 tw-text-iron-300" aria-hidden="true" />
    </div>
    <p className="tw-text-sm tw-font-medium tw-text-iron-100">
      {t(locale, "quickDm.emptyTitle")}
    </p>
  </div>
);

const QuickDmConversationRow = ({
  locale,
  onOpen,
  onHover,
  wave,
}: {
  readonly locale: SupportedLocale;
  readonly onOpen: (waveId: string) => void;
  readonly onHover: (waveId: string) => void;
  readonly wave: MinimalWave;
}) => {
  const unreadCount = getUnreadCount(wave);
  const title = getFormattedWaveName(wave);
  const displayUnreadCount = unreadCount > 99 ? "99+" : `${unreadCount}`;
  const latestMessageTimestamp = getQuickDmLatestMessageTimestamp(wave);
  const timeLabel =
    latestMessageTimestamp === null
      ? t(locale, "quickDm.noMessagesYet")
      : getQuickDmTimeLabel({ locale, timestamp: latestMessageTimestamp });
  const scoreLabel = getQuickDmScoreLabel(wave, locale);
  const rowAriaLabel = getQuickDmConversationAriaLabel({
    locale,
    scoreLabel,
    timeLabel,
    title,
  });

  return (
    <button
      type="button"
      onClick={() => onOpen(wave.id)}
      onFocus={() => onHover(wave.id)}
      onMouseEnter={() => onHover(wave.id)}
      className="tw-group tw-flex tw-w-full tw-appearance-none tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-iron-900/80 tw-px-2 tw-py-2.5 tw-text-left tw-text-inherit tw-ring-1 tw-ring-white/10 tw-transition hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      aria-label={rowAriaLabel}
    >
      <div className="tw-relative tw-size-10 tw-flex-shrink-0 tw-rounded-full tw-ring-1 tw-ring-white/15">
        <WavePicture
          name={title}
          picture={wave.picture}
          contributors={wave.contributors}
        />
        {unreadCount > 0 && (
          <span
            className="tw-absolute tw-right-[-6px] tw-top-[-6px] tw-flex tw-h-5 tw-min-w-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-indigo-500 tw-px-1 tw-text-[11px] tw-font-semibold tw-leading-none tw-text-white tw-shadow-sm tw-ring-2 tw-ring-iron-950"
            aria-hidden="true"
          >
            {displayUnreadCount}
          </span>
        )}
      </div>
      <div className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-truncate tw-text-sm tw-font-medium tw-text-iron-100 group-hover:tw-text-white">
          {title}
        </span>
        <p className="tw-mt-0.5 tw-truncate tw-text-xs tw-text-iron-400">
          {timeLabel}
        </p>
      </div>
      {scoreLabel !== null && (
        <div
          className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1 tw-text-iron-200"
          title={t(locale, "quickDm.scoreLabel", { score: scoreLabel })}
          aria-hidden="true"
        >
          <ShieldCheckIcon
            className="tw-size-4 tw-text-iron-400"
            aria-hidden="true"
          />
          <span className="tw-text-sm tw-font-semibold tw-tabular-nums">
            {scoreLabel}
          </span>
        </div>
      )}
    </button>
  );
};

const QuickDmListPanel = ({
  isFetching,
  locale,
  onClose,
  onOpenAll,
  onOpenChat,
  onRegisterWave,
  waves,
}: {
  readonly isFetching: boolean;
  readonly locale: SupportedLocale;
  readonly onClose: () => void;
  readonly onOpenAll: () => void;
  readonly onOpenChat: (waveId: string) => void;
  readonly onRegisterWave: (waveId: string) => void;
  readonly waves: MinimalWave[];
}) => {
  const recentWaves = waves.slice(0, 5);
  let content: React.ReactNode;

  if (isFetching && waves.length === 0) {
    content = <QuickDmLoadingRows locale={locale} />;
  } else if (recentWaves.length > 0) {
    content = (
      <div className="tw-flex tw-flex-col tw-gap-1">
        {recentWaves.map((wave) => (
          <QuickDmConversationRow
            key={wave.id}
            locale={locale}
            wave={wave}
            onOpen={onOpenChat}
            onHover={onRegisterWave}
          />
        ))}
      </div>
    );
  } else {
    content = <QuickDmEmptyState locale={locale} />;
  }

  return (
    <div className="tw-flex tw-max-h-[420px] tw-w-[340px] tw-flex-col tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
      <QuickDmPanelHeader
        locale={locale}
        title={t(locale, "quickDm.listTitle")}
        onClose={onClose}
      />
      <div className="tw-min-h-0 tw-overflow-y-auto tw-p-2">{content}</div>
      <div className="tw-border-t tw-border-white/10 tw-p-2">
        <Link
          href={getMessagesBaseRoute(false)}
          onClick={onOpenAll}
          className="hover:tw-text-primary-200 tw-flex tw-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-text-sm tw-font-semibold tw-text-primary-300 tw-transition hover:tw-bg-white/5 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "quickDm.showAll")}
        </Link>
      </div>
    </div>
  );
};

const QuickDmChat = ({
  hasUnreadOutsideCurrentChat,
  listWave,
  locale,
  onBack,
  onClose,
  onOpenAll,
  waveId,
}: QuickDmChatProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { directMessages, registerWave } = useMyStream();
  const markDirectMessageRead = directMessages.markWaveRead;
  const { updateEligibility } = useWaveEligibility();
  const markWaveNotificationsRead = useMarkWaveNotificationsRead();
  const { data: wave, isFetching, isError } = useWaveData({ waveId });
  const title = getFormattedWaveName({
    name: wave?.name ?? listWave?.name ?? "",
  });
  const avatar = getQuickDmAvatarSource(title, listWave, wave);
  const listUnreadCount = listWave ? getUnreadCount(listWave) : 0;
  const hasMarkedInitialReadRef = useRef<string | null>(null);
  let chatContent: React.ReactNode = null;

  const markQuickDmRead = useCallback(() => {
    if (
      typeof document === "undefined" ||
      document.visibilityState !== "visible"
    ) {
      return;
    }

    markDirectMessageRead(waveId);
    void markWaveNotificationsRead(waveId).catch(() => undefined);
  }, [markDirectMessageRead, markWaveNotificationsRead, waveId]);

  useEffect(() => {
    registerWave(waveId, true);
  }, [registerWave, waveId]);

  useEffect(() => {
    if (hasMarkedInitialReadRef.current !== waveId) {
      hasMarkedInitialReadRef.current = waveId;
      markQuickDmRead();
      return;
    }

    if (listUnreadCount > 0) {
      markQuickDmRead();
    }
  }, [listUnreadCount, markQuickDmRead, waveId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markQuickDmRead();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [markQuickDmRead]);

  useEffect(() => {
    if (!wave) {
      return;
    }

    updateEligibility(wave.id, {
      authenticated_user_eligible_to_chat:
        wave.chat.authenticated_user_eligible,
      authenticated_user_eligible_to_vote:
        wave.voting.authenticated_user_eligible,
      authenticated_user_eligible_to_participate:
        wave.participation.authenticated_user_eligible,
      authenticated_user_admin: wave.wave.authenticated_user_eligible_for_admin,
    });
  }, [updateEligibility, wave]);

  const openDropInMessages = useCallback(
    (drop: ExtendedDrop) => {
      queryClient.setQueryData<ApiDrop>(getDropQueryKey(drop.id), drop);
      router.push(
        `${getMessagePathRoute(waveId)}?drop=${encodeURIComponent(drop.id)}`
      );
    },
    [queryClient, router, waveId]
  );

  if (wave) {
    chatContent = (
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={listWave?.firstUnreadDropSerialNo ?? null}
        viewMode="chat"
        onDropClick={openDropInMessages}
        waveViewStyleOverride={CHAT_PANEL_STYLE}
      />
    );
  } else if (isFetching) {
    chatContent = <QuickDmLoadingRows locale={locale} />;
  } else if (isError) {
    chatContent = (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-p-6 tw-text-center tw-text-sm tw-text-iron-300">
        {t(locale, "quickDm.chatLoadError")}
      </div>
    );
  }

  return (
    <div className="tw-flex tw-h-[560px] tw-max-h-[calc(100dvh-2rem)] tw-w-[380px] tw-flex-col tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
      <QuickDmPanelHeader
        hasBackUnreadIndicator={hasUnreadOutsideCurrentChat}
        locale={locale}
        title={title || t(locale, "quickDm.chatTitleFallback")}
        avatar={avatar ? <QuickDmHeaderAvatar avatar={avatar} /> : undefined}
        openAllHref={getMessagePathRoute(waveId)}
        onBack={onBack}
        onClose={onClose}
        onOpenAll={onOpenAll}
      />
      <div className="tw-min-h-0 tw-flex-1">{chatContent}</div>
    </div>
  );
};

export default function QuickDirectMessages() {
  const { connectedProfile, showWaves } = useAuth();
  const isDesktop = useIsQuickDmDesktop();
  const locale = useBrowserLocale();
  const { directMessages, registerWave } = useMyStream();
  const [state, setState] = useState<QuickDmState>(() => readStoredState());
  const launcherButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const restoreFocusElementRef = useRef<HTMLElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);

  const waves = directMessages.list;
  const isVisible = Boolean(isDesktop && connectedProfile?.handle && showWaves);
  const selectedWave = useMemo(
    () => waves.find((wave) => wave.id === state.waveId) ?? null,
    [state.waveId, waves]
  );
  const shouldShowChat =
    state.view === "chat" &&
    state.waveId !== null &&
    (directMessages.isFetching || selectedWave !== null);
  const totalUnreadCount = useMemo(
    () => waves.reduce((count, wave) => count + getUnreadCount(wave), 0),
    [waves]
  );
  const hasUnread = totalUnreadCount > 0;
  const displayUnreadCount =
    totalUnreadCount > 99 ? "99+" : `${totalUnreadCount}`;
  const hasUnreadOutsideCurrentChat = useMemo(
    () =>
      state.view === "chat" &&
      state.waveId !== null &&
      waves.some(
        (wave) => wave.id !== state.waveId && getUnreadCount(wave) > 0
      ),
    [state.view, state.waveId, waves]
  );

  const setAndStoreState = useCallback((nextState: QuickDmState) => {
    setState(nextState);
    storeState(nextState);
  }, []);

  const openList = useCallback(() => {
    if (state.view === "closed") {
      restoreFocusElementRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : launcherButtonRef.current;
    }
    setAndStoreState(LIST_STATE);
  }, [setAndStoreState, state.view]);

  const close = useCallback(() => {
    shouldRestoreFocusRef.current = true;
    setAndStoreState(CLOSED_STATE);
  }, [setAndStoreState]);

  const openChat = useCallback(
    (waveId: string) => {
      registerWave(waveId, true);
      setAndStoreState({ view: "chat", waveId });
    },
    [registerWave, setAndStoreState]
  );

  const openAll = useCallback(() => {
    shouldRestoreFocusRef.current = false;
    setAndStoreState(CLOSED_STATE);
  }, [setAndStoreState]);

  useEffect(() => {
    if (!isVisible || typeof globalThis.window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== QUICK_DM_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as unknown;
        if (isQuickDmState(parsed)) {
          setState(parsed);
        }
      } catch {
        setState(CLOSED_STATE);
      }
    };

    globalThis.window.addEventListener("storage", handleStorage);
    return () =>
      globalThis.window.removeEventListener("storage", handleStorage);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || state.view === "closed") {
      return;
    }

    const frame = globalThis.window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) {
        return;
      }

      if (panel.contains(document.activeElement)) {
        return;
      }

      const focusTarget =
        panel.querySelector<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        ) ?? panel;
      focusTarget.focus();
    });

    return () => globalThis.window.cancelAnimationFrame(frame);
  }, [isVisible, state.view, state.waveId]);

  useEffect(() => {
    if (
      !isVisible ||
      state.view !== "closed" ||
      !shouldRestoreFocusRef.current
    ) {
      return;
    }

    shouldRestoreFocusRef.current = false;
    const focusTarget =
      restoreFocusElementRef.current?.isConnected === true
        ? restoreFocusElementRef.current
        : launcherButtonRef.current;
    focusTarget?.focus();
  }, [isVisible, state.view]);

  if (!isVisible) {
    return null;
  }

  if (state.view === "closed") {
    return (
      <div className={QUICK_DM_POSITION_CLASS}>
        <button
          ref={launcherButtonRef}
          type="button"
          onClick={openList}
          aria-label={
            hasUnread
              ? t(locale, "quickDm.openButtonUnreadAriaLabel", {
                  count: displayUnreadCount,
                })
              : t(locale, "quickDm.openButtonAriaLabel")
          }
          title={t(locale, "quickDm.openButtonTitle")}
          className="tw-relative tw-flex tw-size-14 tw-appearance-none tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-900 tw-p-0 tw-text-iron-100 tw-shadow-2xl tw-ring-1 tw-ring-white/15 tw-transition hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          <ChatBubbleLeftRightIcon className="tw-size-6" aria-hidden="true" />
          {hasUnread && (
            <span className="tw-absolute tw-right-[-2px] tw-top-[-2px] tw-flex tw-h-5 tw-min-w-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-red tw-px-1.5 tw-text-[11px] tw-font-semibold tw-text-white tw-ring-2 tw-ring-black">
              {displayUnreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <aside
      ref={panelRef}
      role="dialog"
      tabIndex={-1}
      className={QUICK_DM_POSITION_CLASS}
      aria-label={t(locale, "quickDm.regionAriaLabel")}
      onKeyDown={(event) => {
        if (event.key !== "Escape") {
          return;
        }

        event.stopPropagation();
        close();
      }}
    >
      {shouldShowChat && state.waveId ? (
        <Suspense fallback={<QuickDmLoadingRows locale={locale} />}>
          <QuickDmChat
            waveId={state.waveId}
            hasUnreadOutsideCurrentChat={hasUnreadOutsideCurrentChat}
            listWave={selectedWave}
            locale={locale}
            onBack={openList}
            onClose={close}
            onOpenAll={openAll}
          />
        </Suspense>
      ) : (
        <QuickDmListPanel
          waves={waves}
          isFetching={directMessages.isFetching}
          locale={locale}
          onClose={close}
          onOpenAll={openAll}
          onOpenChat={openChat}
          onRegisterWave={registerWave}
        />
      )}
    </aside>
  );
}
