"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { useEmoji } from "@/contexts/EmojiContext";
import type { ApiNotification } from "@/generated/models/ApiNotification";
import type { ApiNotificationsResponse } from "@/generated/models/ApiNotificationsResponse";
import { buildDesktopNotification } from "@/helpers/desktop-notification-text";
import {
  getDesktopNotifications,
  getDesktopShellApi,
} from "@/helpers/desktop-shell";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { commonApiFetch } from "@/services/api/common-api";
import {
  getConnectedWalletAccounts,
  type ConnectedWalletAccount,
} from "@/services/auth/auth.utils";

const POLL_INTERVAL_MS = 15_000;
// Newest notifications fetched per profile and poll; several that arrive
// between two polls are each shown, oldest first.
const POLL_LIMIT = 5;
// Pages fetched per profile and poll, all ranges together. What a poll
// cannot reach is kept as a gap and fetched by the next polls: nothing is
// skipped.
const MAX_POLL_PAGES = 10;
// Each profile's requests in one poll must finish by then, so one stalled
// profile never stops polling for the others.
const POLL_REQUEST_TIMEOUT_MS = 10_000;
const PROFILE_SWITCH_TIMEOUT_MS = 3_000;
const PROFILE_SWITCH_POLL_MS = 50;

interface NotificationTarget {
  readonly path: string;
  readonly targetAddress: string | null;
  readonly targetProfileId: string | null;
  readonly targetProfileHandle: string | null;
}

const toUnreadCount = (count: number | null | undefined): number =>
  typeof count === "number" && Number.isFinite(count) && count > 0
    ? Math.floor(count)
    : 0;

const toTrimmed = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const parseNotificationTarget = (value: unknown): NotificationTarget | null => {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const path = toTrimmed(record["path"]);
  // The shell sanitises the path too; only same-origin paths are followed.
  if (!path?.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return null;
  }
  return {
    path,
    targetAddress: toTrimmed(record["targetAddress"]),
    targetProfileId: toTrimmed(record["targetProfileId"]),
    targetProfileHandle: toTrimmed(record["targetProfileHandle"]),
  };
};

const fetchNotificationPage = (
  jwt: string,
  signal: AbortSignal,
  idLessThan?: number
): Promise<ApiNotificationsResponse> =>
  commonApiFetch<ApiNotificationsResponse>({
    endpoint: "notifications",
    params:
      idLessThan === undefined
        ? { limit: String(POLL_LIMIT) }
        : { limit: String(POLL_LIMIT), id_less_than: String(idLessThan) },
    headers: { Authorization: `Bearer ${jwt}` },
    signal,
  });

/** Unseen notifications between two seen ones: ids below `before`, above `after`. */
interface NotificationGap {
  readonly before: number;
  readonly after: number;
}

/** Per profile: the newest notification seen, and the gaps still to fetch. */
interface NotificationCursor {
  readonly lastSeenId: number | undefined;
  readonly gaps: readonly NotificationGap[];
}

interface FetchedRange {
  readonly notifications: readonly ApiNotification[];
  /** Where to continue when the page budget ran out first; else null. */
  readonly resumeBefore: number | null;
  /** Pages fetched for this range. */
  readonly pagesUsed: number;
}

const isUnread = (notification: ApiNotification): boolean =>
  notification.read_at === null;

/**
 * Given a fetched page (newest first), fetch older pages until one reaches
 * `after` or `pagesLeft` more pages have been fetched.
 */
const continueRange = async (
  jwt: string,
  signal: AbortSignal,
  page: readonly ApiNotification[],
  after: number,
  pagesLeft: number
): Promise<FetchedRange> => {
  const done = { notifications: page, resumeBefore: null, pagesUsed: 0 };
  if (page.length < POLL_LIMIT) return done;
  const oldest = Math.min(...page.map((notification) => notification.id));
  if (oldest <= after) return done;
  if (pagesLeft === 0) return { ...done, resumeBefore: oldest };
  const next = (await fetchNotificationPage(jwt, signal, oldest)).notifications;
  const rest = await continueRange(jwt, signal, next, after, pagesLeft - 1);
  return {
    notifications: [...page, ...rest.notifications],
    resumeBefore: rest.resumeBefore,
    pagesUsed: rest.pagesUsed + 1,
  };
};

interface ProfilePoll {
  /** Notifications to show, oldest first. */
  readonly show: readonly ApiNotification[];
  readonly cursor: NotificationCursor;
}

/** Unread notifications with ids above `after` and below `before`. */
const unreadBetween = (
  notifications: readonly ApiNotification[],
  after: number,
  before = Number.POSITIVE_INFINITY
): ApiNotification[] =>
  notifications.filter(
    (notification) =>
      notification.id > after &&
      notification.id < before &&
      isUnread(notification)
  );

/**
 * The oldest open gap, within `pagesLeft` pages: what it holds, what is
 * still open after this poll, and the pages it used.
 */
const fetchGap = async (
  jwt: string,
  signal: AbortSignal,
  gap: NotificationGap,
  pagesLeft: number
): Promise<{
  readonly found: readonly ApiNotification[];
  readonly rest: NotificationGap | null;
  readonly pagesUsed: number;
}> => {
  if (pagesLeft === 0) return { found: [], rest: gap, pagesUsed: 0 };
  const first = (await fetchNotificationPage(jwt, signal, gap.before))
    .notifications;
  const range = await continueRange(
    jwt,
    signal,
    first,
    gap.after,
    pagesLeft - 1
  );
  return {
    found: unreadBetween(range.notifications, gap.after, gap.before),
    rest:
      range.resumeBefore === null
        ? null
        : { before: range.resumeBefore, after: gap.after },
    pagesUsed: range.pagesUsed + 1,
  };
};

/** The first poll shows only the newest unread notification, as the desktop app always has. */
const firstProfilePoll = (
  notifications: readonly ApiNotification[]
): ProfilePoll => {
  const newest = notifications
    .filter(isUnread)
    .sort((left, right) => right.id - left.id)[0];
  return {
    show: newest ? [newest] : [],
    cursor: { lastSeenId: newest?.id, gaps: [] },
  };
};

/**
 * One profile's poll, within one budget of MAX_POLL_PAGES pages. After the
 * first page, it continues the oldest open gap, then fetches newest first
 * back to the last seen notification with the pages left; a range the
 * budget could not finish becomes a gap for the next poll, so a burst of any
 * size is shown in full, a bounded number of pages at a time.
 */
const pollProfile = async (
  account: ConnectedWalletAccount,
  cursor: NotificationCursor | undefined,
  signal: AbortSignal
): Promise<ProfilePoll | null> => {
  const { jwt } = account;
  if (!jwt) return null;
  const first = await fetchNotificationPage(jwt, signal);
  const lastSeenId = cursor?.lastSeenId;
  if (toUnreadCount(first.unread_count) === 0) {
    return { show: [], cursor: { lastSeenId, gaps: [] } };
  }
  if (lastSeenId === undefined) return firstProfilePoll(first.notifications);

  // The first page is already spent.
  const budget = MAX_POLL_PAGES - 1;
  const [gap, ...laterGaps] = cursor?.gaps ?? [];
  const older = gap
    ? await fetchGap(jwt, signal, gap, budget)
    : { found: [], rest: null, pagesUsed: 0 };
  const top = await continueRange(
    jwt,
    signal,
    first.notifications,
    lastSeenId,
    budget - older.pagesUsed
  );
  const shown = new Map(
    [...older.found, ...unreadBetween(top.notifications, lastSeenId)].map(
      (notification) => [notification.id, notification] as const
    )
  );
  const gaps: NotificationGap[] = [
    ...(older.rest === null ? [] : [older.rest]),
    ...laterGaps,
    ...(top.resumeBefore === null
      ? []
      : [{ before: top.resumeBefore, after: lastSeenId }]),
  ];
  return {
    show: [...shown.values()].sort((left, right) => left.id - right.id),
    cursor: {
      lastSeenId: Math.max(
        lastSeenId,
        ...top.notifications.map((notification) => notification.id)
      ),
      gaps,
    },
  };
};

/**
 * Runs `request` with its own abort signal, aborted when `poll` is (the
 * bridge unmounted) or at the deadline. Rejects at the deadline even if the
 * request ignores the signal.
 */
const withDeadline = <T,>(
  request: (signal: AbortSignal) => Promise<T>,
  poll: AbortSignal
): Promise<T> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  poll.addEventListener("abort", abort);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      abort();
      reject(new Error("Desktop notification poll timed out"));
    }, POLL_REQUEST_TIMEOUT_MS);
  });
  return Promise.race([request(controller.signal), deadline]).finally(() => {
    clearTimeout(timer);
    poll.removeEventListener("abort", abort);
  });
};

const toNotificationIcon = (url: string | null | undefined): string => {
  if (!url) return "";
  try {
    const resolved = new URL(resolveIpfsUrlSync(url));
    return resolved.protocol === "https:" || resolved.protocol === "http:"
      ? resolved.href
      : "";
  } catch {
    return "";
  }
};

/** Resolves true once `isDone` holds, or false at the deadline. */
const waitUntil = (isDone: () => boolean, deadline: number): Promise<boolean> =>
  new Promise((resolve) => {
    const check = () => {
      if (isDone()) {
        resolve(true);
      } else if (Date.now() >= deadline) {
        resolve(false);
      } else {
        setTimeout(check, PROFILE_SWITCH_POLL_MS);
      }
    };
    check();
  });

const isCurrentLocation = (path: string): boolean => {
  const target = new URL(path, window.location.origin);
  return (
    target.pathname === window.location.pathname &&
    target.search === window.location.search
  );
};

/**
 * Inside 6529 Desktop: raises a system notification for each new
 * notification of every signed-in profile, keeps the dock or taskbar badge at
 * the total unread count, and opens the right profile and page when a
 * notification is clicked. Renders nothing and does nothing on the web.
 */
export default function DesktopNotificationsBridge() {
  const router = useRouter();
  const locale = useBrowserLocale();
  const { connectedProfile } = useAuth();
  const { findCustomEmoji, findNativeEmoji, loadEmojiData } = useEmoji();
  const {
    address,
    connectedAccounts,
    connectedAccountUnreadNotifications,
    seizeSwitchConnectedAccount,
  } = useSeizeConnectContext();
  const latest = useRef({
    address,
    connectedAccounts,
    connectedProfile,
    locale,
    emoji: { findNativeEmoji, findCustomEmoji },
  });
  const cursors = useRef(new Map<string, NotificationCursor>());
  // The running poll; aborted on unmount so its results are discarded.
  const pollController = useRef<AbortController | null>(null);
  // The latest notification click; an earlier one still switching profiles
  // must not navigate over it.
  const navigationRequest = useRef(0);

  useEffect(() => {
    latest.current = {
      address,
      connectedAccounts,
      connectedProfile,
      locale,
      emoji: { findNativeEmoji, findCustomEmoji },
    };
  }, [
    address,
    connectedAccounts,
    connectedProfile,
    locale,
    findNativeEmoji,
    findCustomEmoji,
  ]);

  const badgeCount = useMemo(
    () =>
      Object.values(connectedAccountUnreadNotifications).reduce(
        (total, count) => total + toUnreadCount(count),
        0
      ),
    [connectedAccountUnreadNotifications]
  );

  useEffect(() => {
    if (getDesktopNotifications()) loadEmojiData().catch(() => undefined);
  }, [loadEmojiData]);

  useEffect(() => {
    getDesktopNotifications()?.setBadge(badgeCount);
  }, [badgeCount]);

  const switchToTargetProfile = useCallback(
    async (target: NotificationTarget): Promise<boolean> => {
      const { targetAddress, targetProfileId, targetProfileHandle } = target;
      if (!targetAddress && !targetProfileId && !targetProfileHandle) {
        return true;
      }
      const accounts = latest.current.connectedAccounts;
      // A handle is used only when it identifies exactly one profile.
      const byHandle = accounts.filter(
        (account) =>
          targetProfileHandle !== null &&
          account.profileHandle?.toLowerCase() ===
            targetProfileHandle.toLowerCase()
      );
      const match =
        accounts.find(
          (account) =>
            targetAddress !== null &&
            account.address.toLowerCase() === targetAddress.toLowerCase()
        ) ??
        accounts.find(
          (account) =>
            targetProfileId !== null && account.profileId === targetProfileId
        ) ??
        (byHandle.length === 1 ? byHandle[0] : undefined);
      if (!match) return false;

      const isActive = () =>
        latest.current.address?.toLowerCase() === match.address.toLowerCase() &&
        (!targetProfileId ||
          latest.current.connectedProfile?.id === targetProfileId);
      if (isActive()) return true;
      if (
        latest.current.address?.toLowerCase() !== match.address.toLowerCase()
      ) {
        try {
          seizeSwitchConnectedAccount(match.address);
        } catch {
          return false;
        }
      }
      return await waitUntil(isActive, Date.now() + PROFILE_SWITCH_TIMEOUT_MS);
    },
    [seizeSwitchConnectedAccount]
  );

  useEffect(
    () => () => {
      // Unmounted: a click still switching profiles must not navigate.
      navigationRequest.current += 1;
    },
    []
  );

  useEffect(() => {
    const api = getDesktopShellApi();
    if (!api) return undefined;
    const onNotificationNavigate = (_event: unknown, value: unknown) => {
      const target = parseNotificationTarget(value);
      if (!target) return;
      navigationRequest.current += 1;
      const request = navigationRequest.current;
      switchToTargetProfile(target)
        .then((switched) => {
          if (!switched || request !== navigationRequest.current) {
            return undefined;
          }
          if (isCurrentLocation(target.path)) {
            const url = new URL(target.path, window.location.origin);
            url.searchParams.set("reload", "true");
            router.replace(`${url.pathname}${url.search}`, { scroll: false });
          } else {
            router.push(target.path);
          }
          return undefined;
        })
        .catch(() => undefined);
    };
    api.onNotificationNavigate(onNotificationNavigate);
    return () => {
      api.offNotificationNavigate(onNotificationNavigate);
    };
  }, [router, switchToTargetProfile]);

  const showNotification = useCallback(
    (account: ConnectedWalletAccount, notification: ApiNotification) => {
      const notifications = getDesktopNotifications();
      if (!notifications) return;
      const connected = latest.current.connectedAccounts.find(
        (item) => item.address.toLowerCase() === account.address.toLowerCase()
      );
      const profileHandle =
        connected?.profileHandle ?? account.profileHandle ?? null;
      const profileId = connected?.profileId ?? account.profileId ?? null;
      const content = buildDesktopNotification(
        notification,
        latest.current.emoji,
        latest.current.locale,
        profileHandle
      );
      if (!content) return;
      // With several profiles signed in, say which one the notification is for.
      const prefix =
        latest.current.connectedAccounts.length > 1 && profileHandle
          ? `[${profileHandle}] `
          : "";
      notifications.showNotification(
        notification.id,
        toNotificationIcon(
          content.iconUrl ?? notification.related_identity?.pfp
        ),
        `${prefix}${content.title}`,
        content.body,
        content.redirectPath,
        {
          targetAddress: account.address,
          targetProfileId: profileId,
          targetProfileHandle: profileHandle,
        }
      );
    },
    []
  );

  const poll = useCallback(async () => {
    const running = pollController.current;
    // One poll at a time; an aborted one no longer counts.
    if (!getDesktopNotifications() || (running && !running.signal.aborted)) {
      return;
    }
    const controller = new AbortController();
    pollController.current = controller;
    try {
      const accounts = getConnectedWalletAccounts();
      const results = await Promise.allSettled(
        accounts.map((account) =>
          withDeadline(
            (signal) =>
              pollProfile(
                account,
                cursors.current.get(account.address.toLowerCase()),
                signal
              ),
            controller.signal
          )
        )
      );
      // Unmounted meanwhile: show nothing.
      if (controller.signal.aborted) return;
      // Only profiles still signed in (one may have signed out meanwhile).
      const signedIn = new Set(
        getConnectedWalletAccounts().map((item) => item.address.toLowerCase())
      );
      results.forEach((result, index) => {
        const account = accounts[index];
        // A failed or timed-out profile does not hold up the others.
        if (!account || result.status !== "fulfilled") return;
        const key = account.address.toLowerCase();
        if (!signedIn.has(key) || !result.value) return;
        for (const notification of result.value.show) {
          showNotification(account, notification);
        }
        cursors.current.set(key, result.value.cursor);
      });
    } finally {
      if (pollController.current === controller) pollController.current = null;
    }
  }, [showNotification]);

  useEffect(() => {
    if (!getDesktopNotifications()) return undefined;
    poll().catch(() => undefined);
    const interval = setInterval(() => {
      poll().catch(() => undefined);
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      pollController.current?.abort();
    };
  }, [poll]);

  return null;
}
