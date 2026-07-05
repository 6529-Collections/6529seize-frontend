"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NftPicker } from "@/components/nft-picker";
import type { NftPickerChange } from "@/components/nft-picker/types";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { NFTSearchResult } from "@/components/header/header-search/HeaderSearchModalItem";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiWaveCreditNft } from "@/generated/models/ApiWaveCreditNft";
import { commonApiFetch } from "@/services/api/common-api";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";

const MEMES_CONTRACT_LOWER = MEMES_CONTRACT.toLowerCase();

const VALIDATION_MESSAGES: Partial<
  Record<CREATE_WAVE_VALIDATION_ERROR, string>
> = {
  [CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_NFTS_REQUIRED]:
    "Choose at least one Meme card.",
  [CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_NFTS_CONTRACT_INVALID]:
    "Only Meme cards can be used for Meme Card TDH.",
  [CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_MEME_COUNT_UNAVAILABLE]:
    "Meme card count is not loaded yet.",
  [CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_FULL_SET_NOT_ALLOWED]:
    "Selecting all Meme cards is the same as normal TDH. Choose a smaller set.",
};

const FULL_SET_MESSAGE =
  "Selecting all Meme cards is the same as normal TDH. Choose a smaller set.";
const MAX_SELECTED_MESSAGE = "Leave at least one Meme card unselected.";
const NON_MEME_MESSAGE = "Only Meme cards can be added.";
const INVALID_MEME_ID_MESSAGE = "Only existing Meme card IDs can be added.";

const isMemeContract = (contract: string): boolean =>
  contract.toLowerCase() === MEMES_CONTRACT_LOWER;

const getNormalizedMemeTokenIds = (tokenIds: readonly number[]): number[] =>
  Array.from(
    new Set(
      tokenIds.filter((tokenId) => Number.isInteger(tokenId) && tokenId > 0)
    )
  ).toSorted((left, right) => left - right);

const toMemeCreditNfts = (tokenIds: readonly number[]): ApiWaveCreditNft[] => {
  const uniqueIds = getNormalizedMemeTokenIds(tokenIds);
  return uniqueIds.map((tokenId) => ({
    contract: MEMES_CONTRACT,
    token_id: tokenId,
  }));
};

const getCreditNftTokenIds = (
  creditNfts: readonly ApiWaveCreditNft[]
): number[] =>
  Array.from(
    new Set(
      creditNfts
        .filter((nft) => isMemeContract(nft.contract))
        .map((nft) => nft.token_id)
        .filter((tokenId) => Number.isInteger(tokenId) && tokenId > 0)
    )
  ).toSorted((left, right) => left - right);

const isFullMemeSetSelection = ({
  selectedCount,
  memeCount,
}: {
  readonly selectedCount: number;
  readonly memeCount: number | null;
}): boolean => memeCount !== null && selectedCount >= memeCount;

const useMemeCardSearch = (searchCriteria: string) => {
  const trimmedSearchCriteria = searchCriteria.trim();
  const isNumericSearch =
    trimmedSearchCriteria.length > 0 &&
    !Number.isNaN(Number(trimmedSearchCriteria));
  const enabled = trimmedSearchCriteria.length >= 3 || isNumericSearch;

  return useQuery<NFTSearchResult[], Error>({
    queryKey: [
      QueryKey.NFTS_SEARCH,
      { scope: "meme-card-set", search: trimmedSearchCriteria },
    ],
    queryFn: async () =>
      await commonApiFetch<NFTSearchResult[]>({
        endpoint: "nfts_search",
        params: {
          search: trimmedSearchCriteria,
        },
      }),
    enabled,
    staleTime: 60 * 1000,
  });
};

function MemeCardSearch({
  selectedIds,
  memeCount,
  onAdd,
  onReject,
}: {
  readonly selectedIds: ReadonlySet<number>;
  readonly memeCount: number | null;
  readonly onAdd: (tokenId: number) => void;
  readonly onReject: (message: string) => void;
}) {
  const [searchCriteria, setSearchCriteria] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data, isFetching } = useMemeCardSearch(searchCriteria);

  const memeResults = useMemo(
    () => (data ?? []).filter((item) => isMemeContract(item.contract)),
    [data]
  );

  const handleSelect = (item: NFTSearchResult) => {
    if (!isMemeContract(item.contract)) {
      onReject(NON_MEME_MESSAGE);
      return;
    }
    if (
      isFullMemeSetSelection({
        selectedCount: selectedIds.has(item.id)
          ? selectedIds.size
          : selectedIds.size + 1,
        memeCount,
      })
    ) {
      onReject(FULL_SET_MESSAGE);
      return;
    }
    onAdd(item.id);
    setSearchCriteria("");
    setIsOpen(false);
  };

  let searchResultItems: ReactNode;
  if (isFetching) {
    searchResultItems = (
      <li className="tw-px-3 tw-py-2 tw-text-sm tw-text-iron-300">
        Loading...
      </li>
    );
  } else if (memeResults.length > 0) {
    searchResultItems = memeResults.map((item) => {
      const isSelected = selectedIds.has(item.id);
      return (
        <li key={`${item.contract}-${item.id}`}>
          <button
            type="button"
            onClick={() => handleSelect(item)}
            className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-text-iron-100 hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
            aria-label={`Add The Memes #${item.id}`}
          >
            <span className="tw-truncate">
              #{item.id} - {item.name}
            </span>
            {isSelected && (
              <span className="tw-shrink-0 tw-text-xs tw-font-semibold tw-text-primary-300">
                Selected
              </span>
            )}
          </button>
        </li>
      );
    });
  } else {
    searchResultItems = (
      <li className="tw-px-3 tw-py-2 tw-text-sm tw-text-iron-300">
        No Meme card results
      </li>
    );
  }

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-gap-2">
      <label
        htmlFor="meme-card-set-search"
        className="tw-text-sm tw-font-semibold tw-text-iron-100"
      >
        Add by search
      </label>
      <input
        id="meme-card-set-search"
        type="text"
        value={searchCriteria}
        onChange={(event) => {
          setSearchCriteria(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search Meme card name or ID"
        className="tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-200 placeholder:tw-text-iron-600 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
      />
      {isOpen && searchCriteria.trim().length > 0 && (
        <div className="tw-absolute tw-left-0 tw-right-0 tw-top-full tw-z-20 tw-mt-2 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-shadow-xl">
          <ul className="tw-m-0 tw-max-h-56 tw-list-none tw-overflow-y-auto tw-p-1">
            {searchResultItems}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function MemeCardSetPicker({
  creditNfts,
  memeCount,
  isMemeCountLoading,
  isMemeCountError,
  errors,
  onCreditNftsChange,
}: {
  readonly creditNfts: ApiWaveCreditNft[];
  readonly memeCount: number | null;
  readonly isMemeCountLoading: boolean;
  readonly isMemeCountError: boolean;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onCreditNftsChange: (creditNfts: ApiWaveCreditNft[]) => void;
}) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [pickerSyncVersion, setPickerSyncVersion] = useState(0);

  const selectedTokenIds = useMemo(
    () => getCreditNftTokenIds(creditNfts),
    [creditNfts]
  );

  const selectedIdSet = useMemo(
    () => new Set(selectedTokenIds),
    [selectedTokenIds]
  );

  const pickerValueInput = useMemo(
    () => ({ selectedTokenIds, syncVersion: pickerSyncVersion }),
    [selectedTokenIds, pickerSyncVersion]
  );

  const pickerValue = useMemo(
    () => ({
      chain: "ethereum" as const,
      contractAddress: MEMES_CONTRACT as `0x${string}`,
      selectedIds: pickerValueInput.selectedTokenIds.map((tokenId) =>
        BigInt(tokenId)
      ),
      allSelected: false,
    }),
    [pickerValueInput]
  );

  const fixedContract = useMemo(
    () => ({
      address: MEMES_CONTRACT as `0x${string}`,
      name: "The Memes",
      symbol: "MEMES",
      tokenType: "ERC1155" as const,
      totalSupply:
        typeof memeCount === "number" && Number.isFinite(memeCount)
          ? String(memeCount)
          : undefined,
      floorPriceEth: null,
      imageUrl: null,
      isSpam: false,
    }),
    [memeCount]
  );

  const maxSelectedCount =
    typeof memeCount === "number" && Number.isFinite(memeCount)
      ? Math.max(0, memeCount - 1)
      : undefined;

  const hasValidMemeCount =
    typeof memeCount === "number" &&
    Number.isInteger(memeCount) &&
    memeCount > 0;
  const validationMessages = errors
    .filter(
      (error) =>
        error !==
          CREATE_WAVE_VALIDATION_ERROR.CARD_SET_TDH_VOTING_MEME_COUNT_UNAVAILABLE ||
        !hasValidMemeCount
    )
    .map((error) => VALIDATION_MESSAGES[error])
    .filter((message): message is string => !!message);
  const displayedMessages = Array.from(
    new Set(
      [localError, ...validationMessages].filter(
        (message): message is string => !!message
      )
    )
  );

  const rejectPickerChange = (message: string) => {
    setLocalError(message);
    setPickerSyncVersion((version) => version + 1);
  };

  const applyTokenIds = (tokenIds: readonly number[]) => {
    const nextCreditNfts = toMemeCreditNfts(tokenIds);
    if (
      isFullMemeSetSelection({
        selectedCount: nextCreditNfts.length,
        memeCount,
      })
    ) {
      rejectPickerChange(FULL_SET_MESSAGE);
      return;
    }
    setLocalError(null);
    onCreditNftsChange(nextCreditNfts);
  };

  const validateTypedTokenIds = (tokenIds: readonly number[]) => {
    const hasInvalidTokenId = tokenIds.some(
      (tokenId) => !Number.isInteger(tokenId) || tokenId <= 0
    );
    if (hasInvalidTokenId) {
      rejectPickerChange(INVALID_MEME_ID_MESSAGE);
      return false;
    }
    const normalizedTokenIds = getNormalizedMemeTokenIds(tokenIds);
    if (normalizedTokenIds.length === 0) {
      return true;
    }
    const highestExistingMemeCardId = hasValidMemeCount ? memeCount : null;
    if (highestExistingMemeCardId === null) {
      rejectPickerChange(INVALID_MEME_ID_MESSAGE);
      return false;
    }
    if (
      normalizedTokenIds.some((tokenId) => tokenId > highestExistingMemeCardId)
    ) {
      rejectPickerChange(INVALID_MEME_ID_MESSAGE);
      return false;
    }
    return true;
  };

  const handlePickerChange = (change: NftPickerChange) => {
    if (!change) {
      applyTokenIds([]);
      return;
    }
    if ("type" in change) {
      rejectPickerChange(change.error);
      return;
    }
    if (!isMemeContract(change.contractAddress)) {
      rejectPickerChange(NON_MEME_MESSAGE);
      return;
    }
    if (change.allSelected === true) {
      rejectPickerChange(FULL_SET_MESSAGE);
      return;
    }
    const tokenIds: readonly number[] =
      change.outputMode === "number"
        ? change.tokenIds
        : change.tokenIds.map((tokenId) => Number(tokenId));
    if (!validateTypedTokenIds(tokenIds)) {
      return;
    }
    applyTokenIds(tokenIds);
  };

  const addTokenId = (tokenId: number) => {
    applyTokenIds([...selectedTokenIds, tokenId]);
  };

  return (
    <section className="tw-col-span-full tw-mt-2 tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4">
      <div>
        <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
          Meme Card TDH
        </p>
        <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
          Select specific Meme cards. Choosing every Meme card is normal TDH.
        </p>
      </div>

      {isMemeCountLoading && (
        <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-3 tw-text-sm tw-text-iron-300">
          Loading Meme card count...
        </div>
      )}

      {isMemeCountError && (
        <div className="tw-rounded-lg tw-border tw-border-solid tw-border-error/40 tw-bg-error/10 tw-p-3 tw-text-sm tw-text-error">
          Unable to load Meme card count. You cannot continue until it loads.
        </div>
      )}

      <MemeCardSearch
        selectedIds={selectedIdSet}
        memeCount={memeCount}
        onAdd={addTokenId}
        onReject={setLocalError}
      />

      <NftPicker
        value={pickerValue}
        onChange={handlePickerChange}
        fixedContract={fixedContract}
        allowAll={false}
        allowRanges={true}
        maxSelectedCount={maxSelectedCount}
        maxSelectedCountMessage={MAX_SELECTED_MESSAGE}
        placeholder="The Memes"
        variant="flat"
      />

      <div className="tw-text-sm tw-text-iron-300">
        {selectedTokenIds.length.toLocaleString()} Meme card
        {selectedTokenIds.length === 1 ? "" : "s"} selected
      </div>

      {displayedMessages.map((message) => (
        <div
          key={message}
          className="tw-rounded-lg tw-border tw-border-solid tw-border-error/40 tw-bg-error/10 tw-p-3 tw-text-sm tw-text-error"
        >
          {message}
        </div>
      ))}
    </section>
  );
}
