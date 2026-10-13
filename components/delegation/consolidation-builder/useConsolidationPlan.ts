"use client";

import type {
  ConsolidationLimits,
  ConsolidationPolicy,
} from "@/helpers/consolidationPolicy";

import { useMemo, useState } from "react";
import {
  buildConsolidationPlan,
  createDirectedLinkLookup,
  requiresFourthSlot,
  type ConsolidationPlan,
} from "./consolidation-plan";
import {
  useConsolidationFreshLinks,
  useConsolidationLinkStatus,
} from "./useConsolidationBuilderData";

/**
 * Link status captured when a wallet list is first planned. Step numbering
 * and order come from it, so confirmed steps stay in place while live reads
 * mark them done.
 */
interface LinkBaseline {
  readonly walletsKey: string;
  readonly registeredLinkKeys: readonly string[];
  readonly freshLinkKeys: readonly string[];
  readonly existingMembers: readonly string[];
}

const NO_WALLETS: readonly string[] = [];

function containsAll(
  required: readonly string[],
  live: readonly string[]
): boolean {
  const liveSet = new Set(live);
  return required.every((key) => liveSet.has(key));
}

function getNextBaseline(
  current: LinkBaseline | undefined,
  next: {
    readonly walletsKey: string;
    readonly registeredLinkKeys: readonly string[] | undefined;
    readonly freshLinkKeys: readonly string[] | undefined;
    readonly existingMembers: readonly string[];
  }
): LinkBaseline | undefined {
  const { registeredLinkKeys, freshLinkKeys } = next;
  if (!registeredLinkKeys || !freshLinkKeys) {
    return undefined;
  }
  // Re-plan only when the list changes or a direction the plan relied on
  // was revoked or is no longer recorded as fresh.
  if (
    current?.walletsKey === next.walletsKey &&
    containsAll(current.registeredLinkKeys, registeredLinkKeys) &&
    containsAll(current.freshLinkKeys, freshLinkKeys)
  ) {
    return undefined;
  }
  return {
    walletsKey: next.walletsKey,
    registeredLinkKeys,
    freshLinkKeys,
    existingMembers: next.existingMembers,
  };
}

/**
 * Reads the links between valid wallets (on-chain status, plus 6529's
 * registration times for four-wallet plans) and plans the signing steps
 * once the current consolidations are known.
 */
export function useConsolidationPlan(input: {
  readonly wallets: readonly string[];
  readonly isValid: boolean;
  readonly groupsReady: boolean;
  readonly existingMembers: readonly string[];
  readonly nowMs: number;
  readonly policy: ConsolidationPolicy | null;
  readonly limits: ConsolidationLimits | null;
}) {
  const {
    wallets,
    isValid,
    groupsReady,
    existingMembers,
    nowMs,
    policy,
    limits,
  } = input;
  const walletsKey = `${wallets.join(",")}:${policy?.activationMs ?? "unavailable"}:${limits?.maxWallets ?? "unavailable"}:${limits?.ungatedMaxWallets ?? "unavailable"}`;
  const linkStatus = useConsolidationLinkStatus(isValid ? wallets : NO_WALLETS);
  // Only four-wallet plans depend on when each direction was registered.
  const needsFreshLinks =
    isValid &&
    !!limits &&
    requiresFourthSlot(wallets.length, limits.ungatedMaxWallets);
  const freshLinks = useConsolidationFreshLinks(
    needsFreshLinks && policy ? wallets : NO_WALLETS,
    policy?.activationMs ?? null
  );
  const freshLinkKeys = needsFreshLinks ? freshLinks.freshLinkKeys : NO_WALLETS;

  const [baseline, setBaseline] = useState<LinkBaseline>();
  const nextBaseline =
    isValid && groupsReady && (!needsFreshLinks || policy)
      ? getNextBaseline(baseline, {
          walletsKey,
          registeredLinkKeys: linkStatus.registeredLinkKeys,
          freshLinkKeys,
          existingMembers,
        })
      : undefined;
  if (nextBaseline) {
    setBaseline(nextBaseline);
  }
  const activeBaseline =
    isValid &&
    (!needsFreshLinks || policy) &&
    baseline?.walletsKey === walletsKey
      ? baseline
      : undefined;

  const plan = useMemo<ConsolidationPlan | undefined>(
    () =>
      activeBaseline && limits
        ? buildConsolidationPlan({
            limits,
            wallets,
            existingMembers: activeBaseline.existingMembers,
            isRegistered: createDirectedLinkLookup(
              activeBaseline.registeredLinkKeys
            ),
            isFresh: createDirectedLinkLookup(activeBaseline.freshLinkKeys),
            nowMs,
            signingOpensMs: policy?.signingOpensMs ?? null,
          })
        : undefined,
    [activeBaseline, limits, nowMs, policy, wallets]
  );

  return {
    plan,
    registeredLinkKeys: linkStatus.registeredLinkKeys,
    freshLinkKeys,
    hasReadError: linkStatus.isError || (needsFreshLinks && freshLinks.isError),
    refetchLinks: linkStatus.refetch,
  };
}
