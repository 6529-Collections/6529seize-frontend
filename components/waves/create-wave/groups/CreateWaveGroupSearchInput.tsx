import type { KeyboardEvent, RefObject } from "react";

export default function CreateWaveGroupSearchInput({
  inputRef,
  inputId,
  listboxId,
  activeOptionId,
  label,
  value,
  isOpen,
  disabled,
  hasValue,
  hasSelectedGroup,
  showClearButton,
  onInputFocus,
  onInputChange,
  onInputKeyDown,
  onClearSelection,
}: {
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly inputId: string;
  readonly listboxId: string;
  readonly activeOptionId?: string | undefined;
  readonly label: string;
  readonly value: string;
  readonly isOpen: boolean;
  readonly disabled: boolean;
  readonly hasValue: boolean;
  readonly hasSelectedGroup: boolean;
  readonly showClearButton: boolean;
  readonly onInputFocus: () => void;
  readonly onInputChange: (value: string) => void;
  readonly onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  readonly onClearSelection: () => void;
}) {
  const inputClasses = [
    "tw-form-input tw-peer tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-950/70 tw-pb-3 tw-pl-10 tw-pr-4 tw-pt-3 tw-text-base tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-300 tw-ease-out",
    disabled
      ? "tw-bg-iron-900/80 tw-text-iron-500 tw-caret-iron-500 placeholder:tw-text-iron-500"
      : "tw-caret-primary-400 placeholder:tw-text-iron-500 hover:tw-ring-white/15 focus:tw-border-primary-400 focus:tw-bg-iron-950/80 focus:tw-ring-primary-400",
    hasValue || hasSelectedGroup
      ? "focus:tw-text-white tw-text-primary-400"
      : "tw-text-white",
  ].join(" ");

  return (
    <div className="tw-relative">
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-disabled={disabled}
        aria-activedescendant={activeOptionId}
        value={value}
        onFocus={onInputFocus}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={onInputKeyDown}
        placeholder=" "
        disabled={disabled}
        className={inputClasses}
        autoComplete="off"
      />
      <svg
        className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
          clipRule="evenodd"
        />
      </svg>
      {showClearButton && (
        <button
          type="button"
          onClick={onClearSelection}
          aria-label={
            hasSelectedGroup ? "Clear selected group" : "Clear search"
          }
          className="tw-absolute tw-right-3 tw-top-3.5 tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-error"
        >
          <svg
            className="tw-h-5 tw-w-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17 7L7 17M7 7L17 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <label
        htmlFor={inputId}
        className={`tw-absolute tw-cursor-text tw-rounded-lg tw-text-base tw-font-medium ${
          disabled ? "tw-text-iron-400" : "tw-text-iron-500"
        } tw-start-1 tw-top-2 tw-z-10 tw-ml-7 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-bg-iron-950 tw-px-2 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-950 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4`}
      >
        {label}
      </label>
    </div>
  );
}
