"use client";

import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areEqualAddresses } from "@/helpers/Helpers";
import { getUserProfile } from "@/helpers/server.helpers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useIdentity } from "@/hooks/useIdentity";
import { formatInteger, formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { faAnglesDown, faAnglesUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { isAddress } from "viem";
import TransferModalPfp from "../nft-transfer/TransferModalPfp";

const MIN_SEARCH_LENGTH = 3;

function getSearchStatusText(
  locale: SupportedLocale,
  isSearching: boolean,
  needsMoreSearchCharacters: boolean,
  remainingSearchCharacters: number,
  resultsLen: number,
  trimmedQuery: string
): string {
  if (isSearching) {
    return translate(locale, "recipientSelector.search.searching");
  }
  if (needsMoreSearchCharacters) {
    return translate(
      locale,
      remainingSearchCharacters === 1
        ? "recipientSelector.search.charactersRemaining.one"
        : "recipientSelector.search.charactersRemaining.many",
      { count: formatInteger(locale, remainingSearchCharacters) }
    );
  }
  if (resultsLen > 0) {
    return translate(
      locale,
      resultsLen === 1
        ? "recipientSelector.search.results.one"
        : "recipientSelector.search.results.many",
      { count: formatInteger(locale, resultsLen) }
    );
  }
  if (trimmedQuery) {
    return translate(locale, "recipientSelector.search.noResults");
  }
  return translate(locale, "recipientSelector.search.prompt");
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
  locale,
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
  readonly locale: SupportedLocale;
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
      <div className="tw-text-xs tw-opacity-60">
        {translate(locale, "recipientSelector.wallets.loading")}
      </div>
    );
  } else if (wallets.length === 0) {
    walletsContent = (
      <div className="tw-text-xs tw-opacity-60">
        {translate(locale, "recipientSelector.wallets.noneFound", {
          profile:
            selectedProfile.display ||
            selectedProfile.handle ||
            selectedProfile.wallet,
        })}
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
          "tw-flex tw-min-h-[58px] tw-w-full tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/50 tw-p-3 tw-transition-all",
          hasDisplay
            ? "tw-items-start tw-justify-between"
            : "tw-items-start tw-justify-center",
          isSel
            ? "!tw-border-primary-500 tw-bg-primary-500/10"
            : "tw-border-transparent",
        ].join(" ");

        if (isWalletSelectionDisabled) {
          return (
            <div key={w.wallet} className={classes}>
              <div className="tw-text-sm tw-font-bold tw-text-white">
                {w.display || w.wallet}
              </div>
              {hasDisplay && (
                <div className="tw-text-[11px] tw-font-medium tw-text-iron-500">
                  {w.wallet}
                </div>
              )}
            </div>
          );
        }

        return (
          <button
            key={w.wallet}
            type="button"
            onClick={() => onWalletSelect(w.wallet)}
            className={[classes, "hover:tw-bg-iron-800"].join(" ")}
          >
            <div className="tw-text-sm tw-font-bold tw-text-white">
              {w.display || w.wallet}
            </div>
            {hasDisplay && (
              <div className="tw-text-[11px] tw-font-medium tw-text-iron-500">
                {w.wallet}
              </div>
            )}
          </button>
        );
      }
    );
  }

  return (
    <>
      {showSelectedProfileCard && (
        <div className="tw-flex tw-items-center tw-justify-between tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/50 tw-px-4 tw-py-3">
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
              <div className="tw-truncate tw-text-sm tw-font-bold tw-text-white">
                {selectedProfile.handle || selectedProfile.display}
              </div>
              <div className="tw-truncate tw-text-[11px] tw-font-medium tw-text-iron-500">
                {translate(locale, "recipientSelector.profileStats", {
                  tdh: formatNumber(locale, selectedProfile.tdh),
                  level: formatInteger(locale, selectedProfile.level),
                })}
              </div>
            </div>
          </div>
          {allowProfileChange && (
            <button
              type="button"
              className="tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-3 tw-py-1.5 tw-text-xs tw-font-bold tw-text-iron-200 tw-transition-colors hover:tw-bg-iron-700"
              onClick={onClear}
            >
              {translate(locale, "recipientSelector.change")}
            </button>
          )}
        </div>
      )}

      <div
        className={`tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-space-y-3 ${showSelectedProfileCard ? "tw-pt-6" : "tw-pt-0"}`}
      >
        {(showSelectedProfileCard
          ? wallets.length > 1
          : wallets.length > 0) && (
          <div className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-400">
            {translate(locale, "recipientSelector.wallets.chooseDestination")}
          </div>
        )}
        <div
          ref={walletsListRef}
          className="tw-[scrollbar-gutter:stable] tw-min-h-0 tw-flex-1 tw-space-y-2 tw-overflow-auto tw-pr-3 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/10 hover:tw-scrollbar-thumb-white/20"
        >
          {walletsContent}
        </div>
        {walletsHasOverflow && (
          <div className="tw-text-center tw-text-xs tw-text-iron-500">
            <FontAwesomeIcon icon={walletsAtEnd ? faAnglesUp : faAnglesDown} />{" "}
            {translate(locale, "recipientSelector.scrollForMore")}
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
  locale,
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
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <div className="tw-relative">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            placeholder ??
            translate(locale, "recipientSelector.search.placeholder")
          }
          className="tw-h-12 tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-text-white tw-placeholder-iron-500 tw-transition-all focus:tw-border-primary-500 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-500"
          ref={searchInputRef}
        />
      </div>
      <div className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-500">
        {searchStatusText}
      </div>
      <div
        ref={resultsListRef}
        className="tw-[scrollbar-gutter:stable] tw-min-h-0 tw-flex-1 tw-space-y-2 tw-overflow-auto tw-pr-3 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/10 hover:tw-scrollbar-thumb-white/20"
      >
        {results.map((r) => (
          <button
            key={r.profile_id ?? r.wallet}
            type="button"
            onClick={() => onPick(r)}
            className="tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-transparent tw-bg-iron-900/50 tw-p-3 tw-text-left tw-transition-all hover:tw-border-iron-700 hover:tw-bg-iron-800"
          >
            <TransferModalPfp
              src={r.pfp}
              alt={r.display || r.handle || r.wallet}
              level={r.level}
            />
            <div className="tw-min-w-0 tw-flex-1">
              <div className="tw-truncate tw-text-sm tw-font-bold tw-text-white">
                {r.handle || r.display}
              </div>
              <div className="tw-truncate tw-text-[11px] tw-font-medium tw-text-iron-500">
                {translate(locale, "recipientSelector.profileStats", {
                  tdh: formatNumber(locale, r.tdh),
                  level: formatInteger(locale, r.level),
                })}
              </div>
            </div>
          </button>
        ))}
      </div>
      {resultsHasOverflow && (
        <div className="tw-text-center tw-text-xs tw-text-iron-500">
          <FontAwesomeIcon icon={resultsAtEnd ? faAnglesUp : faAnglesDown} />{" "}
          {translate(locale, "recipientSelector.scrollForMore")}
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
  readonly locale?: SupportedLocale | undefined;
}

export default function RecipientSelector({
  open,
  selectedProfile,
  selectedWallet,
  onProfileSelect,
  onWalletSelect,
  placeholder,
  showLabel = true,
  label,
  allowProfileChange = true,
  disableSingleWalletSelection = false,
  showSelectedProfileCard = true,
  locale = DEFAULT_LOCALE,
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
    locale,
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
  const searchPlaceholderProps =
    placeholder === undefined ? {} : { placeholder };

  return (
    <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-space-y-3">
      {showLabel && (
        <div
          className={`tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-400 ${selectedProfile ? "tw-mb-2" : "tw-mb-0"}`}
        >
          {label ?? translate(locale, "recipientSelector.label")}
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
          locale={locale}
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
          locale={locale}
          {...searchPlaceholderProps}
        />
      )}
    </div>
  );
}
