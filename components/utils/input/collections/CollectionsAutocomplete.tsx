"use client";

import { classNames } from "@/helpers/Helpers";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useClickAway } from "react-use";

export interface CollectionsAutocompleteOption {
  readonly id: string;
  readonly name: string;
  readonly tokenCount?: number | undefined;
}

export interface CollectionsAutocompleteProps {
  readonly options: ReadonlyArray<CollectionsAutocompleteOption>;
  readonly value: ReadonlyArray<string>;
  readonly onChange: (next: string[]) => void;
  readonly disabled?: boolean | undefined;
  readonly placeholder?: string | undefined;
  readonly noResultsText?: string | undefined;
}

type KeyboardNavigationKey =
  | "ArrowDown"
  | "ArrowUp"
  | "Enter"
  | "Escape"
  | "Backspace";

type KeyHandler = (event: KeyboardEvent<HTMLInputElement>) => void;

const ACTIVATION_KEYS = new Set(["Enter", " ", "Spacebar"]);

export default function CollectionsAutocomplete({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = "Search collections…",
  noResultsText = "No collections found.",
}: Readonly<CollectionsAutocompleteProps>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const inputId = useId();
  const nativeSelectId = useId();
  const nativeSelectDescriptionId = useId();

  useClickAway(containerRef, () => setOpen(false));

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  const optionMap = useMemo(() => {
    const map = new Map<string, CollectionsAutocompleteOption>();
    for (const option of options) {
      map.set(option.id, option);
    }
    return map;
  }, [options]);

  const selectedOptions = useMemo(
    () =>
      value.map((id) => {
        const option = optionMap.get(id);
        return option ?? { id, name: id };
      }),
    [optionMap, value]
  );
  const selectionPlaceholder = selectedOptions.length
    ? "Add another collection…"
    : placeholder;

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return options.filter((option) => {
      if (selectedSet.has(option.id)) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const idMatch = option.id.toLowerCase().includes(normalizedQuery);
      const nameMatch = option.name.toLowerCase().includes(normalizedQuery);
      return idMatch || nameMatch;
    });
  }, [options, query, selectedSet]);

  useEffect(() => {
    if (!open) {
      setHighlightedIndex(0);
      return;
    }
    if (highlightedIndex >= filteredOptions.length) {
      setHighlightedIndex(
        filteredOptions.length > 0 ? filteredOptions.length - 1 : 0
      );
    }
  }, [filteredOptions.length, highlightedIndex, open]);

  const openDropdown = useCallback(() => {
    if (!disabled) {
      setOpen(true);
    }
  }, [disabled]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleContainerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLFieldSetElement>) => {
      if (disabled || !ACTIVATION_KEYS.has(event.key)) {
        return;
      }
      event.preventDefault();
      focusInput();
    },
    [disabled, focusInput]
  );

  const handleInputFocus = useCallback(() => {
    openDropdown();
  }, [openDropdown]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      if (!open) {
        openDropdown();
      }
    },
    [open, openDropdown]
  );

  const handleSelect = useCallback(
    (option: CollectionsAutocompleteOption) => {
      if (disabled || selectedSet.has(option.id)) {
        return;
      }
      const next = [...value, option.id];
      onChange(next);
      setQuery("");
      setOpen(false);
      setHighlightedIndex(0);
      requestAnimationFrame(focusInput);
    },
    [disabled, focusInput, onChange, selectedSet, value]
  );

  const handleNativeSelectChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const selectedId = event.currentTarget.value;
      if (!selectedId) {
        return;
      }
      const option = optionMap.get(selectedId);
      if (!option) {
        return;
      }
      handleSelect(option);
      event.currentTarget.value = "";
    },
    [handleSelect, optionMap]
  );

  const handleRemove = useCallback(
    (id: string) => {
      if (disabled) {
        return;
      }
      const indexToRemove = value.indexOf(id);
      if (indexToRemove === -1) {
        return;
      }
      const next = [
        ...value.slice(0, indexToRemove),
        ...value.slice(indexToRemove + 1),
      ];
      onChange(next);
      requestAnimationFrame(focusInput);
    },
    [disabled, focusInput, onChange, value]
  );

  const filteredOptionsCount = filteredOptions.length;

  const handleArrowNavigation = useCallback(
    (event: KeyboardEvent<HTMLInputElement>, delta: number) => {
      event.preventDefault();
      if (!open) {
        openDropdown();
        return;
      }
      if (filteredOptionsCount === 0) {
        return;
      }
      setHighlightedIndex(
        (prev) => (prev + delta + filteredOptionsCount) % filteredOptionsCount
      );
    },
    [filteredOptionsCount, open, openDropdown]
  );

  const handleEnterKey = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!open || filteredOptions.length === 0) {
        return;
      }
      event.preventDefault();
      const option = filteredOptions[Math.max(0, highlightedIndex)];
      if (option) {
        handleSelect(option);
      }
    },
    [filteredOptions, handleSelect, highlightedIndex, open]
  );

  const handleEscapeKey = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        return;
      }
      event.preventDefault();
      setOpen(false);
    },
    [open]
  );

  const handleBackspaceKey = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (query.length !== 0 || value.length === 0) {
        return;
      }
      event.preventDefault();
      const lastSelected = value.at(-1);
      if (lastSelected) {
        handleRemove(lastSelected);
      }
    },
    [handleRemove, query.length, value]
  );

  const keyboardHandlers = useMemo<
    Partial<Record<KeyboardNavigationKey, KeyHandler>>
  >(
    () => ({
      ArrowDown: (event) => handleArrowNavigation(event, 1),
      ArrowUp: (event) => handleArrowNavigation(event, -1),
      Enter: handleEnterKey,
      Escape: handleEscapeKey,
      Backspace: handleBackspaceKey,
    }),
    [handleArrowNavigation, handleBackspaceKey, handleEnterKey, handleEscapeKey]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      const handler = keyboardHandlers[event.key as KeyboardNavigationKey];
      handler?.(event);
    },
    [keyboardHandlers]
  );

  const handleOptionMouseEnter = useCallback((index: number) => {
    setHighlightedIndex(index);
  }, []);

  const handleOptionKeyDown = useCallback(
    (
      event: KeyboardEvent<HTMLButtonElement>,
      option: CollectionsAutocompleteOption
    ) => {
      if (!ACTIVATION_KEYS.has(event.key)) {
        return;
      }
      event.preventDefault();
      handleSelect(option);
    },
    [handleSelect]
  );

  const trimmedQuery = query.trim();
  const hasNoResults = filteredOptions.length === 0 && trimmedQuery.length > 0;
  const nativeSelectPlaceholder = hasNoResults
    ? noResultsText
    : selectionPlaceholder;
  let liveRegionMessage = "";
  if (hasNoResults) {
    liveRegionMessage = noResultsText;
  } else if (open && trimmedQuery) {
    const resultCount = filteredOptions.length;
    let resultLabel = "results";
    if (resultCount === 1) {
      resultLabel = "result";
    }
    liveRegionMessage = `${resultCount} ${resultLabel} available`;
  }

  return (
    <div ref={containerRef} className="tw-flex tw-flex-col tw-gap-1.5">
      <div className="tw-relative">
        <fieldset
          className={classNames(
            "tw-flex tw-min-h-[46px] tw-w-full tw-cursor-text tw-flex-wrap tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-transition tw-duration-300 tw-ease-out",
            disabled
              ? "tw-border-iron-800 tw-bg-iron-900/60 tw-text-iron-400 tw-opacity-80"
              : "tw-border-iron-700 tw-bg-iron-900 hover:tw-border-iron-600"
          )}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          onClick={disabled ? undefined : focusInput}
          onKeyDown={disabled ? undefined : handleContainerKeyDown}
        >
          <legend className="tw-sr-only">Collections selection area</legend>
          {selectedOptions.map((option) => (
            <span
              key={option.id}
              className="tw-bg-iron-850 tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-iron-700 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-100"
            >
              <span>{option.name}</span>
              <button
                type="button"
                className={classNames(
                  "tw-inline-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-transparent tw-bg-transparent tw-transition tw-duration-200 tw-ease-out",
                  disabled
                    ? "tw-cursor-not-allowed tw-text-iron-500/70 tw-opacity-60"
                    : "tw-cursor-pointer tw-text-iron-400 hover:tw-text-error"
                )}
                onClick={() => handleRemove(option.id)}
                aria-label={`Remove ${option.name}`}
                disabled={disabled}
                aria-disabled={disabled || undefined}
              >
                <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            id={inputId}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            disabled={disabled}
            placeholder={selectionPlaceholder}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={nativeSelectId}
            aria-haspopup="listbox"
            aria-describedby={nativeSelectDescriptionId}
            aria-label="Collections search input"
            className={classNames(
              "tw-min-w-[140px] tw-flex-1 tw-border-none tw-bg-transparent tw-text-sm tw-font-medium tw-text-iron-50 focus:tw-outline-none",
              disabled
                ? "tw-cursor-not-allowed tw-text-iron-400"
                : "tw-cursor-text"
            )}
          />
          <p id={nativeSelectDescriptionId} className="tw-sr-only">
            Type to filter collections, then select a result from the following
            list.
          </p>
          <select
            id={nativeSelectId}
            aria-label="Available collections"
            aria-describedby={nativeSelectDescriptionId}
            className="tw-sr-only"
            disabled={!open || disabled}
            defaultValue=""
            onChange={handleNativeSelectChange}
          >
            <option value="" disabled>
              {nativeSelectPlaceholder}
            </option>
            {!hasNoResults &&
              filteredOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {`${option.name} (${option.id})${
                    typeof option.tokenCount === "number"
                      ? ` • ${option.tokenCount.toLocaleString()} tokens`
                      : ""
                  }`}
                </option>
              ))}
          </select>
          <output className="tw-sr-only" aria-live="polite" aria-atomic="true">
            {liveRegionMessage}
          </output>
        </fieldset>
        {open && (
          <ul
            ref={listboxRef}
            aria-hidden="true"
            className="tw-absolute tw-left-0 tw-right-0 tw-top-full tw-z-20 tw-mt-1 tw-max-h-64 tw-list-none tw-overflow-y-auto tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-0 tw-shadow-xl"
          >
            {hasNoResults ? (
              <li className="tw-px-3.5 tw-py-3 tw-text-sm tw-text-iron-300">
                {noResultsText}
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isHighlighted = index === highlightedIndex;
                return (
                  <li key={option.id} className="tw-list-none">
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseEnter={() => handleOptionMouseEnter(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onKeyDown={(event) => handleOptionKeyDown(event, option)}
                      onClick={() => handleSelect(option)}
                      className={classNames(
                        "tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-px-3.5 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-ease-out",
                        isHighlighted
                          ? "tw-bg-primary-500/20 tw-text-primary-300"
                          : "tw-text-iron-100 hover:tw-bg-iron-900"
                      )}
                    >
                      <span className="tw-flex tw-flex-col">
                        <span>{option.name}</span>
                        <span className="tw-text-xs tw-text-iron-400">
                          {option.id}
                        </span>
                      </span>
                      {typeof option.tokenCount === "number" ? (
                        <span className="tw-text-xs tw-text-iron-400">
                          {option.tokenCount.toLocaleString()} tokens
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
