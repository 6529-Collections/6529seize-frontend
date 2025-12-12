
"use client";

import { useRef, useId, useMemo, useEffect } from "react";
import clsx from "clsx";

import type { NftPickerProps, Suggestion, SupportedChain } from "./types";
import { mapSuggestionToOverview } from "./utils/mappers";
import { formatCanonical, parseTokenExpressionToRanges } from "./utils";
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

function ensureChain(value?: string): SupportedChain {
  return (value as any) ?? DEFAULT_CHAIN;
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
    debounceMs = DEFAULT_DEBOUNCE,
    overscan = DEFAULT_OVERSCAN,
    placeholder = "Search by collection name or paste contract address…",
    className,
    renderTokenExtra,
    variant = "card",
  } = props;

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
    unsafeCount,
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
    setUnsafeCount,
  } = useNftSelection({
    value,
    defaultValue,
    onChange,
    onContractChange,
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
    setUnsafeCount(0);

    setTokenInput("");
    setIsEditingText(false);
  };

  const handleClearContract = () => {
    clearContract();
    setQuery("");
    setTokenInput("");
    setParseErrors([]);
    setIsEditingText(false);
    inputRef.current?.focus();
  };

  const handleSelectAll = () => {
    selectAll();
    setIsEditingText(false);
    setTokenInput("");
    setTimeout(() => {
      deselectButtonRef.current?.focus();
    }, 0);
  };

  const handleDeselectAll = () => {
    deselectAll();
    setIsEditingText(false);
    setTokenInput("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSubmitTokens = () => {
    if (!canAddTokens) {
      return;
    }
    addTokenRanges(tokenPreview.ranges);
    setTokenInput("");
    setParseErrors([]);
  };

  const handleApplyText = () => {
    try {
      const canonical = parseTokenExpressionToRanges(textValue);
      setSelectionFromText(canonical);
      setParseErrors([]);
      setIsEditingText(false);
    } catch (error) {
      if (Array.isArray(error)) {
        setParseErrors(error as any);
      }
    }
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

  const activeSuggestionId = isOpen && suggestionList[activeIndex]
    ? `nft - suggestion - ${activeIndex} `
    : undefined;

  const wrapperClassName = clsx(
    variant === "card"
      ? "tw-@container tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-4"
      : "tw-@container tw-flex tw-flex-col tw-gap-4",
    className
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickAway(wrapperRef, () => {
    setIsOpen(false);
  });

  return (
    <div className={wrapperClassName} ref={wrapperRef}>
      {!selectedContract && (
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
                <NftPickerInput
                  tokenInput={tokenInput}
                  tokenInputPlaceholder={
                    ranges.length > 0
                      ? "Add more tokens or ranges..."
                      : "e.g., 1, 5, 30-55, 89, 98-100"
                  }
                  tokenInputDisabled={allSelected || !selectedContract}
                  helperMessageId={helperMessageId}
                  variant={variant}
                  onTokenInputChange={(e) => setTokenInput(e.target.value)}
                  onTokenInputKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmitTokens();
                    }
                  }}
                />

                <NftPickerActions
                  canAddTokens={canAddTokens}
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
              <NftPickerStatus helperState={helperState} helperMessageId={helperMessageId} />

              <NftEditRanges
                ranges={ranges}
                isEditing={isEditingText}
                textValue={textValue}
                parseErrors={parseErrors}
                onToggle={() => setIsEditingText((prev) => !prev)}
                onTextChange={(val) => {
                  if (parseErrors.length) setParseErrors([]);
                  setTextValue(val);
                }}
                onApply={handleApplyText}
                onCancel={() => {
                  setTextValue(formatCanonical(ranges));
                  setParseErrors([]);
                  setIsEditingText(false);
                }}
                onClear={clearTokens}
              />

              {ranges.length > 0 ? (
                <NftTokenList
                  contractAddress={selectedContract.address}
                  chain={chain}
                  ranges={ranges}
                  overscan={overscan}
                  renderTokenExtra={renderTokenExtra}
                  onRemove={removeToken}
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
