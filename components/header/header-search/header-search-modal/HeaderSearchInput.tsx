import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { KeyboardEvent, RefObject } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import {
  MIN_SEARCH_LENGTH,
  HEADER_SEARCH_RESULTS_LISTBOX_ID,
  STATE,
} from "./constants";
const HEADER_SEARCH_INPUT_DESCRIPTION_ID = "header-search-input-description";
export default function HeaderSearchInput({
  inputRef,
  searchValue,
  derivedState,
  onChange,
  onClear,
  onKeyDown,
}: {
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly searchValue: string;
  readonly derivedState: STATE;
  readonly onChange: (query: string) => void;
  readonly onClear: () => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  const locale = useBrowserLocale();
  const formattedInputMinLength = formatInteger(locale, MIN_SEARCH_LENGTH);
  return (
    <div className="tw-relative">
      <MagnifyingGlassIcon
        className="tw-pointer-events-none tw-absolute tw-left-3.5 tw-top-1/2 tw-size-5 -tw-translate-y-1/2 tw-text-iron-400"
        aria-hidden="true"
      />
      <label className="tw-sr-only" htmlFor="header-search-input">
        {t(locale, "headerSearch.inputLabel")}
      </label>
      <p id={HEADER_SEARCH_INPUT_DESCRIPTION_ID} className="tw-sr-only">
        {t(locale, "headerSearch.inputDescription.site", {
          minLength: formattedInputMinLength,
        })}
      </p>
      <input
        id="header-search-input"
        ref={inputRef}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls={
          derivedState === STATE.SUCCESS
            ? HEADER_SEARCH_RESULTS_LISTBOX_ID
            : undefined
        }
        aria-expanded={derivedState === STATE.SUCCESS}
        aria-describedby={HEADER_SEARCH_INPUT_DESCRIPTION_ID}
        autoComplete="off"
        value={searchValue}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => onKeyDown(event)}
        className="sm:text-sm tw-form-input tw-block tw-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-2.5 tw-pl-10 tw-pr-16 tw-text-base tw-font-normal tw-text-iron-50 tw-caret-primary-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-150 placeholder:tw-text-iron-500 hover:tw-ring-iron-600 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300/90"
        placeholder={t(locale, "headerSearch.placeholder.site")}
      />
      {searchValue.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          aria-label={t(locale, "headerSearch.clear")}
          className="tw-absolute tw-right-2.5 tw-top-1/2 tw-flex tw-h-7 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition hover:tw-border-iron-600 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70"
        >
          {t(locale, "headerSearch.clearShort")}
        </button>
      )}
    </div>
  );
}
