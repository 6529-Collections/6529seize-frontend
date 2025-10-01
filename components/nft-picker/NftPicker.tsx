"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
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
  formatBigIntWithSeparators,
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
import { AllTokensSelectedCard } from "./AllTokensSelectedCard";

const DEFAULT_CHAIN: SupportedChain = "ethereum";
const DEFAULT_DEBOUNCE = 250;
const DEFAULT_OVERSCAN = 8;
const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);
const BIGINT_THOUSAND = BigInt(1000);

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
  const [ranges, setRanges] = useState<TokenRange[]>([]);
  const [textValue, setTextValue] = useState<string>("");
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [unsafeCount, setUnsafeCount] = useState<number>(0);
  const [selectedContract, setSelectedContract] = useState<ContractOverview | null>(null);
  const [allSelected, setAllSelected] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string>("");
  const [isEditingText, setIsEditingText] = useState(false);
  const previousRangesRef = useRef<TokenRange[] | null>(null);

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
  const deselectButtonRef = useRef<HTMLButtonElement>(null);
  const helperMessageId = useId();

  useEffect(() => {
    if (!value) {
      return;
    }
    if (value.contractAddress) {
      if (!selectedContract || selectedContract.address !== value.contractAddress) {
        setSelectedContract((prev) =>
          prev && prev.address === value.contractAddress ? prev : null
        );
      }
    } else {
      setSelectedContract(null);
    }
    const canonical = toRangesFromSelection(value.selectedIds ?? EMPTY_SELECTION);
    setRanges(canonical);
    if (value.allSelected) {
      setAllSelected(true);
      previousRangesRef.current = canonical;
    } else {
      setAllSelected(false);
      previousRangesRef.current = null;
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
    previousRangesRef.current = null;
    setUnsafeCount(0);
    setTokenInput("");
    setIsEditingText(false);
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

  const trimmedTokenInput = tokenInput.trim();

  const tokenPreview = useMemo(
    () => {
      if (!trimmedTokenInput) {
        return {
          tokens: [] as TokenSelection,
          ranges: [] as TokenRange[],
          canonical: "",
          errors: null as ParseError[] | null,
        };
      }

      if (!allowRanges && trimmedTokenInput.includes("-")) {
        return {
          tokens: [] as TokenSelection,
          ranges: [] as TokenRange[],
          canonical: "",
          errors: [
            {
              input: trimmedTokenInput,
              index: 0,
              length: Math.max(trimmedTokenInput.length, 1),
              message: "Ranges are disabled for this picker",
            },
          ],
        };
      }

      try {
        const parsed = parseTokenExpressionToBigints(trimmedTokenInput);
        const merged = mergeAndSort(parsed);
        const canonicalRanges = toCanonicalRanges(merged);
        return {
          tokens: merged,
          ranges: canonicalRanges,
          canonical: formatCanonical(canonicalRanges),
          errors: null as ParseError[] | null,
        };
      } catch (error) {
        if (Array.isArray(error)) {
          return {
            tokens: [] as TokenSelection,
            ranges: [] as TokenRange[],
            canonical: "",
            errors: error as ParseError[],
          };
        }
        return {
          tokens: [] as TokenSelection,
          ranges: [] as TokenRange[],
          canonical: "",
          errors: [
            {
              input: trimmedTokenInput,
              index: 0,
              length: Math.max(trimmedTokenInput.length, 1),
              message: "Unable to parse token input",
            },
          ],
        };
      }
    },
    [allowRanges, trimmedTokenInput]
  );

  const canAddTokens =
    !allSelected &&
    Boolean(trimmedTokenInput) &&
    !tokenPreview.errors &&
    tokenPreview.tokens.length > 0;

  const numberFormatter = useMemo(() => new Intl.NumberFormat("en-US"), []);

  const formatCount = useCallback(
    (value: bigint | number): string =>
      typeof value === "number"
        ? numberFormatter.format(value)
        : formatBigIntWithSeparators(value),
    [numberFormatter]
  );

  const contractTotalSupply = useMemo(() => {
    if (!selectedContract?.totalSupply) {
      return null;
    }
    try {
      return BigInt(selectedContract.totalSupply);
    } catch (error) {
      console.warn("NftPicker: unable to parse totalSupply", error);
      return null;
    }
  }, [selectedContract?.totalSupply]);

  const selectedTokenCount = useMemo(() => {
    return ranges.reduce(
      (total, range) => total + (range.end - range.start + BIGINT_ONE),
      BIGINT_ZERO
    );
  }, [ranges]);

  const hasSelectedTokens = selectedTokenCount > BIGINT_ZERO;

  const helperState = useMemo(() => {
    if (allSelected) {
      if (contractTotalSupply) {
        return {
          tone: "success" as const,
          text: `All ${formatCount(contractTotalSupply)} tokens selected. Deselect to add specific tokens.`,
        };
      }
      return {
        tone: "success" as const,
        text: "All tokens selected. Deselect to add specific tokens.",
      };
    }
    if (!trimmedTokenInput) {
      return {
        tone: "muted" as const,
        text: "Tip: Enter single tokens or ranges separated by commas.",
      };
    }
    if (tokenPreview.errors) {
      const [firstError] = tokenPreview.errors;
      const detail = firstError?.input ? ` (${firstError.input})` : "";
      return {
        tone: "error" as const,
        text: `${firstError?.message ?? "Invalid token input"}${detail}`,
      };
    }
    const countLabel = formatCount(tokenPreview.tokens.length);
    const canonical = tokenPreview.canonical || trimmedTokenInput;
    const plural = tokenPreview.tokens.length === 1 ? "token" : "tokens";
    return {
      tone: "success" as const,
      text: `Looks good: ${canonical} • Will add ${countLabel} ${plural}.`,
    };
  }, [allSelected, contractTotalSupply, formatCount, tokenPreview, trimmedTokenInput]);

  const helperClassName = clsx("tw-min-h-[1.25rem] tw-text-xs tw-font-medium", {
    "tw-text-emerald-300": helperState.tone === "success",
    "tw-text-red-300": helperState.tone === "error",
    "tw-text-iron-300": helperState.tone === "muted",
  });

  const tokenInputPlaceholder = hasSelectedTokens
    ? "Add more tokens or ranges..."
    : "e.g., 1, 5, 30-55, 89, 98-100";

  const tokenInputDisabled = allSelected || !selectedContract;

  const selectAllLabel = contractTotalSupply
    ? `Select All (${formatCount(contractTotalSupply)})`
    : "Select All";

  const selectAllButtonClassName =
    "tw-flex tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-800 tw-px-4 tw-py-2.5 tw-font-medium tw-text-iron-300 tw-transition-colors hover:tw-bg-iron-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500 focus:tw-ring-offset-2 focus:tw-ring-offset-iron-900 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-800 disabled:tw-text-iron-500 sm:tw-w-auto";

  const handleTokenInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTokenInput(event.target.value);
  };

  const addTokenIds = (ids: TokenIdBigInt[]) => {
    if (!ids.length) {
      return;
    }
    const combined = fromCanonicalRanges(ranges);
    const merged = mergeAndSort([...combined, ...ids]);
    const canonical = toCanonicalRanges(merged);
    setRanges(canonical);
    setAllSelected(false);
    setParseErrors([]);
    setUnsafeCount(0);
    previousRangesRef.current = null;
    if (selectedContract) {
      emitChange(selectedContract, canonical, false);
    }
  };

  const handleAddTokens = (ids: TokenIdBigInt[]) => {
    if (!ids.length) {
      return;
    }
    addTokenIds(ids);
    setTokenInput("");
    setParseErrors([]);
  };

  const handleSubmitTokens = () => {
    if (!canAddTokens) {
      return;
    }
    handleAddTokens(tokenPreview.tokens);
  };

  const handleTokenInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmitTokens();
    }
  };

  const handleTokenFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSubmitTokens();
  };

  const handleEditTextChange = (value: string) => {
    if (parseErrors.length) {
      setParseErrors([]);
    }
    setTextValue(value);
  };

  const handleClearContract = () => {
    setSelectedContract(null);
    setRanges([]);
    setAllSelected(false);
    onContractChange?.(null);
    onChange(null);
    setQuery("");
    setUnsafeCount(0);
    setTokenInput("");
    setParseErrors([]);
    previousRangesRef.current = null;
    setIsEditingText(false);
    inputRef.current?.focus();
  };

  const handleSelectAll = () => {
    if (!selectedContract || allSelected) {
      return;
    }
    let confirmed = true;
    if (contractTotalSupply && contractTotalSupply > BIGINT_THOUSAND) {
      const formatted = formatCount(contractTotalSupply);
      confirmed = window.confirm(`Select all ${formatted} tokens?`);
    }
    if (!confirmed) {
      return;
    }
    previousRangesRef.current = ranges;
    setAllSelected(true);
    setIsEditingText(false);
    setTokenInput("");
    emitChange(selectedContract, ranges, true);
    setTimeout(() => {
      deselectButtonRef.current?.focus();
    }, 0);
  };

  const handleDeselectAll = () => {
    if (!selectedContract) {
      return;
    }
    const previous = previousRangesRef.current;
    setAllSelected(false);
    setIsEditingText(false);
    setTokenInput("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    if (previous && previous.length) {
      setRanges(previous);
      previousRangesRef.current = null;
      emitChange(selectedContract, previous, false);
      return;
    }
    emitChange(selectedContract, ranges, false);
  };

  const handleClearTokens = () => {
    if (!selectedContract) {
      return;
    }
    setRanges([]);
    setAllSelected(false);
    setTokenInput("");
    setParseErrors([]);
    setUnsafeCount(0);
    setIsEditingText(false);
    previousRangesRef.current = null;
    emitChange(selectedContract, [], false);
  };

  const handleRemoveToken = (tokenId: bigint) => {
    const filtered = fromCanonicalRanges(ranges).filter((id) => id !== tokenId);
    const canonical = toCanonicalRanges(filtered);
    setRanges(canonical);
    setAllSelected(false);
    previousRangesRef.current = null;
    if (selectedContract) {
      emitChange(selectedContract, canonical, false);
    }
  };

  const handleApplyText = () => {
    try {
      const parsed = parseTokenExpressionToBigints(textValue);
      const canonical = toCanonicalRanges(mergeAndSort(parsed));
      setRanges(canonical);
      setParseErrors([]);
      setAllSelected(false);
      previousRangesRef.current = null;
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
    if (!selectedContract) {
      return;
    }
    emitChange(selectedContract, ranges, allSelected);
  }, [selectedContract, ranges, allSelected]);

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
          <form className="tw-flex tw-flex-col tw-gap-3" onSubmit={handleTokenFormSubmit}>
            {allSelected ? (
              <AllTokensSelectedCard
                onDeselect={handleDeselectAll}
                buttonRef={deselectButtonRef}
              />
            ) : (
              <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-start">
                <input
                  value={tokenInput}
                  onChange={handleTokenInputChange}
                  onKeyDown={handleTokenInputKeyDown}
                  placeholder={tokenInputPlaceholder}
                  disabled={tokenInputDisabled}
                  className="tw-flex-1 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-100 tw-transition disabled:tw-cursor-not-allowed disabled:tw-bg-iron-900 disabled:tw-text-iron-600 focus:tw-border-primary-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-500"
                  aria-label="Add token IDs or ranges"
                  aria-describedby={helperMessageId}
                />

                <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center">
                  <button
                    type="submit"
                    className="tw-inline-flex tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-bg-primary-600 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-bg-primary-700 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-800 disabled:tw-text-iron-500 sm:tw-w-auto"
                    disabled={!canAddTokens}
                  >
                    Add
                  </button>
                  {allowAll && (
                    <button
                      type="button"
                      className={selectAllButtonClassName}
                      onClick={handleSelectAll}
                      disabled={!selectedContract}
                      title={selectAllLabel}
                    >
                      <svg
                        className="tw-h-5 tw-w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                      </svg>
                      <span>{selectAllLabel}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>

          {allSelected ? (
            <p className="tw-text-sm tw-text-iron-400">All tokens in this contract are selected.</p>
          ) : (
            <>
              <div id={helperMessageId} className={helperClassName} aria-live="polite" role="status">
                {helperState.text}
              </div>

              <NftEditRanges
                ranges={ranges}
                isEditing={isEditingText}
                textValue={textValue}
                parseErrors={parseErrors}
                onToggle={() => setIsEditingText((prev) => !prev)}
                onTextChange={handleEditTextChange}
                onApply={() => {
                  handleApplyText();
                  setIsEditingText(false);
                }}
                onCancel={() => {
                  setTextValue(formatCanonical(ranges));
                  setParseErrors([]);
                  setIsEditingText(false);
                }}
                onClear={handleClearTokens}
              />

              {hasSelectedTokens ? (
                <NftTokenList
                  contractAddress={selectedContract.address}
                  chain={chain}
                  ranges={ranges}
                  overscan={overscan}
                  renderTokenExtra={renderTokenExtra}
                  onRemove={handleRemoveToken}
                />
              ) : (
                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-rounded-lg tw-border tw-border-dashed tw-border-iron-700 tw-bg-iron-950 tw-p-6 tw-text-center">
                  <span className="tw-text-sm tw-font-semibold tw-text-iron-100">No tokens selected</span>
                  <span className="tw-max-w-xs tw-text-xs tw-text-iron-300">
                    Add tokens using the input above or choose Select All to include the entire collection.
                  </span>
                </div>
              )}
            </>
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
