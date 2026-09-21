"use client";

import React, { useState, useEffect, useId } from "react";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import type { CreateDropMetadataType } from "./CreateDropContent";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";

interface CreateDropMetadataRowProps {
  readonly metadata: CreateDropMetadataType;
  readonly isError: boolean;
  readonly errorMessage: string | null;
  readonly index: number;
  readonly disabled: boolean;
  readonly onChangeKey: (params: { index: number; newKey: string }) => void;
  readonly onChangeValue: (params: {
    index: number;
    newValue: string | number | null;
  }) => void;
  readonly onRemove: (index: number) => void;
}

const CreateDropMetadataRow: React.FC<CreateDropMetadataRowProps> = ({
  metadata,
  index,
  onChangeKey,
  onChangeValue,
  isError,
  errorMessage,
  onRemove,
  disabled,
}) => {
  const locale = useBrowserLocale();
  const rowId = useId();
  const [valueTouched, setValueTouched] = useState(false);
  const [tempValue, setTempValue] = useState<string>(
    metadata.value !== null ? String(metadata.value) : ""
  );

  useEffect(() => {
    setTempValue(metadata.value !== null ? String(metadata.value) : "");
  }, [metadata.value]);

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeKey({ index, newKey: e.target.value });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (metadata.type === "NUMBER") {
      if (
        newValue === "" ||
        newValue === "-" ||
        /^-?\d*\.?\d*$/.test(newValue)
      ) {
        setTempValue(newValue);
        if (newValue === "" || newValue === "-") {
          onChangeValue({ index, newValue: null });
        } else {
          const numValue = parseFloat(newValue);
          onChangeValue({ index, newValue: numValue });
        }
      }
    } else {
      setTempValue(newValue);
      onChangeValue({ index, newValue });
    }
  };

  const hasKeyError = !!errorMessage;
  const inputClasses =
    "tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-base tw-leading-6 tw-text-iron-50 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 sm:tw-text-sm";
  const labelClasses =
    "tw-mb-1.5 tw-block tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-300";
  const showValueError = isError && valueTouched;
  const valueError = showValueError
    ? t(locale, "waves.metadata.missingValue")
    : null;

  return (
    <div className="tw-flex tw-items-start tw-gap-2">
      <div className="tw-grid tw-min-w-0 tw-flex-1 tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2">
        <div className="tw-min-w-0">
          <label htmlFor={`${rowId}-key`} className={labelClasses}>
            {t(locale, "waves.metadata.fieldName")}
            {metadata.required && (
              <span className="tw-ml-2 tw-font-normal tw-text-iron-400">
                {t(locale, "waves.metadata.required")}
              </span>
            )}
          </label>
          <input
            id={`${rowId}-key`}
            data-metadata-key=""
            data-metadata-id={metadata.id}
            type="text"
            placeholder={t(locale, "waves.metadata.key")}
            value={metadata.key}
            onChange={metadata.required ? undefined : handleKeyChange}
            readOnly={metadata.required}
            disabled={disabled}
            aria-invalid={hasKeyError || undefined}
            aria-describedby={hasKeyError ? `${rowId}-key-error` : undefined}
            className={`${inputClasses} ${hasKeyError ? "tw-ring-red focus:tw-ring-red" : ""} ${metadata.required ? "tw-text-iron-400" : ""}`}
          />
          {errorMessage && (
            <p
              id={`${rowId}-key-error`}
              className="tw-mb-0 tw-mt-1.5 tw-text-xs tw-leading-5 tw-text-error"
            >
              {errorMessage}
            </p>
          )}
        </div>
        <div className="tw-min-w-0">
          <label htmlFor={`${rowId}-value`} className={labelClasses}>
            {t(locale, "waves.metadata.value")}
            {metadata.type === ApiWaveMetadataType.Number && (
              <span className="tw-ml-2 tw-font-normal tw-text-iron-400">
                {t(locale, "waves.metadata.number")}
              </span>
            )}
          </label>
          <input
            id={`${rowId}-value`}
            type="text"
            inputMode={
              metadata.type === ApiWaveMetadataType.Number ? "decimal" : "text"
            }
            placeholder={t(locale, "waves.metadata.value")}
            value={tempValue}
            onChange={handleValueChange}
            onBlur={() => setValueTouched(true)}
            disabled={disabled}
            aria-required={metadata.required || undefined}
            aria-invalid={showValueError || undefined}
            aria-describedby={valueError ? `${rowId}-value-error` : undefined}
            className={`${inputClasses} ${showValueError ? "tw-ring-red focus:tw-ring-red" : ""}`}
          />
          {valueError && (
            <p
              id={`${rowId}-value-error`}
              className="tw-mb-0 tw-mt-1.5 tw-text-xs tw-leading-5 tw-text-error"
            >
              {valueError}
            </p>
          )}
        </div>
      </div>
      {!metadata.required && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label={t(locale, "waves.metadata.remove", {
            number: formatNumber(locale, index + 1),
          })}
          disabled={disabled}
          className="tw-mt-[26px] tw-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-text-error focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
        >
          <TrashIcon aria-hidden="true" className="tw-size-4" />
        </button>
      )}
    </div>
  );
};

export default CreateDropMetadataRow;
