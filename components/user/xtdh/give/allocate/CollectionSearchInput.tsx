"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

export default function CollectionSearchInput({
  value,
  onChange,
  placeholder = "Search collection by name or paste address",
}: {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly placeholder?: string;
}) {
  return (
    <div className="tw-relative tw-w-full">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="tw-w-full tw-bg-iron-800 tw-text-iron-100 tw-rounded tw-border tw-border-iron-700 tw-px-3 tw-py-2 tw-pr-10 focus:tw-outline-none focus:tw-border-primary-500"
      />
      {value ? (
        <button
          type="button"
          className="tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3 tw-text-iron-300 hover:tw-text-iron-100 tw-transition"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <XMarkIcon className="tw-w-5 tw-h-5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
