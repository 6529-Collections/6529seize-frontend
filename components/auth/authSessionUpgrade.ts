import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getAuthJwt,
  getWalletAddress,
  hasActiveSessionV2Auth,
} from "@/services/auth/auth.utils";
import { getSessionClientType } from "@/services/auth/session-v2.utils";
import type {
  AuthRolloutSettings,
  SessionUpgradePromptMode,
  SessionUpgradePromptStatus,
  SessionUpgradeReminderState,
} from "./authTypes";

const SESSION_UPGRADE_REMINDER_STORAGE_KEY =
  "6529-session-v2-upgrade-reminders";
export const AUTH_MODAL_LOCALE = DEFAULT_LOCALE;
export const AUTH_TOKEN_CHANGED_EVENT_NAME = "6529-auth-token-changed";
const SESSION_UPGRADE_REMINDER_MS = 2 * 60 * 60 * 1000;

export const DEFAULT_AUTH_ROLLOUT_SETTINGS: AuthRolloutSettings = {
  structuredSignaturesRequired: false,
  sessionV2MigrationDeadline: null,
};

export const normalizeSessionV2MigrationDeadline = (
  deadline: Date | string | null | undefined
): string | null => {
  if (deadline instanceof Date) {
    return Number.isFinite(deadline.getTime()) ? deadline.toISOString() : null;
  }

  return deadline ?? null;
};

const normalizeReminderAddress = (address: string): string =>
  address.toLowerCase();

const parseSessionUpgradeReminders = (): Record<
  string,
  SessionUpgradeReminderState
> => {
  const raw = safeLocalStorage.getItem(SESSION_UPGRADE_REMINDER_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const reminders: Record<string, SessionUpgradeReminderState> = {};
    for (const [address, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") {
        continue;
      }

      const record = value as Partial<SessionUpgradeReminderState>;
      if (
        typeof record.dismissedUntil === "number" &&
        Number.isFinite(record.dismissedUntil)
      ) {
        reminders[address] = {
          dismissedUntil: record.dismissedUntil,
        };
      }
    }
    return reminders;
  } catch {
    return {};
  }
};

const writeSessionUpgradeReminders = (
  reminders: Readonly<Record<string, SessionUpgradeReminderState>>
): void => {
  safeLocalStorage.setItem(
    SESSION_UPGRADE_REMINDER_STORAGE_KEY,
    JSON.stringify(reminders)
  );
};

const getSessionUpgradeReminder = (
  address: string
): SessionUpgradeReminderState | null => {
  const reminders = parseSessionUpgradeReminders();
  return reminders[normalizeReminderAddress(address)] ?? null;
};

export const hasSessionUpgradeRollout = (
  settings: AuthRolloutSettings
): boolean => {
  return (
    settings.structuredSignaturesRequired ||
    !!settings.sessionV2MigrationDeadline?.trim()
  );
};

const getSessionUpgradeGlobalDeadline = (
  settings: AuthRolloutSettings
): number | null => {
  const configuredDeadline = settings.sessionV2MigrationDeadline;
  if (!configuredDeadline) {
    return null;
  }

  const timestamp = Date.parse(configuredDeadline);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const getSessionUpgradeEffectiveDeadline = (
  settings: AuthRolloutSettings,
  now: number = Date.now()
): number | null => {
  if (settings.structuredSignaturesRequired) {
    return now;
  }

  return getSessionUpgradeGlobalDeadline(settings);
};

export const getManualSessionUpgradePromptStatus =
  (): SessionUpgradePromptStatus => ({
    shouldShow: true,
    canDismiss: true,
    timeLeftMs: 0,
  });

export const getStoredLegacySessionUpgradeAddress = (): string | null => {
  const walletAddress = getWalletAddress();
  if (!walletAddress || !getAuthJwt()) {
    return null;
  }

  return hasActiveSessionV2Auth({ address: walletAddress })
    ? null
    : walletAddress;
};

const setSessionUpgradeReminder = (
  address: string,
  state: SessionUpgradeReminderState
): void => {
  writeSessionUpgradeReminders({
    ...parseSessionUpgradeReminders(),
    [normalizeReminderAddress(address)]: state,
  });
};

export const clearSessionUpgradeReminder = (address: string): void => {
  const reminders = parseSessionUpgradeReminders();
  delete reminders[normalizeReminderAddress(address)];
  writeSessionUpgradeReminders(reminders);
};

export const getOrCreateSessionUpgradePromptStatus = (
  address: string,
  settings: AuthRolloutSettings,
  now: number = Date.now()
): SessionUpgradePromptStatus => {
  const existingReminder = getSessionUpgradeReminder(address);
  const reminder = existingReminder ?? {
    dismissedUntil: 0,
  };

  if (!existingReminder) {
    setSessionUpgradeReminder(address, reminder);
  }

  const deadline = getSessionUpgradeEffectiveDeadline(settings, now);
  const timeLeftMs = deadline === null ? 0 : Math.max(0, deadline - now);
  const canDismiss = timeLeftMs > 0;

  return {
    shouldShow: !canDismiss || now >= reminder.dismissedUntil,
    canDismiss,
    timeLeftMs,
  };
};

export const dismissSessionUpgradePrompt = (
  address: string,
  settings: AuthRolloutSettings,
  now: number = Date.now()
): SessionUpgradePromptStatus => {
  const deadline = getSessionUpgradeEffectiveDeadline(settings, now);
  const timeLeftMs = deadline === null ? 0 : Math.max(0, deadline - now);
  const canDismiss = timeLeftMs > 0;
  const dismissedUntil = canDismiss
    ? Math.min(now + SESSION_UPGRADE_REMINDER_MS, deadline ?? now)
    : now;
  const nextReminder = {
    dismissedUntil,
  };

  setSessionUpgradeReminder(address, nextReminder);

  return {
    shouldShow: now >= dismissedUntil,
    canDismiss,
    timeLeftMs,
  };
};

export const formatSessionUpgradeTimeLeft = (timeLeftMs: number): string => {
  if (timeLeftMs <= 0) {
    return t(AUTH_MODAL_LOCALE, "auth.signModal.timeLeft.now");
  }

  const oneHourMs = 60 * 60 * 1000;
  const oneDayMs = 24 * oneHourMs;
  const wholeDays = Math.floor(timeLeftMs / oneDayMs);

  if (wholeDays > 3) {
    return t(
      AUTH_MODAL_LOCALE,
      wholeDays === 1
        ? "auth.signModal.timeLeft.days.one"
        : "auth.signModal.timeLeft.days.many",
      { count: formatInteger(AUTH_MODAL_LOCALE, wholeDays) }
    );
  }

  const wholeHours = Math.floor(timeLeftMs / oneHourMs);
  if (wholeHours < 1) {
    return t(AUTH_MODAL_LOCALE, "auth.signModal.timeLeft.lessThanOneHour");
  }

  return t(
    AUTH_MODAL_LOCALE,
    wholeHours === 1
      ? "auth.signModal.timeLeft.hours.one"
      : "auth.signModal.timeLeft.hours.many",
    { count: formatInteger(AUTH_MODAL_LOCALE, wholeHours) }
  );
};

export const getSessionUpgradePromptMode = (
  canSignActiveWallet: boolean
): SessionUpgradePromptMode => {
  if (canSignActiveWallet || getSessionClientType() === "web") {
    return "sign";
  }
  return "reshare";
};
