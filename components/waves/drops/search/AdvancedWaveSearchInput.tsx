"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  getPendingSearchFilter,
  SEARCH_OPERATOR_LABELS,
} from "@/helpers/advanced-search.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchWaveSearchAuthors } from "@/services/api/wave-search-authors-api";
import type { WaveSearchAuthor } from "@/services/api/wave-drops-v2.types";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useState, type RefObject } from "react";

type Suggestion =
  | { kind: "in"; id: string; label: string; wave: ApiWave }
  | { kind: "from"; id: string; label: string; author: WaveSearchAuthor };

export default function AdvancedWaveSearchInput({
  query,
  onQueryChange,
  wave,
  onWaveChange,
  author,
  onAuthorChange,
  inputRef,
  enabled,
  readContext,
}: {
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
  readonly wave: ApiWave | null;
  readonly onWaveChange: (wave: ApiWave | null) => void;
  readonly author: WaveSearchAuthor | null;
  readonly onAuthorChange: (author: WaveSearchAuthor | null) => void;
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly enabled: boolean;
  readonly readContext: string | null;
}) {
  const locale = useBrowserLocale();
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const pending = getPendingSearchFilter(query);
  const value = pending?.value ?? "";
  const debouncedValue = useDebouncedValue(value, 200);
  const suggestions = useQuery<Suggestion[]>({
    queryKey: [
      QueryKey.WAVES_SEARCH,
      "advanced-message-filter",
      {
        kind: pending?.kind,
        value: debouncedValue,
        waveId: wave?.id,
        readContext,
      },
    ],
    enabled:
      enabled &&
      focused &&
      !dismissed &&
      pending !== null &&
      value === debouncedValue,
    queryFn: async ({ signal }): Promise<Suggestion[]> => {
      if (pending?.kind === "in") {
        const waves = await commonApiFetch<ApiWave[]>({
          endpoint: "waves",
          params: {
            ...(debouncedValue ? { name: debouncedValue } : {}),
            limit: "10",
          },
          signal,
        });
        return waves.map((candidate) => ({
          kind: "in",
          id: candidate.id,
          label: candidate.name,
          wave: candidate,
        }));
      }
      if (wave) {
        const authors = await fetchWaveSearchAuthors({
          waveId: wave.id,
          handle: debouncedValue,
          signal,
        });
        return authors.map((candidate) => ({
          kind: "from",
          id: candidate.id,
          label: candidate.handle,
          author: candidate,
        }));
      }
      const profiles = await commonApiFetch<CommunityMemberMinimal[]>({
        endpoint: "community-members",
        params: { param: debouncedValue, sort: "level", limit: "10" },
        signal,
      });
      return profiles.flatMap((profile) =>
        profile.profile_id && profile.handle
          ? [
              {
                kind: "from" as const,
                id: profile.profile_id,
                label: profile.handle,
                author: {
                  id: profile.profile_id,
                  handle: profile.handle,
                  pfp: profile.pfp,
                },
              },
            ]
          : []
      );
    },
    staleTime: 30_000,
  });
  const options = value === debouncedValue ? (suggestions.data ?? []) : [];
  const filterKinds = ["from", "in"] as const;
  const optionCount = pending ? options.length : filterKinds.length;
  const selectedIndex = Math.min(activeIndex, Math.max(0, optionCount - 1));
  const activeOptionId = pending
    ? `advanced-search-option-${selectedIndex}`
    : `advanced-search-hint-${selectedIndex}`;
  const showSuggestions =
    focused && !dismissed && (pending !== null || query.length === 0);
  const choose = (suggestion: Suggestion) => {
    if (suggestion.kind === "in") onWaveChange(suggestion.wave);
    else onAuthorChange(suggestion.author);
    onQueryChange(pending?.text ? `${pending.text} ` : "");
    inputRef.current?.focus();
    setDismissed(true);
  };
  const startFilter = (kind: "from" | "in") => {
    onQueryChange(
      `${query.trim()}${query.trim() ? " " : ""}${SEARCH_OPERATOR_LABELS[kind]} `
    );
    setDismissed(false);
    setActiveIndex(0);
  };
  const chipClass =
    "tw-flex tw-max-w-full tw-items-center tw-gap-1 tw-rounded-md tw-border-0 tw-bg-iron-700/70 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-50 hover:tw-bg-iron-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-300";

  let suggestionStatus:
    | "waves.drops.searchModal.advanced.empty"
    | "waves.drops.searchModal.advanced.error"
    | "waves.drops.searchModal.advanced.loading" =
    "waves.drops.searchModal.advanced.empty";
  if (suggestions.isError)
    suggestionStatus = "waves.drops.searchModal.advanced.error";
  else if (suggestions.isFetching || value !== debouncedValue)
    suggestionStatus = "waves.drops.searchModal.advanced.loading";
  return (
    <div
      className="tw-relative tw-min-w-0 tw-flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <div className="tw-flex tw-min-h-11 tw-flex-wrap tw-items-center tw-gap-1.5 tw-rounded-lg tw-bg-iron-900 tw-px-2.5 tw-py-2 tw-ring-1 tw-ring-inset tw-ring-iron-700 focus-within:tw-ring-2 focus-within:tw-ring-primary-300/90">
        <MagnifyingGlassIcon
          className="tw-size-5 tw-shrink-0 tw-text-iron-400"
          aria-hidden="true"
        />
        {wave && (
          <button
            type="button"
            className={chipClass}
            aria-label={t(locale, "waves.drops.searchModal.advanced.removeIn", {
              name: wave.name,
            })}
            onClick={() => {
              onWaveChange(null);
              inputRef.current?.focus();
            }}
          >
            <span>{SEARCH_OPERATOR_LABELS.in}</span>
            <span className="tw-max-w-48 tw-truncate">{wave.name}</span>
            <XMarkIcon className="tw-size-3.5 tw-shrink-0" aria-hidden="true" />
          </button>
        )}
        {author && (
          <button
            type="button"
            className={chipClass}
            aria-label={t(
              locale,
              "waves.drops.searchModal.advanced.removeFrom",
              { name: author.handle }
            )}
            onClick={() => {
              onAuthorChange(null);
              inputRef.current?.focus();
            }}
          >
            <span>{SEARCH_OPERATOR_LABELS.from}</span>
            <span className="tw-max-w-40 tw-truncate">{author.handle}</span>
            <XMarkIcon className="tw-size-3.5 tw-shrink-0" aria-hidden="true" />
          </button>
        )}
        <input
          id="wave-drops-search-input"
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={t(locale, "waves.drops.searchModal.placeholder")}
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={
            showSuggestions ? "advanced-search-options" : undefined
          }
          aria-activedescendant={
            showSuggestions && optionCount ? activeOptionId : undefined
          }
          aria-describedby="advanced-search-help"
          autoComplete="off"
          value={query}
          placeholder={t(locale, "waves.drops.searchModal.placeholder")}
          className="tw-min-w-24 tw-flex-1 tw-border-0 tw-bg-transparent tw-p-0 tw-text-base tw-text-iron-50 tw-caret-primary-300 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-0 sm:tw-text-sm"
          onFocus={() => {
            setFocused(true);
            setDismissed(false);
          }}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setDismissed(false);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && showSuggestions) {
              event.preventDefault();
              event.stopPropagation();
              setDismissed(true);
            }
            if (event.key === "Backspace" && !query && (author || wave)) {
              event.preventDefault();
              if (author) onAuthorChange(null);
              else if (wave) onWaveChange(null);
            }
            if (!showSuggestions || !optionCount) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex(
                (selectedIndex +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  optionCount) %
                  optionCount
              );
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (pending) choose(options[selectedIndex]!);
              else startFilter(filterKinds[selectedIndex]!);
            }
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              inputRef.current?.focus();
            }}
            aria-label={t(locale, "waves.drops.searchModal.clear")}
            className="tw-flex tw-size-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-300"
          >
            <XMarkIcon className="tw-size-5" aria-hidden="true" />
          </button>
        )}
      </div>
      <p id="advanced-search-help" className="tw-sr-only">
        {t(locale, "waves.drops.searchModal.advanced.help")}
      </p>
      <p role="status" className="tw-sr-only">
        {showSuggestions &&
        pending &&
        (suggestions.isFetching || !options.length)
          ? t(locale, suggestionStatus)
          : ""}
      </p>
      {showSuggestions && (
        <div className="tw-absolute tw-left-0 tw-right-0 tw-top-full tw-z-10 tw-mt-2 tw-max-h-64 tw-overflow-y-auto tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-2 tw-shadow-xl">
          <div
            id="advanced-search-options"
            role="listbox"
            onMouseDown={(event) => event.preventDefault()}
            aria-label={t(locale, "waves.drops.searchModal.advanced.filters")}
          >
            {pending
              ? options.map((option, index) => (
                  <button
                    type="button"
                    role="option"
                    tabIndex={-1}
                    aria-selected={selectedIndex === index}
                    id={`advanced-search-option-${index}`}
                    key={option.id}
                    onClick={() => choose(option)}
                    className={`tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-text-iron-100 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-300 ${selectedIndex === index ? "tw-bg-iron-800" : "tw-bg-transparent"}`}
                  >
                    <span className="tw-text-iron-400">
                      {option.kind === "in" ? "#" : "@"}
                    </span>
                    <span className="tw-truncate">{option.label}</span>
                  </button>
                ))
              : filterKinds.map((kind, index) => (
                  <button
                    type="button"
                    role="option"
                    tabIndex={-1}
                    aria-selected={selectedIndex === index}
                    id={`advanced-search-hint-${index}`}
                    key={kind}
                    onClick={() => {
                      startFilter(kind);
                      inputRef.current?.focus();
                    }}
                    className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-text-iron-100 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-300"
                  >
                    <span className="tw-w-10 tw-font-semibold tw-text-iron-400">
                      {SEARCH_OPERATOR_LABELS[kind]}
                    </span>
                    {t(
                      locale,
                      kind === "from"
                        ? "waves.drops.searchModal.advanced.from"
                        : "waves.drops.searchModal.advanced.in"
                    )}
                  </button>
                ))}
          </div>
          {pending && !options.length && (
            <p
              aria-hidden="true"
              className="tw-m-0 tw-p-3 tw-text-sm tw-text-iron-400"
            >
              {t(locale, suggestionStatus)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
