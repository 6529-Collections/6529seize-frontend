"use client";

import { faAnglesDown, faAnglesUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { isAddress } from "viem";

import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areEqualAddresses } from "@/helpers/Helpers";
import { getUserProfile } from "@/helpers/server.helpers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";

import TransferModalPfp from "../nft-transfer/TransferModalPfp";

const MIN_SEARCH_LENGTH = 3;

function getSearchStatusText(
  isSearching: boolean,
  needsMoreSearchCharacters: boolean,
  remainingSearchCharacters: number,
  resultsLen: number,
  trimmedQuery: string
): string {
  if (isSearching) return "Searching…";
  if (needsMoreSearchCharacters) {
    const plural = remainingSearchCharacters === 1 ? "" : "s";
    return `Type ${remainingSearchCharacters} more character${plural}`;
  }
  if (resultsLen > 0) {
    const plural = resultsLen === 1 ? "" : "s";
    return `Found ${resultsLen} result${plural}`;
  }
  if (trimmedQuery) return "No results.";
  return "Type to search.";
}

function RecipientSelectedDisplay({
  selectedProfile,
  profile,
  isIdentityLoading,
  onClear,
  allowProfileChange,
  showSelectedProfileCard,
  walletsListRef,
  walletsHasOverflow,
  walletsAtEnd,
  selectedWallet,
  onWalletSelect,
  disableSingleWalletSelection,
}: {
  readonly selectedProfile: CommunityMemberMinimal;
  readonly profile: ApiIdentity | null;
  readonly isIdentityLoading: boolean;
  readonly onClear: () => void;
  readonly allowProfileChange: boolean;
  readonly showSelectedProfileCard: boolean;
  readonly walletsListRef: React.RefObject<HTMLDivElement | null>;
  readonly walletsHasOverflow: boolean;
  readonly walletsAtEnd: boolean;
  readonly selectedWallet: string | null;
  readonly onWalletSelect: (wallet: string) => void;
  readonly disableSingleWalletSelection: boolean;
}) {
  const getWallets = () => {
    if (profile?.wallets && profile.wallets.length > 0) {
      return profile.wallets;
    }
    if (selectedProfile.wallet) {
      return [
        {
          wallet: selectedProfile.wallet,
          display:
            selectedProfile.display ||
            selectedProfile.handle ||
            selectedProfile.wallet,
          tdh: 0,
        },
      ];
    }
    return [];
  };
  const wallets = getWallets();
  let walletsContent;
  if (isIdentityLoading) {
    walletsContent = (
      <div className="tw-text-xs tw-opacity-60">Loading wallets…</div>
    );
  } else if (wallets.length === 0) {
    walletsContent = (
      <div className="tw-text-xs tw-opacity-60">
        No wallets found for {selectedProfile.display || selectedProfile.handle}
        .
      </div>
    );
  } else {
    const hasSingleWallet = wallets.length === 1;
    const isWalletSelectionDisabled =
      disableSingleWalletSelection && hasSingleWallet;

    walletsContent = wallets.map(
      (w: { wallet: string; display: string | null; tdh: number }) => {
        const isSel = selectedWallet?.toLowerCase() === w.wallet.toLowerCase();
        const hasDisplay =
          w.display && w.display.toLowerCase() !== w.wallet.toLowerCase();
        const classes = [
          "tw-flex tw-min-h-[58px] tw-w-full tw-flex-col tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/10 tw-p-2",
          hasDisplay
            ? "tw-items-start tw-justify-between"
            : "tw-items-start tw-justify-center",
          isSel ? "tw-border-2 tw-border-solid !tw-border-emerald-400" : "",
        ].join(" ");

        if (isWalletSelectionDisabled) {
          return (
            <div key={w.wallet} className={classes}>
              <div className="tw-text-sm tw-font-medium">
                {w.display || w.wallet}
              </div>
              {hasDisplay && (
                <div className="tw-text-[11px] tw-opacity-60">{w.wallet}</div>
              )}
            </div>
          );
        }

        return (
          <button
            key={w.wallet}
            type="button"
            onClick={() => onWalletSelect(w.wallet)}
            className={[classes, "hover:tw-bg-white/15"].join(" ")}
          >
            <div className="tw-text-sm tw-font-medium">
              {w.display || w.wallet}
            </div>
            {hasDisplay && (
              <div className="tw-text-[11px] tw-opacity-60">{w.wallet}</div>
            )}
          </button>
        );
      }
    );
  }

  return (
    <>
      {showSelectedProfileCard && (
        <div className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-bg-white/10 tw-px-3 tw-py-2">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
            <TransferModalPfp
              src={selectedProfile.pfp}
              alt={
                selectedProfile.display ||
                selectedProfile.handle ||
                selectedProfile.wallet
              }
              level={selectedProfile.level}
            />
            <div className="tw-min-w-0">
              <div className="tw-truncate tw-text-sm tw-font-medium">
                {selectedProfile.handle || selectedProfile.display}
              </div>
              <div className="tw-truncate tw-text-[11px] tw-opacity-60">
                TDH: {selectedProfile.tdh.toLocaleString()} - Level:{" "}
                {selectedProfile.level}
              </div>
            </div>
          </div>
          {allowProfileChange && (
            <button
              type="button"
              className="tw-rounded-md tw-border-2 tw-border-solid tw-border-[#444] tw-bg-white/10 tw-px-2 tw-py-1 !tw-text-xs tw-font-medium hover:tw-bg-white/15"
              onClick={onClear}
            >
              Change
            </button>
          )}
        </div>
      )}

      <div
        className={`tw-flex tw-min-h-0 tw-flex-col tw-space-y-2 ${showSelectedProfileCard ? "tw-pt-4" : "tw-pt-0"}`}
      >
        {(showSelectedProfileCard ? wallets.length > 1 : wallets.length > 0) && (
          <div className="tw-text-sm">Choose destination wallet</div>
        )}
        <div
          ref={walletsListRef}
          className="tw-[scrollbar-gutter:stable] tw-min-h-0 tw-flex-1 tw-space-y-2 tw-overflow-auto tw-pr-3 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/30 hover:tw-scrollbar-thumb-white/50"
        >
          {walletsContent}
        </div>
        {walletsHasOverflow && (
          <div className="tw-text-center tw-text-xs tw-opacity-75">
            <FontAwesomeIcon icon={walletsAtEnd ? faAnglesUp : faAnglesDown} />{" "}
            Scroll for more
          </div>
        )}
      </div>
    </>
  );
}

function RecipientSearchDisplay({
  query,
  setQuery,
  searchStatusText,
  results,
  onPick,
  resultsListRef,
  resultsHasOverflow,
  resultsAtEnd,
  searchInputRef,
  placeholder,
}: {
  readonly query: string;
  readonly setQuery: (v: string) => void;
  readonly searchStatusText: string;
  readonly results: CommunityMemberMinimal[];
  readonly onPick: (r: CommunityMemberMinimal) => void;
  readonly resultsListRef: React.RefObject<HTMLDivElement | null>;
  readonly resultsHasOverflow: boolean;
  readonly resultsAtEnd: boolean;
  readonly searchInputRef: React.RefObject<HTMLInputElement | null>;
  readonly placeholder?: string;
}) {
  return (
    <>
      <input
        autoFocus
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder ?? "Search profile by handle, ens or wallet"}
        className="tw-h-14 tw-w-full tw-rounded-lg tw-border-none tw-bg-white/10 tw-px-3 tw-py-2 focus:tw-bg-white/20 focus:tw-outline-none"
        ref={searchInputRef}
      />
      <div className="tw-text-[12px] tw-opacity-60">{searchStatusText}</div>
      <div
        ref={resultsListRef}
        className="tw-[scrollbar-gutter:stable] tw-min-h-0 tw-flex-1 tw-space-y-2 tw-overflow-auto tw-pr-3 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/30 hover:tw-scrollbar-thumb-white/50"
      >
        {results.map((r) => (
          <button
            key={r.profile_id ?? r.wallet}
            type="button"
            onClick={() => onPick(r)}
            className="tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/10 tw-p-2 tw-text-left hover:tw-bg-white/15"
          >
            <TransferModalPfp
              src={r.pfp}
              alt={r.display || r.handle || r.wallet}
              level={r.level}
            />
            <div className="tw-min-w-0 tw-flex-1">
              <div className="tw-truncate tw-text-sm tw-font-medium">
                {r.handle || r.display}
              </div>
              <div className="tw-truncate tw-text-[11px] tw-opacity-60">
                TDH: {r.tdh.toLocaleString()} - Level: {r.level}
              </div>
            </div>
          </button>
        ))}
      </div>
      {resultsHasOverflow && (
        <div className="tw-text-center tw-text-xs tw-opacity-75">
          <FontAwesomeIcon icon={resultsAtEnd ? faAnglesUp : faAnglesDown} />{" "}
          Scroll for more
        </div>
      )}
    </>
  );
}

interface RecipientSelectorProps {
  readonly open: boolean;
  readonly selectedProfile: CommunityMemberMinimal | null;
  readonly selectedWallet: string | null;
  readonly onProfileSelect: (profile: CommunityMemberMinimal | null) => void;
  readonly onWalletSelect: (wallet: string | null) => void;
  readonly placeholder?: string;
  readonly showLabel?: boolean;
  readonly label?: string;
  readonly allowProfileChange?: boolean;
  readonly disableSingleWalletSelection?: boolean;
  readonly showSelectedProfileCard?: boolean;
}

export default function RecipientSelector({
  open,
  selectedProfile,
  selectedWallet,
  onProfileSelect,
  onWalletSelect,
  placeholder,
  showLabel = true,
  label = "Recipient",
  allowProfileChange = true,
  disableSingleWalletSelection = false,
  showSelectedProfileCard = true,
}: RecipientSelectorProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<CommunityMemberMinimal[]>([]);
  const [pendingWalletMatch, setPendingWalletMatch] = useState<string | null>(
    null
  );
  const pendingMatchAttempted = useRef(false);

  const handleOrWallet =
    selectedProfile?.handle ?? selectedProfile?.wallet ?? null;
  const { profile, isLoading: isIdentityLoading } = useIdentity({
    handleOrWallet: handleOrWallet ?? "",
    initialProfile: null,
  });

  const resultsListRef = useRef<HTMLDivElement | null>(null);
  const walletsListRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [resultsHasOverflow, setResultsHasOverflow] = useState(false);
  const [walletsHasOverflow, setWalletsHasOverflow] = useState(false);
  const [resultsAtEnd, setResultsAtEnd] = useState(false);
  const [walletsAtEnd, setWalletsAtEnd] = useState(false);

  const trimmedQuery = query.trim();
  const needsMoreSearchCharacters =
    trimmedQuery.length > 0 && trimmedQuery.length < MIN_SEARCH_LENGTH;
  const remainingSearchCharacters = Math.max(
    MIN_SEARCH_LENGTH - trimmedQuery.length,
    0
  );

  useEffect(() => {
    if (!open) {
      pendingMatchAttempted.current = false;
      setQuery("");
      setIsSearching(false);
      setResults([]);
      setResultsHasOverflow(false);
      setWalletsHasOverflow(false);
      setResultsAtEnd(false);
      setWalletsAtEnd(false);
      setPendingWalletMatch(null);
    }
  }, [open]);

  useEffect(() => {
    if (
      !selectedProfile ||
      isIdentityLoading ||
      !profile?.wallets ||
      selectedWallet
    ) {
      return;
    }

    const wallets = profile.wallets;

    if (pendingWalletMatch) {
      const normalizedMatch = pendingWalletMatch.toLowerCase();
      const matchedWallet = wallets.find(
        (w) =>
          w.wallet.toLowerCase() === normalizedMatch ||
          w.display?.toLowerCase() === normalizedMatch
      );
      if (matchedWallet) {
        onWalletSelect(matchedWallet.wallet);
      }
      setPendingWalletMatch(null);
      return;
    }

    if (wallets.length === 1 && wallets[0] && !pendingMatchAttempted.current) {
      onWalletSelect(wallets[0].wallet);
    }
  }, [
    selectedProfile,
    isIdentityLoading,
    profile?.wallets,
    selectedWallet,
    pendingWalletMatch,
    onWalletSelect,
  ]);

  const debouncedQuery = useDebouncedValue(trimmedQuery, 350);
  const enabled = open && debouncedQuery.length >= MIN_SEARCH_LENGTH;

  const { data, isFetching } = useQuery<CommunityMemberMinimal[]>({
    queryKey: ["memberSearch", debouncedQuery],
    enabled,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 30_000,
    gcTime: 300_000,
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      try {
        const arr = await commonApiFetch<CommunityMemberMinimal[]>({
          endpoint: "community-members",
          params: { param: debouncedQuery },
          signal,
        });

        if (arr && arr.length > 0) return arr;

        const identity = await getUserProfile({
          user: debouncedQuery,
          headers: {},
        });

        const communityMember: CommunityMemberMinimal = {
          profile_id: identity.id,
          handle: identity.handle,
          wallet: identity.primary_wallet,
          pfp: identity.pfp,
          display: identity.display ?? null,
          normalised_handle: identity.normalised_handle,
          primary_wallet: identity.primary_wallet,
          tdh: identity.tdh,
          level: identity.level,
          cic_rating: identity.cic,
        };

        return [communityMember];
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    const preDebounce =
      open &&
      trimmedQuery.length >= MIN_SEARCH_LENGTH &&
      debouncedQuery !== trimmedQuery;
    setIsSearching(preDebounce || (enabled && isFetching));
  }, [open, trimmedQuery, debouncedQuery, enabled, isFetching]);

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      return;
    }
    setResults(data ?? []);
  }, [enabled, data, setResults]);

  useEffect(() => {
    if (
      selectedProfile ||
      !data ||
      data.length === 0 ||
      !debouncedQuery ||
      !trimmedQuery
    ) {
      return;
    }

    const normalizedQuery = debouncedQuery.toLowerCase();
    const isExactAddress = isAddress(debouncedQuery);
    const isLikelyEns = normalizedQuery.endsWith(".eth");

    if (!isExactAddress && !isLikelyEns) {
      return;
    }

    if (data.length === 1 && data[0]) {
      const result = data[0];
      const walletMatch = areEqualAddresses(result.wallet, debouncedQuery);

      if (isExactAddress ? walletMatch : isLikelyEns) {
        pendingMatchAttempted.current = true;
        setPendingWalletMatch(debouncedQuery);
        onProfileSelect(result);
      }
    }
  }, [data, debouncedQuery, trimmedQuery, selectedProfile, onProfileSelect]);

  useEffect(() => {
    const hasOverflow = (el: HTMLElement | null) =>
      !!el && el.scrollHeight > el.clientHeight;

    const check = () => {
      setResultsHasOverflow(hasOverflow(resultsListRef.current));
      setWalletsHasOverflow(hasOverflow(walletsListRef.current));

      const nearBottom = (el: HTMLElement | null) => {
        if (!el) return false;
        const threshold = 4;
        return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
      };

      setResultsAtEnd(nearBottom(resultsListRef.current));
      setWalletsAtEnd(nearBottom(walletsListRef.current));
    };

    check();
    globalThis.addEventListener("resize", check);

    const resultsEl = resultsListRef.current;
    const walletsEl = walletsListRef.current;

    const onScrollResults = () => {
      const el = resultsListRef.current;
      if (!el) return;
      const threshold = 4;
      setResultsAtEnd(
        el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
      );
    };
    const onScrollWallets = () => {
      const el = walletsListRef.current;
      if (!el) return;
      const threshold = 4;
      setWalletsAtEnd(
        el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
      );
    };

    resultsEl?.addEventListener("scroll", onScrollResults);
    walletsEl?.addEventListener("scroll", onScrollWallets);

    return () => {
      globalThis.removeEventListener("resize", check);
      resultsEl?.removeEventListener("scroll", onScrollResults);
      walletsEl?.removeEventListener("scroll", onScrollWallets);
    };
  }, [open, results, profile?.wallets, isIdentityLoading]);

  const searchStatusText = getSearchStatusText(
    isSearching,
    needsMoreSearchCharacters,
    remainingSearchCharacters,
    results.length,
    trimmedQuery
  );

  const handleClear = () => {
    pendingMatchAttempted.current = false;
    setPendingWalletMatch(null);
    onProfileSelect(null);
    onWalletSelect(null);
    setResults([]);
    setQuery("");
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  return (
    <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-space-y-2">
      {showLabel && (
        <div
          className={`tw-font-semibold ${selectedProfile ? "tw-mb-2" : "tw-mb-0"}`}
        >
          {label}
        </div>
      )}
      {selectedProfile ? (
        <RecipientSelectedDisplay
          selectedProfile={selectedProfile}
          profile={profile}
          isIdentityLoading={isIdentityLoading}
          onClear={handleClear}
          allowProfileChange={allowProfileChange}
          showSelectedProfileCard={showSelectedProfileCard}
          walletsListRef={walletsListRef}
          walletsHasOverflow={walletsHasOverflow}
          walletsAtEnd={walletsAtEnd}
          selectedWallet={selectedWallet}
          onWalletSelect={onWalletSelect}
          disableSingleWalletSelection={disableSingleWalletSelection}
        />
      ) : (
        <RecipientSearchDisplay
          query={query}
          setQuery={setQuery}
          searchStatusText={searchStatusText}
          results={results}
          onPick={(r) => {
            onProfileSelect(r);
            onWalletSelect(null);
          }}
          resultsListRef={resultsListRef}
          resultsHasOverflow={resultsHasOverflow}
          resultsAtEnd={resultsAtEnd}
          searchInputRef={searchInputRef}
          placeholder={placeholder ?? "Search profile by handle, ens or wallet"}
        />
      )}
    </div>
  );
}
