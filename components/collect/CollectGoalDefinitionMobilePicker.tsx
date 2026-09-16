"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useId, useRef, useState } from "react";
import type { CollectGoalOption } from "./collect.types";

interface Props {
  readonly label: string;
  readonly placeholder: string;
  readonly locale: SupportedLocale;
  readonly value: string;
  readonly definitions: readonly CollectGoalOption[];
  readonly disabled: boolean;
  readonly invalid: boolean;
  readonly errorId?: string | undefined;
  readonly searchable?: boolean | undefined;
  readonly onChange: (id: string) => void;
}

export default function CollectGoalDefinitionMobilePicker({
  label,
  placeholder,
  locale,
  value,
  definitions,
  disabled,
  invalid,
  errorId,
  searchable = false,
  onChange,
}: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = definitions.find((definition) => definition.id === value);
  const searchText = (text: string) =>
    text.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase(locale);
  const normalizedQuery = searchText(query.trim());
  const filtered = searchable
    ? definitions.filter((definition) =>
        searchText(definition.label).includes(normalizedQuery)
      )
    : definitions;
  const emptyMessage = t(
    locale,
    definitions.length === 0
      ? "collect.goal.noDefinitions"
      : "collect.goal.noMatches"
  );

  const choose = (definition: CollectGoalOption) => {
    onChange(definition.id);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <>
      <div className="tw-min-w-0 tw-space-y-2">
        <span
          id={`${id}-label`}
          className="tw-block tw-text-xs tw-font-semibold tw-text-iron-300"
        >
          {label}
        </span>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-describedby={invalid ? (errorId ?? `${id}-required`) : undefined}
          aria-haspopup="dialog"
          aria-expanded={isOpen && !disabled}
          onClick={() => {
            setQuery("");
            setIsOpen(true);
          }}
          className={`tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${invalid ? "tw-border-error" : "tw-border-iron-700"}`}
        >
          <span id={`${id}-value`} className="tw-min-w-0 tw-break-words">
            {selected?.label ?? placeholder}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="tw-size-4 tw-shrink-0 tw-text-iron-400"
          />
        </button>
        {invalid && !errorId && (
          <span id={`${id}-required`} className="tw-sr-only">
            {t(locale, "collect.goal.requiredDefinition")}
          </span>
        )}
      </div>
      <MobileWrapperDialog
        title={label}
        isOpen={isOpen && !disabled}
        onClose={() => {
          setQuery("");
          setIsOpen(false);
        }}
        onAfterLeave={() => {
          setIsOpen(false);
          triggerRef.current?.focus({ preventScroll: true });
        }}
        tall
        showScrollbar
        focusTitleOnOpen
        surfaceClassName="tw-bg-iron-950"
      >
        <div className="tw-px-4 sm:tw-px-6">
          {searchable && definitions.length > 0 && (
            <label className="tw-mb-3 tw-block tw-space-y-2">
              <span className="tw-sr-only">
                {t(locale, "collect.goal.searchArtist")}
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t(locale, "collect.goal.searchArtist")}
                autoComplete="off"
                className="tw-block tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 placeholder:tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
              />
            </label>
          )}
          {filtered.length === 0 ? (
            <output className="tw-block tw-py-4 tw-text-sm tw-text-iron-400">
              {emptyMessage}
            </output>
          ) : (
            <fieldset className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0">
              <legend className="tw-sr-only">{label}</legend>
              <ul className="tw-m-0 tw-list-none tw-p-0">
                {filtered.map((definition) => (
                  <li key={definition.id}>
                    <label className="tw-relative tw-flex tw-min-h-12 tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 active:tw-bg-iron-800">
                      <input
                        type="radio"
                        name={`${id}-definition`}
                        value={definition.id}
                        checked={definition.id === value}
                        onClick={() => {
                          if (definition.id === value) choose(definition);
                        }}
                        onChange={() => choose(definition)}
                        className="tw-peer tw-sr-only"
                      />
                      <span className="tw-min-w-0 tw-break-words">
                        {definition.label}
                      </span>
                      {definition.id === value && (
                        <CheckIcon
                          aria-hidden="true"
                          className="tw-size-4 tw-shrink-0 tw-text-iron-300"
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className="tw-pointer-events-none tw-absolute tw-inset-0 tw-rounded-lg peer-focus-visible:tw-outline peer-focus-visible:tw-outline-2 peer-focus-visible:tw-outline-offset-2 peer-focus-visible:tw-outline-primary-400"
                      />
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
        </div>
      </MobileWrapperDialog>
    </>
  );
}
