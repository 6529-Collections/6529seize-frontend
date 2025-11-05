"use client";

import CreateDropMetadataItems from "@/components/drops/create/utils/metadata/CreateDropMetadataItems";
import { DropMetadata } from "@/entities/IDrop";
import { useRef, useState } from "react";

export default function CreateDropFullDesktopMetadata({
  metadata,
  onMetadataEdit,
  onMetadataRemove,
}: {
  readonly metadata: DropMetadata[];
  readonly onMetadataEdit: (param: DropMetadata) => void;
  readonly onMetadataRemove: (key: string) => void;
}) {
  const [key, setKey] = useState<string | null>(null);
  const [value, setValue] = useState<string | null>(null);

  const metadataKeyRef = useRef<HTMLInputElement>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (key && value) {
      onMetadataEdit({ data_key: key, data_value: value });
      setKey(null);
      setValue(null);
      metadataKeyRef.current?.focus();
    }
  };

  return (
    <div>
      <label
        htmlFor="metadata-form"
        className="tw-block tw-font-medium tw-text-iron-300 tw-text-sm">
        Metadata
      </label>
      <form
        id="metadata-form"
        onSubmit={onSubmit}
        className="tw-mt-1.5 tw-flex tw-items-center tw-gap-x-3 tw-w-full">
        <div className="tw-w-full">
          <input
            ref={metadataKeyRef}
            type="text"
            placeholder="Category"
            value={key ?? ""}
            onChange={(e) => setKey(e.target.value)}
            maxLength={100}
            className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-800 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-iron-700 focus:tw-ring-primary-400 tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
        <div className="tw-w-full">
          <input
            type="text"
            placeholder="Value"
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value)}
            maxLength={500}
            className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-800 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-iron-700 focus:tw-ring-primary-400 tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
        <button
          type="submit"
          aria-label="Add metadata"
          title="Add metadata"
          className="tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-2.5 tw-py-2.5 tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 hover:tw-text-iron-200 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out">
          <svg
            className="tw-w-5 tw-h-5 tw-flex"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
      <CreateDropMetadataItems
        items={metadata}
        onMetadataRemove={onMetadataRemove}
      />
    </div>
  );
}
