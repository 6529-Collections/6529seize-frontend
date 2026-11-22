"use client";

import { useAuth } from "@/components/auth/Auth";
import type { NFTFinalSubscription } from "@/generated/models/NFTFinalSubscription";
import { formatAddress } from "@/helpers/addressFormatting";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  getMemePhaseIdForRootPhase,
  ManifoldClaimStatus,
  type ManifoldClaim,
} from "@/hooks/useManifoldClaim";
import { formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

const SUBSCRIPTION_REFRESH_INTERVAL = 60_000;

const PHASE_LABEL_KEY: Readonly<Partial<Record<string, MessageKey>>> = {
  "0": "theMemes.mint.subscriptionAirdrop.phase.phase0",
  "1": "theMemes.mint.subscriptionAirdrop.phase.phase1",
  "2": "theMemes.mint.subscriptionAirdrop.phase.phase2",
  public: "theMemes.mint.subscriptionAirdrop.phase.public",
};

function getMessageKey(airdropped: boolean, count: number): MessageKey {
  if (airdropped) {
    return count === 1
      ? "theMemes.mint.subscriptionAirdrop.airdropped.one"
      : "theMemes.mint.subscriptionAirdrop.airdropped.many";
  }
  return count === 1
    ? "theMemes.mint.subscriptionAirdrop.pending.one"
    : "theMemes.mint.subscriptionAirdrop.pending.many";
}

/**
 * Explains, during a mint phase, that the connected profile's subscription
 * covers that phase. A subscriber's spot in the phase is filled by an airdrop,
 * so the minting form can otherwise show no spots for that wallet.
 */
export default function ManifoldMintingSubscriptionNote({
  contract,
  claim,
}: Readonly<{
  contract: string;
  claim: ManifoldClaim;
}>) {
  const isOpen =
    claim.status === ManifoldClaimStatus.ACTIVE && !claim.isFinalized;
  const tokenId = claim.tokenId;
  const memePhaseId = isOpen ? claim.memePhase?.id : undefined;
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy } = useAuth();
  // The consolidation key is the key of the finalized subscription row.
  const profileKey = activeProfileProxy
    ? undefined
    : (connectedProfile?.consolidation_key ?? undefined);
  const phaseLabelKey = memePhaseId ? PHASE_LABEL_KEY[memePhaseId] : undefined;
  const validTokenId =
    tokenId !== undefined && Number.isInteger(tokenId) && tokenId > 0
      ? tokenId
      : null;
  const enabled = !!profileKey && !!phaseLabelKey && validTokenId !== null;
  const cacheId = `${profileKey ?? ""}-${contract}-${validTokenId ?? ""}`;
  const endpoint = [
    "subscriptions/consolidation/final",
    encodeURIComponent(profileKey ?? ""),
    encodeURIComponent(contract),
    String(validTokenId ?? ""),
  ].join("/");

  const { data: final } = useQuery<NFTFinalSubscription | null>({
    // Shares the cache entry used by the profile Subscriptions tab.
    queryKey: ["consolidation-final-subscription", cacheId],
    queryFn: async ({ signal }) => {
      try {
        return await commonApiFetch<NFTFinalSubscription>({
          endpoint,
          errorMode: "structured",
          signal,
        });
      } catch (error) {
        if (getStructuredApiErrorStatus(error) === 404) return null;
        throw error;
      }
    },
    enabled,
    retry: false,
    refetchInterval: SUBSCRIPTION_REFRESH_INTERVAL,
  });

  if (!enabled || !final) {
    return null;
  }

  const count = Number(final.subscribed_count);
  if (
    !Number.isFinite(count) ||
    count <= 0 ||
    getMemePhaseIdForRootPhase(final.phase) !== memePhaseId
  ) {
    return null;
  }

  const airdropped = Number(final.redeemed_count ?? 0) >= count;

  return (
    <p className="tw-mb-0 tw-mt-2 tw-rounded-lg tw-bg-white/[0.04] tw-px-3 tw-py-2.5 tw-text-sm tw-leading-6 tw-text-iron-200">
      {t(locale, getMessageKey(airdropped, count), {
        phase: t(locale, phaseLabelKey),
        count: formatInteger(locale, count),
        address: formatAddress(final.airdrop_address),
      })}
    </p>
  );
}
