"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import clsx from "clsx";

import { isValidEthAddress } from "@/helpers/Helpers";
import type {
  ContractOverview,
  NftPickerProps,
  NftPickerSelection,
  ParseError,
  Suggestion,
  TokenRange,
  TokenSelection,
} from "./NftPicker.types";
import {
  MAX_SAFE,
  fromCanonicalRanges,
  mergeAndSort,
  parseTokenExpressionToBigints,
  toCanonicalRanges,
  tryToNumberArray,
  formatCanonical,
} from "./NftPicker.utils";
import { NftContractHeader } from "./NftContractHeader";
import { NftSuggestList } from "./NftSuggestList";
import { NftTokenList } from "./NftTokenList";
import { NftEditRanges } from "./NftEditRanges";
import {
  useCollectionSearch,
  useContractOverviewQuery,
  primeContractCache,
} from "./useAlchemyClient";
import type { SupportedChain, TokenIdBigInt } from "./NftPicker.types";

const DEFAULT_CHAIN: SupportedChain = "ethereum";
const DEFAULT_DEBOUNCE = 250;
const DEFAULT_OVERSCAN = 8;

type PickerMode = "single" | "bucket" | "all";

const EMPTY_SELECTION: TokenSelection = [];

function toRangesFromSelection(selection: TokenSelection): TokenRange[] {
  if (!selection.length) {
    return [];
  }
  return toCanonicalRanges(selection);
}

function ensureChain(value?: SupportedChain): SupportedChain {
  return value ?? DEFAULT_CHAIN;
}

function mapSuggestionToOverview(suggestion: Suggestion): ContractOverview {
  return {
    ...suggestion,
    description: null,
    bannerImageUrl: null,
  };
}

export function NftPicker({
  value,
  defaultValue,
  onChange,
  onContractChange,
  chain: chainProp,
  outputMode = "number",
  hideSpam: hideSpamProp = true,
  allowAll = true,
  allowRanges = true,
  debounceMs = DEFAULT_DEBOUNCE,
  overscan = DEFAULT_OVERSCAN,
  placeholder = "Search by collection name or paste contract address…",
  className,
  renderTokenExtra,
}: NftPickerProps) {
  const initialChain = ensureChain(value?.chain ?? defaultValue?.chain ?? chainProp);
  const [chain] = useState<SupportedChain>(initialChain);
  const [query, setQuery] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hideSpam, setHideSpam] = useState(hideSpamProp);
  const [mode, setMode] = useState<PickerMode>("single");
  const [ranges, setRanges] = useState<TokenRange[]>([]);
  const [textValue, setTextValue] = useState<string>("");
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [unsafeCount, setUnsafeCount] = useState<number>(0);
  const [selectedContract, setSelectedContract] = useState<ContractOverview | null>(null);
  const [allSelected, setAllSelected] = useState<boolean>(false);

  const presetContractAddress = value?.contractAddress ?? defaultValue?.contractAddress;
  const presetContractQuery = useContractOverviewQuery({
    address: presetContractAddress,
    chain,
    enabled: Boolean(presetContractAddress),
  });

  useEffect(() => {
    if (!presetContractAddress || !presetContractQuery.data) {
      return;
    }
    setSelectedContract((prev) => {
      if (prev && prev.address === presetContractQuery.data!.address) {
        return prev;
      }
      return presetContractQuery.data ?? null;
    });
    onContractChange?.(presetContractQuery.data ?? null);
  }, [presetContractAddress, presetContractQuery.data, onContractChange]);

  const isAddressQuery = useMemo(() => isValidEthAddress(query.trim()), [query]);
  const contractQueryAddress = useMemo(() => {
    if (!isAddressQuery) {
      return undefined;
    }
    return query.trim() as `0x${string}`;
  }, [isAddressQuery, query]);

  const { data: searchResult } = useCollectionSearch({
    query,
    chain,
    hideSpam,
    debounceMs,
    enabled: !isAddressQuery && query.length > 1,
  });

  const addressOverviewQuery = useContractOverviewQuery({
    address: contractQueryAddress,
    chain,
    enabled: Boolean(contractQueryAddress),
  });

  const suggestionList: Suggestion[] = useMemo(() => {
    if (contractQueryAddress && addressOverviewQuery.data) {
      return [addressOverviewQuery.data];
    }
    return searchResult?.items ?? [];
  }, [contractQueryAddress, addressOverviewQuery.data, searchResult?.items]);

  const hiddenCount = useMemo(() => {
    if (contractQueryAddress) {
      return 0;
    }
    return searchResult?.hiddenCount ?? 0;
  }, [contractQueryAddress, searchResult?.hiddenCount]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      if (value.contractAddress) {
        if (!selectedContract || selectedContract.address !== value.contractAddress) {
          setSelectedContract((prev) =>
            prev && prev.address === value.contractAddress ? prev : null
          );
        }
      } else {
        setSelectedContract(null);
      }
      if (value.allSelected) {
        setAllSelected(true);
        setRanges([]);
        setMode("all");
      } else {
        setAllSelected(false);
        const canonical = toRangesFromSelection(value.selectedIds ?? EMPTY_SELECTION);
        setRanges(canonical);
        setMode(canonical.length > 1 ? "bucket" : "single");
      }
    }
  }, [value, selectedContract]);

  useEffect(() => {
    const formatted = formatCanonical(ranges);
    setTextValue(formatted);
  }, [ranges]);

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    primeContractCache(suggestion, chain);
    const overview = mapSuggestionToOverview(suggestion);
    setSelectedContract(overview);
    onContractChange?.(overview);
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
    setRanges([]);
    setAllSelected(false);
    setMode("single");
    setUnsafeCount(0);
    emitChange(overview, [], false);
  };

  const handleToggleSpam = () => {
    setHideSpam((prev) => !prev);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => Math.min(prev + 1, suggestionList.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      if (isOpen && suggestionList[activeIndex]) {
        event.preventDefault();
        handleSelectSuggestion(suggestionList[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setIsOpen(true);
    setActiveIndex(0);
  };

  const addTokenIds = (ids: TokenIdBigInt[]) => {
    if (!ids.length) {
      return;
    }
    const combined = fromCanonicalRanges(ranges);
    const merged = mergeAndSort([...combined, ...ids]);
    const canonical = toCanonicalRanges(merged);
    setRanges(canonical);
    setMode(canonical.length > 1 ? "bucket" : "single");
    setAllSelected(false);
    setParseErrors([]);
    setUnsafeCount(0);
    if (selectedContract) {
      emitChange(selectedContract, canonical, false);
    }
  };

  const handleAddSingle = (inputValue: string) => {
    if (!inputValue.trim()) {
      return;
    }
    try {
      const parsed = parseTokenExpressionToBigints(inputValue.trim());
      if (parsed.length > 0) {
        addTokenIds([parsed[0]]);
      }
    } catch (error) {
      if (Array.isArray(error)) {
        setParseErrors(error);
      }
    }
  };

  const handleAddBucket = (inputValue: string) => {
    if (!inputValue.trim()) {
      return;
    }
    try {
      const parsed = parseTokenExpressionToBigints(inputValue.trim());
      addTokenIds(parsed);
    } catch (error) {
      if (Array.isArray(error)) {
        setParseErrors(error);
      }
    }
  };

  const handleRemoveToken = (tokenId: bigint) => {
    const filtered = fromCanonicalRanges(ranges).filter((id) => id !== tokenId);
    const canonical = toCanonicalRanges(filtered);
    setRanges(canonical);
    setAllSelected(false);
    if (selectedContract) {
      emitChange(selectedContract, canonical, false);
    }
  };

  const handleClearContract = () => {
    setSelectedContract(null);
    setRanges([]);
    setAllSelected(false);
    onContractChange?.(null);
    onChange(null);
    setQuery("");
    setMode("single");
    setUnsafeCount(0);
    inputRef.current?.focus();
  };

  const handleModeChange = (nextMode: PickerMode) => {
    setMode(nextMode);
    if (nextMode === "all") {
      setAllSelected(true);
      setRanges([]);
      if (selectedContract) {
        emitChange(selectedContract, [], true);
      }
    } else {
      setAllSelected(false);
      if (selectedContract) {
        emitChange(selectedContract, ranges, false);
      }
    }
  };

  const handleApplyText = () => {
    try {
      const parsed = parseTokenExpressionToBigints(textValue);
      const canonical = toCanonicalRanges(mergeAndSort(parsed));
      setRanges(canonical);
      setParseErrors([]);
      setAllSelected(false);
      if (selectedContract) {
        emitChange(selectedContract, canonical, false);
      }
    } catch (error) {
      if (Array.isArray(error)) {
        setParseErrors(error);
      }
    }
  };

  const emitChange = (
    contract: ContractOverview,
    canonicalRanges: TokenRange[],
    isAll: boolean
  ) => {
    if (!contract) {
      return;
    }
    const selectionIds = isAll
      ? []
      : fromCanonicalRanges(canonicalRanges);
    if (!selectionIds.length && !isAll) {
      const payload: NftPickerSelection = {
        contractAddress: contract.address,
        outputMode,
        tokenIds: [],
        tokenIdsRaw: [],
      } as NftPickerSelection;
      onChange(payload);
      return;
    }
    if (outputMode === "number") {
      const { numbers, unsafeCount: unsafe } = tryToNumberArray(selectionIds);
      setUnsafeCount(unsafe);
      if (unsafe > 0) {
        return;
      }
      const payload: NftPickerSelection = {
        contractAddress: contract.address,
        outputMode: "number",
        tokenIds: numbers,
        tokenIdsRaw: selectionIds,
      };
      onChange(payload);
    } else {
      const decimalIds = selectionIds.map((id) => id.toString(10));
      const payload: NftPickerSelection = {
        contractAddress: contract.address,
        outputMode: "bigint",
        tokenIds: decimalIds,
        tokenIdsRaw: selectionIds,
      };
      if (selectionIds.some((id) => id > MAX_SAFE)) {
        console.warn(
          "NftPicker: emitting bigint payload because some token IDs exceed MAX_SAFE_INTEGER"
        );
      }
      onChange(payload);
    }
  };

  useEffect(() => {
    if (selectedContract && mode !== "all") {
      emitChange(selectedContract, ranges, false);
    }
  }, [selectedContract, ranges, mode]);

  const activeSuggestionId = isOpen && suggestionList[activeIndex]
    ? `nft-suggestion-${activeIndex}`
    : undefined;

  return (
    <div className={clsx("tw-@container tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4", className)}>
      <div className="tw-flex tw-flex-col tw-gap-2">
        <label className="tw-text-sm tw-font-semibold tw-text-iron-200">
          Select collection
        </label>
        <div className="tw-relative">
          <input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="nft-picker-suggest-list"
            aria-activedescendant={activeSuggestionId}
            className="tw-w-full tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-[0.625rem] tw-text-sm tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
          />
          {suggestionList.length > 0 && (
            <NftSuggestList
              items={suggestionList}
              activeIndex={activeIndex}
              isOpen={isOpen}
              hiddenCount={hiddenCount}
              hideSpam={hideSpam}
              onToggleSpam={handleToggleSpam}
              onHover={setActiveIndex}
              onSelect={handleSelectSuggestion}
            />
          )}
        </div>
      </div>

      {selectedContract && (
        <NftContractHeader
          contract={selectedContract}
          onChange={() => inputRef.current?.focus()}
          onClear={handleClearContract}
        />
      )}

      {selectedContract && (
        <div className="tw-flex tw-flex-col tw-gap-3">
          <div className="tw-flex tw-gap-2" role="tablist" aria-label="Selection mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "single"}
              className={clsx(
                "tw-flex-1 tw-rounded-md tw-py-2 tw-text-sm",
                mode === "single"
                  ? "tw-bg-primary-500 tw-font-semibold tw-text-black"
                  : "tw-bg-iron-800 tw-text-iron-200"
              )}
              onClick={() => handleModeChange("single")}
            >
              Single
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "bucket"}
              className={clsx(
                "tw-flex-1 tw-rounded-md tw-py-2 tw-text-sm",
                mode === "bucket"
                  ? "tw-bg-primary-500 tw-font-semibold tw-text-black"
                  : "tw-bg-iron-800 tw-text-iron-200"
              )}
              onClick={() => handleModeChange("bucket")}
              disabled={!allowRanges}
            >
              Bucket
            </button>
            {allowAll && (
              <button
                type="button"
                role="tab"
                aria-selected={mode === "all"}
                className={clsx(
                  "tw-flex-1 tw-rounded-md tw-py-2 tw-text-sm",
                  mode === "all"
                    ? "tw-bg-primary-500 tw-font-semibold tw-text-black"
                    : "tw-bg-iron-800 tw-text-iron-200"
                )}
                onClick={() => handleModeChange("all")}
              >
                All
              </button>
            )}
          </div>

          {mode === "single" && (
            <SingleModeForm onAdd={handleAddSingle} />
          )}

          {mode === "bucket" && (
            <BucketModeForm
              onAdd={handleAddBucket}
              ranges={ranges}
              textValue={textValue}
              parseErrors={parseErrors}
              onTextChange={setTextValue}
              onApply={handleApplyText}
              onCancel={() => setTextValue(formatCanonical(ranges))}
            />
          )}

          {mode === "all" && (
            <div className="tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900 tw-p-3 tw-text-sm tw-text-iron-200">
              All tokens in this contract are selected.
            </div>
          )}

          {mode !== "all" && (
            <NftTokenList
              contractAddress={selectedContract.address}
              chain={chain}
              ranges={ranges}
              overscan={overscan}
              renderTokenExtra={renderTokenExtra}
              onRemove={handleRemoveToken}
            />
          )}

          {unsafeCount > 0 && outputMode === "number" && (
            <div className="tw-text-xs tw-text-amber-300">
              Some token IDs exceed Number.MAX_SAFE_INTEGER. Switch to bigint output or remove those IDs.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type SingleModeFormProps = {
  readonly onAdd: (value: string) => void;
};

function SingleModeForm({ onAdd }: SingleModeFormProps) {
  const [value, setValue] = useState("");
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAdd(value);
    setValue("");
  };
  return (
    <form className="tw-flex tw-gap-2" onSubmit={handleSubmit}>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="tw-flex-1 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
        placeholder="Token ID"
      />
      <button
        type="submit"
        className="tw-rounded-md tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-black hover:tw-bg-primary-400"
      >
        Add
      </button>
    </form>
  );
}

type BucketModeFormProps = {
  readonly onAdd: (value: string) => void;
  readonly ranges: TokenRange[];
  readonly textValue: string;
  readonly parseErrors: ParseError[];
  readonly onTextChange: (value: string) => void;
  readonly onApply: () => void;
  readonly onCancel: () => void;
};

function BucketModeForm({
  onAdd,
  ranges,
  textValue,
  parseErrors,
  onTextChange,
  onApply,
  onCancel,
}: BucketModeFormProps) {
  const [inputValue, setInputValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAdd(inputValue);
    setInputValue("");
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <form className="tw-flex tw-gap-2" onSubmit={handleSubmit}>
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          className="tw-flex-1 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
          placeholder="Add IDs or ranges (e.g. 1,2,5-12)"
        />
        <button
          type="submit"
          className="tw-rounded-md tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-black hover:tw-bg-primary-400"
        >
          Add
        </button>
      </form>
      <NftEditRanges
        ranges={ranges}
        isEditing={isEditing}
        textValue={textValue}
        parseErrors={parseErrors}
        onToggle={() => setIsEditing((prev) => !prev)}
        onTextChange={onTextChange}
        onApply={() => {
          onApply();
          setIsEditing(false);
        }}
        onCancel={() => {
          onCancel();
          setIsEditing(false);
        }}
      />
    </div>
  );
}
