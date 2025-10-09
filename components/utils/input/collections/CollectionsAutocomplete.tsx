"use client";

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
import { classNames } from "@/helpers/Helpers";

export interface CollectionsAutocompleteOption {
  readonly id: string;
  readonly name: string;
  readonly tokenCount?: number;
}

export interface CollectionsAutocompleteProps {
  readonly options: ReadonlyArray<CollectionsAutocompleteOption>;
  readonly value: ReadonlyArray<string>;
  readonly onChange: (next: string[]) => void;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly placeholder?: string;
  readonly noResultsText?: string;
}

export default function CollectionsAutocomplete({
  options,
  value,
  onChange,
  disabled = false,
  label,
  placeholder = "Search collections…",
  noResultsText = "No collections found.",
}: Readonly<CollectionsAutocompleteProps>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const inputId = useId();
  const listboxId = useId();

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
      value.map((id) => optionMap.get(id) ?? { id, name: id }),
    [optionMap, value]
  );

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
      setHighlightedIndex(filteredOptions.length > 0 ? filteredOptions.length - 1 : 0);
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

  const handleRemove = useCallback(
    (id: string) => {
      if (disabled) {
        return;
      }
      const next = value.filter((item) => item !== id);
      onChange(next);
      requestAnimationFrame(focusInput);
    },
    [disabled, focusInput, onChange, value]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!open) {
          openDropdown();
          return;
        }
        setHighlightedIndex((prev) => {
          if (filteredOptions.length === 0) {
            return prev;
          }
          return (prev + 1) % filteredOptions.length;
        });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) {
          openDropdown();
          return;
        }
        setHighlightedIndex((prev) => {
          if (filteredOptions.length === 0) {
            return prev;
          }
          return (prev - 1 + filteredOptions.length) % filteredOptions.length;
        });
        return;
      }

      if (event.key === "Enter") {
        if (open && filteredOptions.length > 0) {
          event.preventDefault();
          const option = filteredOptions[Math.max(0, highlightedIndex)];
          if (option) {
            handleSelect(option);
          }
        }
        return;
      }

      if (event.key === "Escape") {
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        return;
      }

      if (event.key === "Backspace" && query.length === 0 && value.length > 0) {
        event.preventDefault();
        handleRemove(value[value.length - 1]);
      }
    },
    [
      filteredOptions,
      handleRemove,
      open,
      openDropdown,
      query.length,
      value,
      highlightedIndex,
    ]
  );

  const handleOptionMouseEnter = useCallback((index: number) => {
    setHighlightedIndex(index);
  }, []);

  const hasNoResults = filteredOptions.length === 0 && query.trim().length > 0;

  return (
    <div ref={containerRef} className="tw-flex tw-flex-col tw-gap-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className={classNames(
            "tw-text-xs tw-font-semibold",
            disabled ? "tw-text-iron-500" : "tw-text-iron-200"
          )}
        >
          {label}
        </label>
      ) : null}
      <div
        className={classNames(
          "tw-flex tw-min-h-[46px] tw-w-full tw-cursor-text tw-flex-wrap tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-transition tw-duration-300 tw-ease-out",
          disabled
            ? "tw-border-iron-800 tw-bg-iron-900/60 tw-text-iron-400 tw-opacity-80"
            : "tw-border-iron-700 tw-bg-iron-900 hover:tw-border-iron-600"
        )}
        onClick={focusInput}
        role="presentation"
      >
        {selectedOptions.map((option) => (
          <span
            key={option.id}
            className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-850 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-100"
          >
            <span>{option.name}</span>
            <button
              type="button"
              className="tw-inline-flex tw-h-4 tw-w-4 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-transparent tw-bg-transparent tw-text-iron-400 hover:tw-text-error tw-transition tw-duration-200 tw-ease-out"
              onClick={() => handleRemove(option.id)}
              aria-label={`Remove ${option.name}`}
            >
              ×
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
          placeholder={selectedOptions.length ? "Add another collection…" : placeholder}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          className={classNames(
            "tw-flex-1 tw-min-w-[140px] tw-border-none tw-bg-transparent tw-text-sm tw-font-medium tw-text-iron-50 focus:tw-outline-none",
            disabled ? "tw-cursor-not-allowed tw-text-iron-400" : "tw-cursor-text"
          )}
        />
      </div>
      {open && (
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="tw-z-20 tw-mt-1 tw-max-h-64 tw-w-full tw-overflow-y-auto tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-shadow-xl"
        >
          {hasNoResults ? (
            <div className="tw-px-3.5 tw-py-3 tw-text-sm tw-text-iron-300">
              {noResultsText}
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const isHighlighted = index === highlightedIndex;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseEnter={() => handleOptionMouseEnter(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                  className={classNames(
                    "tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-px-3.5 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-ease-out",
                    isHighlighted
                      ? "tw-bg-primary-500/20 tw-text-primary-200"
                      : "hover:tw-bg-iron-900 tw-text-iron-100"
                  )}
                >
                  <span className="tw-flex tw-flex-col">
                    <span>{option.name}</span>
                    <span className="tw-text-xs tw-text-iron-400">{option.id}</span>
                  </span>
                  {typeof option.tokenCount === "number" ? (
                    <span className="tw-text-xs tw-text-iron-400">
                      {option.tokenCount.toLocaleString()} tokens
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
