"use client";

import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";
import type { SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import { getAddress, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { useEnsAddress } from "wagmi";

/** Why an ENS search could not be matched to a result. */
export type EnsVerificationNote = Readonly<
  | { kind: "lookupFailed"; name: string }
  | { kind: "notResolved"; name: string }
  | { kind: "resolvesElsewhere"; name: string; address: string }
>;

function getEnsLookupName(query: string): string | undefined {
  const name = query.trim().toLowerCase();
  return name.endsWith(".eth") ? name : undefined;
}

export function displayWalletAddress(wallet: string): string {
  return isAddress(wallet, { strict: false }) ? getAddress(wallet) : wallet;
}

/**
 * Resolves a `.eth` search query forward on Ethereum. Any other query does
 * no lookup.
 */
export function useRecipientEnsLookup(query: string | undefined) {
  const ensLookupName =
    query === undefined ? undefined : getEnsLookupName(query);
  const ensAddressQuery = useEnsAddress({
    name: ensLookupName,
    chainId: mainnet.id,
  });
  const verifiedEnsAddress =
    ensLookupName !== undefined &&
    !ensAddressQuery.isError &&
    typeof ensAddressQuery.data === "string" &&
    isAddress(ensAddressQuery.data, { strict: false })
      ? ensAddressQuery.data
      : null;
  return {
    ensLookupName,
    verifiedEnsAddress,
    isEnsLookupPending:
      ensLookupName !== undefined && ensAddressQuery.isLoading,
    hasLookupError: ensLookupName !== undefined && ensAddressQuery.isError,
  };
}

function getEnsVerificationNote({
  name,
  isPending,
  hasLookupError,
  resolvedAddress,
  isMatch,
  hasResults,
}: Readonly<{
  name: string | undefined;
  isPending: boolean;
  hasLookupError: boolean;
  resolvedAddress: string | null;
  isMatch: boolean;
  hasResults: boolean;
}>): EnsVerificationNote | null {
  if (name === undefined || isPending || isMatch || !hasResults) {
    return null;
  }
  if (hasLookupError) {
    return { kind: "lookupFailed", name };
  }
  if (resolvedAddress === null) {
    return { kind: "notResolved", name };
  }
  return {
    kind: "resolvesElsewhere",
    name,
    address: displayWalletAddress(resolvedAddress),
  };
}

/**
 * Decides whether the single search result for a name may be auto-selected:
 * only when the name resolves to one of that profile's wallets (its search
 * wallet, its primary wallet, or a wallet listed on its identity). Otherwise
 * it says why not.
 */
export function useRecipientEnsMatch({
  ensLookupName,
  verifiedEnsAddress,
  isEnsLookupPending,
  hasLookupError,
  data,
  results,
}: Readonly<{
  ensLookupName: string | undefined;
  verifiedEnsAddress: string | null;
  isEnsLookupPending: boolean;
  hasLookupError: boolean;
  data: readonly CommunityMemberMinimal[] | undefined;
  results: readonly CommunityMemberMinimal[];
}>) {
  const ensCandidate =
    verifiedEnsAddress !== null && data?.length === 1
      ? (data[0] ?? null)
      : null;
  const ensCandidateNeedsWallets =
    ensCandidate !== null &&
    !areEqualAddresses(ensCandidate.wallet, verifiedEnsAddress) &&
    !areEqualAddresses(ensCandidate.primary_wallet, verifiedEnsAddress);
  const { profile: ensCandidateIdentity, isLoading: isEnsCandidateLoading } =
    useIdentity({
      handleOrWallet: ensCandidateNeedsWallets
        ? (ensCandidate.handle ?? ensCandidate.wallet)
        : "",
      initialProfile: null,
    });
  const isVerifiedEnsMatch =
    ensCandidate !== null &&
    (!ensCandidateNeedsWallets ||
      (ensCandidateIdentity !== null &&
        ensCandidateIdentity.id === ensCandidate.profile_id &&
        ensCandidateIdentity.wallets?.some((wallet) =>
          areEqualAddresses(wallet.wallet, verifiedEnsAddress)
        ) === true));

  const ensNote = getEnsVerificationNote({
    name: ensLookupName,
    isPending:
      isEnsLookupPending || (ensCandidateNeedsWallets && isEnsCandidateLoading),
    hasLookupError,
    resolvedAddress: verifiedEnsAddress,
    isMatch:
      isVerifiedEnsMatch ||
      results.some((result) =>
        areEqualAddresses(result.wallet, verifiedEnsAddress)
      ),
    hasResults: results.length > 0,
  });

  return { isVerifiedEnsMatch, ensNote };
}

export function getEnsVerificationNoteText(
  locale: SupportedLocale,
  note: EnsVerificationNote
): string {
  switch (note.kind) {
    case "lookupFailed":
      return translate(locale, "recipientSelector.ens.lookupFailed", {
        name: note.name,
      });
    case "notResolved":
      return translate(locale, "recipientSelector.ens.notResolved", {
        name: note.name,
      });
    case "resolvesElsewhere":
      return translate(locale, "recipientSelector.ens.resolvesElsewhere", {
        name: note.name,
        address: note.address,
      });
  }
}
