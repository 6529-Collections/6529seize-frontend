import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

function getInvalidOptions(
  options: readonly { value: string }[],
  maxLength: number,
  caseSensitive: boolean
): Set<number> {
  const values = options.map(({ value }) => value.trim());
  const missingOptions = values.filter(Boolean).length < 2;
  const normalized = values.map((value) =>
    caseSensitive ? value : value.toLowerCase()
  );
  return new Set(
    values.flatMap((value, index) => {
      const duplicate =
        value !== "" &&
        normalized.indexOf(normalized[index]!) !==
          normalized.lastIndexOf(normalized[index]!);
      const invalid =
        (missingOptions && value === "") ||
        value.length > maxLength ||
        duplicate;
      return invalid ? [index] : [];
    })
  );
}

export default function PollComposerOptions({
  options,
  multi,
  disabled,
  maxOptions,
  maxOptionLength,
  validationError,
  validationErrorId,
  locale,
  onAdd,
  onChange,
  onRemove,
  caseSensitiveOptions = false,
}: {
  readonly options: readonly { id: string | number; value: string }[];
  readonly multi: boolean;
  readonly disabled: boolean;
  readonly maxOptions: number;
  readonly maxOptionLength: number;
  readonly validationError: string | null;
  readonly validationErrorId: string;
  readonly locale: SupportedLocale;
  readonly onAdd: () => void;
  readonly onChange: (index: number, value: string) => void;
  readonly onRemove: (index: number) => void;
  readonly caseSensitiveOptions?: boolean;
}) {
  const canAddOption = options.length < maxOptions;
  const canRemoveOption = options.length > 2;
  const invalidOptions = getInvalidOptions(
    options,
    maxOptionLength,
    caseSensitiveOptions
  );

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      {options.map(({ id, value }, index) => {
        const hasOptionValue = value.trim().length > 0;

        return (
          <div
            key={id}
            className="tw-group/option tw-flex tw-items-center tw-gap-2"
          >
            <span
              className={`tw-flex tw-size-[15px] tw-flex-shrink-0 tw-items-center tw-justify-center tw-border tw-border-solid tw-transition-all ${
                multi ? "tw-rounded-[4px]" : "tw-rounded-full"
              } ${
                hasOptionValue
                  ? "tw-border-iron-400 tw-bg-iron-800"
                  : "tw-border-iron-700 tw-bg-iron-900/60"
              }`}
              aria-hidden="true"
            >
              <span
                className={`tw-transition-all ${
                  multi
                    ? "tw-size-[7px] tw-rounded-[2px]"
                    : "tw-size-1.5 tw-rounded-full"
                } ${hasOptionValue ? "tw-bg-iron-300" : "tw-bg-transparent"}`}
              />
            </span>
            <input
              type="text"
              value={value}
              disabled={disabled}
              maxLength={maxOptionLength}
              aria-invalid={
                validationError && invalidOptions.has(index) ? true : undefined
              }
              aria-describedby={
                validationError && invalidOptions.has(index)
                  ? validationErrorId
                  : undefined
              }
              aria-label={t(locale, "waves.poll.composer.optionLabel", {
                number: formatInteger(locale, index + 1),
              })}
              onChange={(event) => onChange(index, event.target.value)}
              className="tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/80 tw-px-3 tw-py-2.5 tw-text-[13px] tw-font-medium tw-text-iron-50 tw-outline-none tw-transition-all placeholder:tw-text-iron-500 hover:tw-border-iron-600 hover:tw-bg-iron-800 focus:tw-border-white/30 focus:tw-bg-iron-800 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
              placeholder={t(locale, "waves.poll.composer.optionPlaceholder", {
                number: formatInteger(locale, index + 1),
              })}
            />
            <button
              type="button"
              aria-label={t(locale, "waves.poll.composer.removeOption", {
                number: formatInteger(locale, index + 1),
              })}
              disabled={disabled || !canRemoveOption}
              onClick={() => onRemove(index)}
              className={`tw-flex tw-size-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-all disabled:tw-cursor-not-allowed desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-rose-400 ${
                canRemoveOption && !disabled
                  ? "tw-opacity-80 desktop-hover:hover:tw-opacity-100"
                  : "tw-opacity-40"
              }`}
            >
              <TrashIcon className="tw-size-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}

      <div className="tw-mt-1 tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-1.5 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-3">
        <button
          type="button"
          disabled={disabled || !canAddOption}
          onClick={onAdd}
          className="tw-flex tw-w-fit tw-flex-shrink-0 tw-items-center tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-colors disabled:tw-cursor-not-allowed disabled:tw-opacity-40 desktop-hover:hover:tw-text-iron-300"
        >
          <span className="tw-flex tw-size-4 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-dashed tw-border-iron-600">
            <PlusIcon className="tw-size-2.5" aria-hidden="true" />
          </span>
          <span className="tw-text-sm tw-font-medium">
            {t(locale, "waves.poll.composer.addOption")}
          </span>
        </button>
        {validationError && (
          <p
            id={validationErrorId}
            role="alert"
            className="tw-mb-0 tw-min-w-0 tw-text-left tw-text-[11px] tw-font-medium tw-text-amber-200 sm:tw-text-right"
          >
            {validationError}
          </p>
        )}
      </div>
    </div>
  );
}
