"use client";

import { useRef, useId, useMemo, useEffect, useState } from "react";
import clsx from "clsx";

import type {
  NftPickerProps,
  ParseError,
  Suggestion,
  SupportedChain,
} from "./types";
import { mapSuggestionToOverview } from "./utils/mappers";
import {
  BIGINT_ONE,
  formatCanonical,
  MAX_SAFE,
  mergeCanonicalRanges,
  parseTokenExpressionToRanges,
} from "./utils";
import { useNftSearch, useNftSelection, useNftTokenInput } from "./hooks";
import { useClickAway } from "react-use";
import {
  NftContractHeader,
  NftPickerSearch,
  NftPickerInput,
  NftPickerStatus,
  NftPickerActions,
  NftEditRanges,
  NftTokenList,
  AllTokensSelectedCard,
} from "./subcomponents";

const DEFAULT_DEBOUNCE = 250;
const DEFAULT_OVERSCAN = 8;
const DEFAULT_CHAIN: SupportedChain = "ethereum";
type MaxSelectedCountValidationSource = "add-input" | "text-editor";

function ensureChain(value?: string): SupportedChain {
  return (value as SupportedChain | undefined) ?? DEFAULT_CHAIN;
}

function countRanges(
  canonicalRanges: readonly { start: bigint; end: bigint }[]
): bigint {
  return canonicalRanges.reduce(
    (total, range) => total + (range.end - range.start + BIGINT_ONE),
    BigInt(0)
  );
}

function countUnsafeTokenIds(
  canonicalRanges: readonly { start: bigint; end: bigint }[]
): number {
  let total = BigInt(0);
  for (const range of canonicalRanges) {
    if (range.end <= MAX_SAFE) {
      continue;
    }
    const firstUnsafe =
      range.start > MAX_SAFE ? range.start : MAX_SAFE + BIGINT_ONE;
    total += range.end - firstUnsafe + BIGINT_ONE;
    if (total > MAX_SAFE) {
      return Number.MAX_SAFE_INTEGER;
    }
  }
  return Number(total);
}

export function NftPicker(props: Readonly<NftPickerProps>) {
  const {
    value,
    defaultValue,
    onChange,
    onContractChange,
    chain: chainProp,
    outputMode = "number",
    hideSpam: hideSpamProp = true,
    allowAll = true,
    allowRanges = true,
    fixedContract,
    maxSelectedCount,
    maxSelectedCountMessage,
    debounceMs = DEFAULT_DEBOUNCE,
    overscan = DEFAULT_OVERSCAN,
    placeholder = "Search by collection name or paste contract address…",
    className,
    renderTokenExtra,
    variant = "card",
  } = props;
  const hasFixedContract = fixedContract !== undefined;

  const valueChain = value?.chain;
  const defaultChain = defaultValue?.chain;
  const chain = useMemo(
    () => ensureChain(valueChain ?? defaultChain ?? chainProp),
    [valueChain, defaultChain, chainProp]
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const deselectButtonRef = useRef<HTMLButtonElement>(null);
  const collectionInputId = useId();
  const helperMessageId = useId();

  const {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    hideSpam,
    suggestionList,
    hiddenCount,
    handleToggleSpam,
    resetSearch,
    primeContractCache,
    isLoading,
  } = useNftSearch({ chain, debounceMs, hideSpamProp });

  const {
    ranges,
    selectedContract,
    allSelected,
    emitContractChange,
    addTokenRanges,
    removeToken,
    clearTokens,
    selectAll,
    deselectAll,
    clearContract,
    setSelectionFromText,
    setSelectedContract,
    setRanges,
    setAllSelected,
  } = useNftSelection({
    value,
    defaultValue,
    onChange,
    onContractChange,
    fixedContract,
    outputMode,
  });

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

  const {
    tokenInput,
    setTokenInput,
    isEditingText,
    setIsEditingText,
    textValue,
    setTextValue,
    parseErrors,
    setParseErrors,
    tokenPreview,
    canAddTokens,
    helperState,
  } = useNftTokenInput({
    allowRanges,
    allSelected,
    contractTotalSupply,
  });
  const [addTokenInputError, setAddTokenInputError] = useState<string | null>(
    null
  );

  const selectedCount = useMemo(() => countRanges(ranges), [ranges]);
  const unsafeCount = useMemo(
    () => (allSelected ? 0 : countUnsafeTokenIds(ranges)),
    [allSelected, ranges]
  );
  const normalizedMaxSelectedCount =
    typeof maxSelectedCount === "number" && Number.isFinite(maxSelectedCount)
      ? Math.max(0, Math.trunc(maxSelectedCount))
      : null;
  const maxSelectedCountBigInt =
    normalizedMaxSelectedCount === null
      ? null
      : BigInt(normalizedMaxSelectedCount);
  const maxSelectionReached =
    maxSelectedCountBigInt !== null && selectedCount >= maxSelectedCountBigInt;
  const maxSelectionExceeded =
    maxSelectedCountBigInt !== null && selectedCount > maxSelectedCountBigInt;

  const maxSelectionMessage =
    maxSelectedCountMessage ??
    (normalizedMaxSelectedCount !== null
      ? `Select fewer than ${new Intl.NumberFormat("en-US").format(
          normalizedMaxSelectedCount + 1
        )} tokens.`
      : "Selection limit reached.");

  const validateMaxSelectedCount = (
    canonicalRanges: typeof ranges,
    input: string,
    source: MaxSelectedCountValidationSource
  ): boolean => {
    if (maxSelectedCountBigInt === null) {
      return true;
    }
    const nextCount = countRanges(canonicalRanges);
    if (nextCount <= maxSelectedCountBigInt) {
      return true;
    }
    const error = {
      input,
      index: 0,
      length: Math.max(input.length, 1),
      message: maxSelectionMessage,
    };
    if (source === "text-editor") {
      setParseErrors([error]);
      setAddTokenInputError(null);
    } else {
      setAddTokenInputError(maxSelectionMessage);
    }
    return false;
  };

  let cappedHelperState = helperState;
  if (addTokenInputError !== null) {
    cappedHelperState = {
      tone: "error" as const,
      text: addTokenInputError,
    } as const;
  } else if (maxSelectionReached && !allSelected) {
    const maxSelectionTone = maxSelectionExceeded ? "error" : "muted";
    cappedHelperState = {
      tone: maxSelectionTone,
      text: maxSelectionMessage,
    } as const;
  }

  // Sync textValue with ranges whenever ranges change
  useEffect(() => {
    setTextValue(formatCanonical(ranges));
  }, [ranges, setTextValue]);

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    primeContractCache(suggestion, chain);
    const overview = mapSuggestionToOverview(suggestion);
    setSelectedContract(overview);
    emitContractChange(overview);

    resetSearch();
    setRanges([]);
    setAllSelected(false);

    setTokenInput("");
    setAddTokenInputError(null);
    setIsEditingText(false);
  };

  const handleClearContract = () => {
    if (hasFixedContract) {
      return;
    }
    clearContract();
    setQuery("");
    setTokenInput("");
    setAddTokenInputError(null);
    setParseErrors([]);
    setIsEditingText(false);
    inputRef.current?.focus();
  };

  const handleSelectAll = () => {
    if (
      maxSelectedCountBigInt !== null &&
      (contractTotalSupply === null ||
        contractTotalSupply < BigInt(0) ||
        contractTotalSupply > maxSelectedCountBigInt)
    ) {
      setAddTokenInputError(maxSelectionMessage);
      setParseErrors([]);
      return;
    }
    selectAll();
    setAddTokenInputError(null);
    setIsEditingText(false);
    setTokenInput("");
    setTimeout(() => {
      deselectButtonRef.current?.focus();
    }, 0);
  };

  const handleDeselectAll = () => {
    deselectAll();
    setAddTokenInputError(null);
    setIsEditingText(false);
    setTokenInput("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSubmitTokens = () => {
    if (!canAddTokens || maxSelectionReached) {
      return;
    }
    const nextRanges = mergeCanonicalRanges(ranges, tokenPreview.ranges);
    if (!validateMaxSelectedCount(nextRanges, tokenInput.trim(), "add-input")) {
      return;
    }
    const result = addTokenRanges(tokenPreview.ranges);
    if (result && "error" in result) {
      setAddTokenInputError(result.error.message);
      setParseErrors([]);
      return;
    }
    setTokenInput("");
    setAddTokenInputError(null);
    setParseErrors([]);
  };

  const handleApplyText = () => {
    setAddTokenInputError(null);
    try {
      const canonical = parseTokenExpressionToRanges(textValue);
      if (
        !validateMaxSelectedCount(canonical, textValue.trim(), "text-editor")
      ) {
        return;
      }
      setSelectionFromText(canonical);
      setParseErrors([]);
      setIsEditingText(false);
    } catch (error) {
      if (Array.isArray(error)) {
        setParseErrors(error as ParseError[]);
      }
    }
  };

  const handleTokenInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (addTokenInputError !== null) {
      setAddTokenInputError(null);
    }
    setTokenInput(event.target.value);
  };

  const handleClearTokens = () => {
    setAddTokenInputError(null);
    clearTokens();
  };

  const handleRemoveToken = (tokenId: bigint) => {
    setAddTokenInputError(null);
    removeToken(tokenId);
  };

  // We need to handle input key down for search
  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
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

  const handleTokenFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSubmitTokens();
  };

  const activeSuggestionId =
    isOpen && suggestionList[activeIndex]
      ? `nft-suggestion-${activeIndex}`
      : undefined;

  const wrapperClassName = clsx(
    variant === "card"
      ? "tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-@container"
      : "tw-flex tw-flex-col tw-gap-4 tw-@container",
    className
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickAway(wrapperRef, () => {
    setIsOpen(false);
  });

  return (
    <div className={wrapperClassName} ref={wrapperRef}>
      {!selectedContract && !hasFixedContract && (
        <NftPickerSearch
          query={query}
          isOpen={isOpen}
          activeIndex={activeIndex}
          suggestionList={suggestionList}
          hiddenCount={hiddenCount}
          hideSpam={hideSpam}
          placeholder={placeholder}
          variant={variant}
          inputRef={inputRef}
          collectionInputId={collectionInputId}
          activeSuggestionId={activeSuggestionId}
          onInputChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onInputKeyDown={handleInputKeyDown}
          onInputFocus={() => setIsOpen(true)}
          onToggleSpam={handleToggleSpam}
          onHoverSuggestion={setActiveIndex}
          onSelectSuggestion={handleSelectSuggestion}
          loading={isLoading}
        />
      )}

      {selectedContract && (
        <NftContractHeader
          contract={selectedContract}
          onClear={handleClearContract}
          clearable={!hasFixedContract}
        />
      )}

      {selectedContract && (
        <div className="tw-flex tw-flex-col tw-gap-3">
          <form
            className="tw-flex tw-flex-col tw-gap-3"
            onSubmit={handleTokenFormSubmit}
          >
            {allSelected ? (
              <AllTokensSelectedCard
                onDeselect={handleDeselectAll}
                buttonRef={deselectButtonRef}
              />
            ) : (
              <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-start">
                <NftPickerInput
                  tokenInput={tokenInput}
                  tokenInputPlaceholder={
                    ranges.length > 0
                      ? "Add more tokens or ranges..."
                      : "e.g., 1, 5, 30-55, 89, 98-100"
                  }
                  tokenInputDisabled={maxSelectionReached}
                  helperMessageId={helperMessageId}
                  variant={variant}
                  onTokenInputChange={handleTokenInputChange}
                  onTokenInputKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmitTokens();
                    }
                  }}
                />

                <NftPickerActions
                  canAddTokens={canAddTokens && !maxSelectionReached}
                  allowAll={allowAll}
                  selectedContract={!!selectedContract}
                  selectAllLabel={
                    contractTotalSupply
                      ? `Select All(${new Intl.NumberFormat("en-US").format(contractTotalSupply)})`
                      : "Select All"
                  }
                  onSelectAll={handleSelectAll}
                  onAdd={handleSubmitTokens}
                />
              </div>
            )}
          </form>

          {allSelected ? null : (
            <>
              <NftPickerStatus
                helperState={cappedHelperState}
                helperMessageId={helperMessageId}
              />

              <NftEditRanges
                ranges={ranges}
                isEditing={isEditingText}
                textValue={textValue}
                parseErrors={parseErrors}
                allowAll={allowAll}
                onToggle={() => setIsEditingText((prev) => !prev)}
                onTextChange={(val) => {
                  if (parseErrors.length) setParseErrors([]);
                  if (addTokenInputError !== null) setAddTokenInputError(null);
                  setTextValue(val);
                }}
                onApply={handleApplyText}
                onCancel={() => {
                  setTextValue(formatCanonical(ranges));
                  setParseErrors([]);
                  setAddTokenInputError(null);
                  setIsEditingText(false);
                }}
                onClear={handleClearTokens}
              />

              {ranges.length > 0 ? (
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
                  <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
                    No tokens selected
                  </span>
                  <span className="tw-max-w-xs tw-text-xs tw-text-iron-300">
                    {allowAll
                      ? "Add tokens using the input above or choose Select All to include the entire collection."
                      : "Add tokens using the input above."}
                  </span>
                </div>
              )}
            </>
          )}

          {unsafeCount > 0 && outputMode === "number" && (
            <div className="tw-text-xs tw-text-amber-300">
              Some token IDs exceed Number.MAX_SAFE_INTEGER. Switch to bigint
              output or remove those IDs.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
