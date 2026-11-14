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

const fetchLatestNotification = async (
  account: ConnectedWalletAccount
): Promise<{ unread: number; notification: ApiNotification | null }> => {
  if (!account.jwt) return { unread: 0, notification: null };
  const response = await commonApiFetch<ApiNotificationsResponse>({
    endpoint: "notifications",
    params: { limit: "1" },
    headers: { Authorization: `Bearer ${account.jwt}` },
  });
  return {
    unread: toUnreadCount(response.unread_count),
    notification: response.notifications[0] ?? null,
  };
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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
  const latest = useRef({ address, connectedAccounts, connectedProfile });
  const shownKeys = useRef(new Set<string>());
  const polling = useRef(false);

  useEffect(() => {
    latest.current = { address, connectedAccounts, connectedProfile };
  }, [address, connectedAccounts, connectedProfile]);

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
        accounts.find(
          (account) =>
            targetProfileHandle !== null &&
            account.profileHandle?.toLowerCase() ===
              targetProfileHandle.toLowerCase()
        );
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
      const deadline = Date.now() + PROFILE_SWITCH_TIMEOUT_MS;
      while (Date.now() < deadline) {
        if (isActive()) return true;
        await sleep(PROFILE_SWITCH_POLL_MS);
      }
      return isActive();
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
          const current = `${window.location.pathname}${window.location.search}`;
          if (current === target.path) {
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
        { findNativeEmoji, findCustomEmoji },
        locale,
        profileHandle
      );
      if (!content) return;
      // With several profiles signed in, say which one the notification is for.
      const prefix =
        latest.current.connectedAccounts.length > 1 && profileHandle
          ? `[${profileHandle}] `
          : "";
      const icon =
        content.iconUrl ?? notification.related_identity?.pfp ?? null;
      notifications.showNotification(
        notification.id,
        icon ? resolveIpfsUrlSync(icon) : "",
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
    [findCustomEmoji, findNativeEmoji, locale]
  );

  const poll = useCallback(async () => {
    if (!getDesktopNotifications() || polling.current) return;
    polling.current = true;
    try {
      const accounts = getConnectedWalletAccounts();
      const results = await Promise.allSettled(
        accounts.map(fetchLatestNotification)
      );
      results.forEach((result, index) => {
        const account = accounts[index];
        if (!account || result.status !== "fulfilled") return;
        const { unread, notification } = result.value;
        if (!notification || unread === 0) return;
        const key = `${account.address.toLowerCase()}:${notification.id}`;
        if (shownKeys.current.has(key)) return;
        shownKeys.current.add(key);
        showNotification(account, notification);
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
