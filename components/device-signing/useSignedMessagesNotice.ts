"use client";

import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import {
  useAcknowledgeDeviceGrant,
  useDeviceGrants,
  useRevokeDeviceGrant,
} from "@/hooks/device-signing/useDeviceGrants";
import { useDeviceKeyLoss } from "@/hooks/device-signing/useDeviceKeyLoss";
import { useEnableSignedMessages } from "@/hooks/device-signing/useEnableSignedMessages";
import { useLocalDeviceKeys } from "@/hooks/device-signing/useLocalDeviceKeys";
import { useMinuteClock } from "@/hooks/device-signing/useMinuteClock";
import { useSignedMessagesAccount } from "@/hooks/device-signing/useSignedMessagesAccount";
import { getDeviceGrantStatus } from "@/lib/device-signing/device-key-store";
import { useCallback, useEffect, useMemo } from "react";
import {
  dismissSignedMessagesNotice,
  markDeviceGrantsSeen,
  rememberLocalDeviceGrants,
  useSignedMessagesNoticeState,
} from "./signedMessagesNoticeStorage";

export type SignedMessagesNoticeModel =
  | { readonly kind: "new-device"; readonly grant: ApiDeviceGrant }
  | { readonly kind: "enable" | "expired" | "restore" }
  | { readonly kind: "renew"; readonly expiresAt: number };

interface UnseenGrantInput {
  readonly grants: readonly ApiDeviceGrant[] | undefined;
  readonly seenGrantIds: readonly string[] | undefined;
  readonly localGrantIds: readonly string[] | undefined;
  readonly localPublicKeys: readonly string[];
  readonly nowMs: number;
}

/** An active grant this browser has not seen and that is not one of its keys. */
function findUnseenGrant({
  grants,
  seenGrantIds,
  localGrantIds,
  localPublicKeys,
  nowMs,
}: UnseenGrantInput): ApiDeviceGrant | null {
  if (!grants || !seenGrantIds) {
    return null;
  }
  const seen = new Set([...seenGrantIds, ...(localGrantIds ?? [])]);
  const own = new Set(localPublicKeys);
  return (
    grants.find(
      (grant) =>
        grant.revoked_at === null &&
        grant.expires_at > nowMs &&
        grant.notice_acknowledged !== true &&
        !seen.has(grant.id) &&
        !own.has(grant.device_key.toLowerCase())
    ) ?? null
  );
}

function getLocalNotice(
  grant: ApiDeviceGrant | null,
  nowMs: number,
  keysLost: boolean
): SignedMessagesNoticeModel | null {
  switch (getDeviceGrantStatus(grant, nowMs)) {
    case "none":
      // The browser dropped the key it held: say so instead of a first turn-on.
      return { kind: keysLost ? "restore" : "enable" };
    case "renewal":
      return grant ? { kind: "renew", expiresAt: grant.expires_at } : null;
    case "expired":
      return { kind: "expired" };
    case "active":
      return null;
  }
}

/**
 * Chooses the one signed-messages notice for the composer: a new-device
 * alert first, otherwise (only while the composer is empty and not dismissed)
 * turning on, renewing or an expired grant.
 */
export function useSignedMessagesNotice({
  composerEmpty,
}: {
  readonly composerEmpty: boolean;
}) {
  const address = useSignedMessagesAccount();
  const nowMs = useMinuteClock();
  const local = useLocalDeviceKeys(address);
  const keyLoss = useDeviceKeyLoss(address);
  const { data: grants } = useDeviceGrants(address);
  const { dismissedUntil, seenGrantIds, localGrantIds } =
    useSignedMessagesNoticeState(address);
  const { acknowledge: acknowledgeGrant, isAcknowledging } =
    useAcknowledgeDeviceGrant();
  const { revoke: revokeGrant, isRevoking } = useRevokeDeviceGrant();
  const { canEnable, enable, isEnabling, reconnect, status } =
    useEnableSignedMessages();
  const hasSeenBaseline = seenGrantIds !== undefined;

  // The first list this browser sees for a wallet is its baseline, so only
  // grants added afterwards raise the new-device alert.
  useEffect(() => {
    if (address && grants && !hasSeenBaseline) {
      markDeviceGrantsSeen(
        address,
        grants.map((grant) => grant.id)
      );
    }
  }, [address, grants, hasSeenBaseline]);

  useEffect(() => {
    if (!address || !local.loaded || local.failed || !local.publicKeys.length) {
      return;
    }
    // Record exact matches while IndexedDB still holds the key, including
    // the locally saved grant before it appears in the server list.
    const localKeys = new Set(local.publicKeys);
    const candidates = local.grant
      ? [local.grant, ...(grants ?? [])]
      : (grants ?? []);
    rememberLocalDeviceGrants(
      address,
      candidates
        .filter((grant) => localKeys.has(grant.device_key.toLowerCase()))
        .map((grant) => grant.id)
    );
  }, [address, grants, local]);

  const model = useMemo((): SignedMessagesNoticeModel | null => {
    // An unreadable key store says nothing about this browser's keys.
    if (!address || !local.loaded || local.failed || nowMs === 0) {
      return null;
    }
    const unseen = findUnseenGrant({
      grants,
      seenGrantIds,
      localGrantIds,
      localPublicKeys: local.publicKeys,
      nowMs,
    });
    if (unseen) {
      return { kind: "new-device", grant: unseen };
    }
    if (!composerEmpty || (dismissedUntil ?? 0) > nowMs) {
      return null;
    }
    // This browser held a key for the wallet that is now gone: its own grant
    // note says so, or it once matched a grant to a key it no longer holds.
    const keysLost =
      keyLoss !== null ||
      (local.publicKeys.length === 0 && (localGrantIds?.length ?? 0) > 0);
    return getLocalNotice(local.grant, nowMs, keysLost);
  }, [
    address,
    composerEmpty,
    dismissedUntil,
    grants,
    keyLoss,
    local,
    localGrantIds,
    nowMs,
    seenGrantIds,
  ]);

  const dismiss = useCallback(() => {
    if (address && model && model.kind !== "new-device") {
      dismissSignedMessagesNotice(address, Date.now());
    }
  }, [address, model]);

  const acknowledge = useCallback(
    async (grant: ApiDeviceGrant) => {
      if (address && (await acknowledgeGrant(grant.id))) {
        markDeviceGrantsSeen(address, [grant.id]);
      }
    },
    [address, acknowledgeGrant]
  );

  const revoke = useCallback(
    async (grant: ApiDeviceGrant) => {
      const revoked = await revokeGrant(grant);
      if (revoked && address) {
        markDeviceGrantsSeen(address, [grant.id]);
      }
    },
    [address, revokeGrant]
  );

  return {
    model,
    canEnable,
    enable,
    enableStatus: status,
    reconnect,
    isEnabling,
    dismiss,
    acknowledge,
    isAcknowledging,
    revoke,
    isRevoking,
  };
}
