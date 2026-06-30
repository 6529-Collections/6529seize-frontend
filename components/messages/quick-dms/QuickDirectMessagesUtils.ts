"use client";

import type WavePicture from "@/components/waves/WavePicture";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import type { ApiWave } from "@/generated/models/ApiWave";
import { formatAddress, isValidEthAddress } from "@/helpers/Helpers";
import { formatDate, formatInteger, formatRelativeTime } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type React from "react";

export type QuickDmView = "closed" | "list" | "chat";
export type WavePictureContributors = React.ComponentProps<
  typeof WavePicture
>["contributors"];

export interface QuickDmState {
  readonly view: QuickDmView;
  readonly waveId: string | null;
}

export interface QuickDmAvatarSource {
  readonly name: string;
  readonly picture: string | null;
  readonly contributors: WavePictureContributors;
}

export const QUICK_DM_STORAGE_KEY = "6529.quickDirectMessages.state";
export const CLOSED_STATE: QuickDmState = { view: "closed", waveId: null };
export const LIST_STATE: QuickDmState = { view: "list", waveId: null };

const getBrowserWindow = (): Window | undefined => {
  const browserWindow = globalThis.window as unknown;
  return browserWindow === undefined ? undefined : (browserWindow as Window);
};

const QUICK_DM_RELATIVE_TIME_OPTIONS = {
  numeric: "auto",
  style: "short",
} satisfies Intl.RelativeTimeFormatOptions;
const QUICK_DM_RELATIVE_TIME_ALWAYS_OPTIONS = {
  numeric: "always",
  style: "short",
} satisfies Intl.RelativeTimeFormatOptions;

export const isQuickDmState = (value: unknown): value is QuickDmState => {
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

export const readStoredState = (): QuickDmState => {
  const browserWindow = getBrowserWindow();
  if (browserWindow === undefined) {
    return CLOSED_STATE;
  }

  try {
    const raw = browserWindow.localStorage.getItem(QUICK_DM_STORAGE_KEY);
    if (!raw) {
      return CLOSED_STATE;
    }

    const parsed = JSON.parse(raw) as unknown;
    return isQuickDmState(parsed) ? parsed : CLOSED_STATE;
  } catch {
    return CLOSED_STATE;
  }
};

export const storeState = (state: QuickDmState) => {
  const browserWindow = getBrowserWindow();
  if (browserWindow === undefined) {
    return;
  }

  try {
    browserWindow.localStorage.setItem(
      QUICK_DM_STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch {
    // Ignore storage failures; in-memory state still works.
  }
};

export const getUnreadCount = (wave: MinimalWave): number =>
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
    return formatRelativeTime(
      locale,
      -1,
      "day",
      QUICK_DM_RELATIVE_TIME_OPTIONS
    );
  }

  if (hours > 0) {
    return formatRelativeTime(
      locale,
      -hours,
      "hour",
      QUICK_DM_RELATIVE_TIME_ALWAYS_OPTIONS
    );
  }

  if (minutes > 0) {
    return formatRelativeTime(
      locale,
      -minutes,
      "minute",
      QUICK_DM_RELATIVE_TIME_ALWAYS_OPTIONS
    );
  }

  return formatRelativeTime(
    locale,
    0,
    "second",
    QUICK_DM_RELATIVE_TIME_OPTIONS
  );
};

export const getQuickDmScoreLabel = (
  wave: MinimalWave,
  locale: SupportedLocale
): string | null => {
  const score = wave.waveScore?.visibility_score;
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }

  return formatInteger(locale, Math.round(score));
};

export const getQuickDmConversationAriaLabel = ({
  locale,
  scoreLabel,
  timeLabel,
  title,
  unreadCount,
}: {
  readonly locale: SupportedLocale;
  readonly scoreLabel: string | null;
  readonly timeLabel: string;
  readonly title: string;
  readonly unreadCount: number;
}): string => {
  const metadata = [
    timeLabel,
    scoreLabel === null
      ? null
      : t(locale, "waves.score.summary.scoreAria", {
          visibilityScore: scoreLabel,
        }),
    unreadCount <= 0
      ? null
      : t(locale, "quickDm.unreadCountAriaLabel", {
          count: formatInteger(locale, unreadCount),
        }),
  ].filter((value): value is string => value !== null);

  return [
    t(locale, "quickDm.openConversationAriaLabel", { name: title }),
    ...metadata,
  ].join(". ");
};

export const getQuickDmConversationTimeLabel = (
  wave: MinimalWave,
  locale: SupportedLocale
): string => {
  const latestMessageTimestamp = getQuickDmLatestMessageTimestamp(wave);
  return latestMessageTimestamp === null
    ? t(locale, "quickDm.noMessagesYet")
    : getQuickDmTimeLabel({ locale, timestamp: latestMessageTimestamp });
};

export const getFormattedWaveName = (
  wave: Pick<MinimalWave, "name">
): string => {
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

export const getQuickDmAvatarSource = (
  displayName: string,
  listWave: MinimalWave | null,
  wave: ApiWave | undefined
): QuickDmAvatarSource | null => {
  if (!listWave && !wave) {
    return null;
  }

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
};
