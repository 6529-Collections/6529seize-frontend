"use client";

import { useEffect, useRef } from "react";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import CreateDropMetadataRow from "./CreateDropMetadataRow";
import type { CreateDropMetadataType } from "./CreateDropContent";

interface CreateDropMetadataProps {
  readonly metadata: CreateDropMetadataType[];
  readonly missingRequiredMetadataKeys: string[];
  readonly metadataErrorById: Readonly<Record<string, string>>;
  readonly disabled: boolean;
  readonly closeMetadata: () => void;
  readonly onChangeKey: (params: { index: number; newKey: string }) => void;
  readonly onChangeValue: (params: {
    index: number;
    newValue: string | number | null;
  }) => void;
  readonly onAddMetadata: () => string;
  readonly onRemoveMetadata: (index: number) => void;
}

export default function CreateDropMetadata({
  metadata,
  missingRequiredMetadataKeys,
  metadataErrorById,
  closeMetadata,
  disabled,
  onChangeKey,
  onChangeValue,
  onAddMetadata,
  onRemoveMetadata,
}: CreateDropMetadataProps) {
  const locale = useBrowserLocale();
  const rowsRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const focusNewFieldIdRef = useRef<string | null>(null);
  const hasRequiredFields = metadata.some((item) => item.required);
  const hasErrors =
    missingRequiredMetadataKeys.length > 0 ||
    Object.keys(metadataErrorById).length > 0;
  const fieldCountKey =
    metadata.length === 1
      ? "waves.metadata.fields.one"
      : "waves.metadata.fields.other";
  const fieldCountLabel = metadata.length
    ? t(locale, fieldCountKey, { count: formatNumber(locale, metadata.length) })
    : null;

  useEffect(() => {
    const newFieldId = focusNewFieldIdRef.current;
    if (newFieldId === null) return;
    const inputs = rowsRef.current?.querySelectorAll<HTMLInputElement>(
      "input[data-metadata-key]"
    );
    const newFieldInput = inputs
      ? Array.from(inputs).find(
          (input) => input.dataset["metadataId"] === newFieldId
        )
      : undefined;
    newFieldInput?.focus();
    focusNewFieldIdRef.current = null;
  }, [metadata]);

  return (
    <div className="tw-mt-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800">
      <button
        type="button"
        onClick={closeMetadata}
        className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <span className="tw-text-sm tw-font-medium tw-text-iron-200">
          {t(locale, "waves.metadata.title")}
        </span>
        {fieldCountLabel && (
          <span className="tw-text-xs tw-font-normal tw-text-iron-400">
            {fieldCountLabel}
          </span>
        )}
        {hasRequiredFields && (
          <span
            className={`tw-text-xs ${hasErrors ? "tw-text-amber-200" : "tw-text-iron-400"}`}
          >
            {t(locale, "waves.metadata.required")}
          </span>
        )}
        <ChevronDownIcon
          aria-hidden="true"
          className="tw-ml-auto tw-size-4 tw-shrink-0 tw-rotate-180 tw-text-iron-400"
        />
      </button>
      <div>
        <p className="tw-mb-4 tw-mt-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "waves.metadata.description")}
        </p>
        <div ref={rowsRef} className="tw-space-y-4">
          {metadata.map((item, index) => (
            <CreateDropMetadataRow
              key={item.id}
              isError={missingRequiredMetadataKeys.includes(item.key)}
              errorMessage={metadataErrorById[item.id] ?? null}
              onRemove={(rowIndex) => {
                onRemoveMetadata(rowIndex);
                addButtonRef.current?.focus();
              }}
              metadata={item}
              index={index}
              onChangeKey={onChangeKey}
              onChangeValue={onChangeValue}
              disabled={disabled}
            />
          ))}
        </div>
        <button
          ref={addButtonRef}
          type="button"
          onClick={() => {
            focusNewFieldIdRef.current = onAddMetadata();
          }}
          disabled={disabled}
          className="tw-mt-2 tw-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-300 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
        >
          <PlusIcon aria-hidden="true" className="tw-size-4 tw-shrink-0" />
          {t(locale, "waves.metadata.add")}
        </button>
      </div>
    </div>
  );
}
