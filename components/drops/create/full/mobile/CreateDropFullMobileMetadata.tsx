"use client";

import CreateDropMetadataItems from "@/components/drops/create/utils/metadata/CreateDropMetadataItems";
import type { DropMetadata } from "@/entities/IDrop";
import { useState } from "react";

export default function CreateDropFullMobileMetadata({
  metadata,
  onMetadataEdit,
  onMetadataRemove,
  disabled = false,
}: {
  readonly metadata: DropMetadata[];
  readonly onMetadataEdit: (param: DropMetadata) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly disabled?: boolean | undefined;
}) {
  const [key, setKey] = useState<string | null>(null);
  const [value, setValue] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) {
      return;
    }
    if (key && value) {
      onMetadataEdit({ data_key: key, data_value: value });
      setKey(null);
      setValue(null);
    }
  };

  return (
    <div>
      <p className="tw-mb-0 tw-block tw-text-sm tw-font-medium tw-text-iron-300">
        Metadata
      </p>
      <CreateDropMetadataItems
        items={metadata}
        onMetadataRemove={onMetadataRemove}
        disabled={disabled}
      />
      <form onSubmit={onSubmit} className="tw-space-y-3 lg:tw-space-y-0">
        <input
          type="text"
          placeholder="Category"
          value={key ?? ""}
          onChange={(e) => {
            if (!disabled) {
              setKey(e.target.value);
            }
          }}
          disabled={disabled}
          maxLength={100}
          className="tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-py-2.5 tw-pr-3 tw-text-md tw-font-normal tw-leading-6 tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-400 hover:tw-ring-iron-700 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
        />
        <input
          type="text"
          placeholder="Value"
          value={value ?? ""}
          onChange={(e) => {
            if (!disabled) {
              setValue(e.target.value);
            }
          }}
          disabled={disabled}
          maxLength={500}
          className="tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-py-2.5 tw-pr-3 tw-text-md tw-font-normal tw-leading-6 tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-400 hover:tw-ring-iron-700 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
        />
        <button
          type="submit"
          disabled={disabled}
          className="tw-inline-flex tw-items-center tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 focus:tw-z-10 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
        >
          Add
        </button>
      </form>
    </div>
  );
}
