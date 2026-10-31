"use client";

import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import {
  useDeviceGrants,
  useRevokeDeviceGrant,
} from "@/hooks/device-signing/useDeviceGrants";
import { useEnableSignedMessages } from "@/hooks/device-signing/useEnableSignedMessages";
import { useLocalDeviceKeys } from "@/hooks/device-signing/useLocalDeviceKeys";
import { useMinuteClock } from "@/hooks/device-signing/useMinuteClock";
import { useSignedMessagesAccount } from "@/hooks/device-signing/useSignedMessagesAccount";
import { getDeviceGrantStatus } from "@/lib/device-signing/device-key-store";
import { useCallback, useEffect, useMemo } from "react";
import {
  dismissSignedMessagesNotice,
  markDeviceGrantsSeen,
  useSignedMessagesNoticeState,
} from "./signedMessagesNoticeStorage";

export type SignedMessagesNoticeModel =
  | { readonly kind: "new-device"; readonly grant: ApiDeviceGrant }
  | { readonly kind: "enable" | "expired" }
  | { readonly kind: "renew"; readonly expiresAt: number };

interface UnseenGrantInput {
  readonly grants: readonly ApiDeviceGrant[] | undefined;
  readonly seenGrantIds: readonly string[] | undefined;
  readonly localPublicKeys: readonly string[] | null;
  readonly nowMs: number;
}

/** An active grant this browser has not seen and that is not one of its keys. */
function findUnseenGrant({
  grants,
  seenGrantIds,
  localPublicKeys,
  nowMs,
}: UnseenGrantInput): ApiDeviceGrant | null {
  if (!grants || !seenGrantIds || !localPublicKeys) {
    return null;
  }
  const seen = new Set(seenGrantIds);
  const own = new Set(localPublicKeys);
  return (
    grants.find(
      (grant) =>
        grant.revoked_at === null &&
        grant.expires_at > nowMs &&
        !seen.has(grant.id) &&
        !own.has(grant.device_key.toLowerCase())
    ) ?? null
  );
}

function getLocalNotice(
  grant: ApiDeviceGrant | null,
  nowMs: number
): SignedMessagesNoticeModel | null {
  switch (getDeviceGrantStatus(grant, nowMs)) {
    case "none":
      return { kind: "enable" };
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
  const { data: grants } = useDeviceGrants(address);
  const { dismissedUntil, seenGrantIds } =
    useSignedMessagesNoticeState(address);
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

  const model = useMemo((): SignedMessagesNoticeModel | null => {
    if (!address || !local.loaded || nowMs === 0) {
      return null;
    }
    const unseen = findUnseenGrant({
      grants,
      seenGrantIds,
      localPublicKeys: local.publicKeys,
      nowMs,
    });
    if (unseen) {
      return { kind: "new-device", grant: unseen };
    }
    if (!composerEmpty || (dismissedUntil ?? 0) > nowMs) {
      return null;
    }
    return getLocalNotice(local.grant, nowMs);
  }, [
    address,
    composerEmpty,
    dismissedUntil,
    grants,
    local,
    nowMs,
    seenGrantIds,
  ]);

  const dismiss = useCallback(() => {
    if (!address || !model) {
      return;
    }
    if (model.kind === "new-device") {
      markDeviceGrantsSeen(address, [model.grant.id]);
      return;
    }
    dismissSignedMessagesNotice(address, Date.now());
  }, [address, model]);

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
    revoke,
    isRevoking,
  };
}
