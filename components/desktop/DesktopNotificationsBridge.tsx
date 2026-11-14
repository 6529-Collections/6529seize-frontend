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

const fetchUnreadNotifications = async (
  account: ConnectedWalletAccount
): Promise<readonly ApiNotification[]> => {
  if (!account.jwt) return [];
  const response = await commonApiFetch<ApiNotificationsResponse>({
    endpoint: "notifications",
    params: { limit: String(POLL_LIMIT) },
    headers: { Authorization: `Bearer ${account.jwt}` },
  });
  if (toUnreadCount(response.unread_count) === 0) return [];
  return response.notifications.filter(
    (notification) => notification.read_at === null
  );
};

/**
 * Which unread notifications to show for one profile, oldest first. The
 * first poll for a profile shows only its newest unread notification, as the
 * desktop app always has; later polls show every one newer than the newest
 * already seen. Only the newest seen id per profile is remembered.
 */
const selectNewNotifications = (
  unread: readonly ApiNotification[],
  lastSeenId: number | undefined
): ApiNotification[] => {
  const newestFirst = [...unread].sort((left, right) => right.id - left.id);
  if (lastSeenId === undefined) return newestFirst.slice(0, 1);
  return newestFirst
    .filter((notification) => notification.id > lastSeenId)
    .reverse();
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
  const lastSeenIds = useRef(new Map<string, number>());
  const polling = useRef(false);

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

  useEffect(() => {
    const api = getDesktopShellApi();
    if (!api) return undefined;
    const onNotificationNavigate = (_event: unknown, value: unknown) => {
      const target = parseNotificationTarget(value);
      if (!target) return;
      switchToTargetProfile(target)
        .then((switched) => {
          if (!switched) return undefined;
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
    if (!getDesktopNotifications() || polling.current) return;
    polling.current = true;
    try {
      const accounts = getConnectedWalletAccounts();
      const results = await Promise.allSettled(
        accounts.map(fetchUnreadNotifications)
      );
      results.forEach((result, index) => {
        const account = accounts[index];
        // A failed profile does not hold up the others.
        if (!account || result.status !== "fulfilled") return;
        const key = account.address.toLowerCase();
        const fresh = selectNewNotifications(
          result.value,
          lastSeenIds.current.get(key)
        );
        for (const notification of fresh) {
          showNotification(account, notification);
        }
        const newestId = fresh.at(-1)?.id;
        if (newestId !== undefined) lastSeenIds.current.set(key, newestId);
      });
    } finally {
      polling.current = false;
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
    };
  }, [poll]);

  return null;
}
