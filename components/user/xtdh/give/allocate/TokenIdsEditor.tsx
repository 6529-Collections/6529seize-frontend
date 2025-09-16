"use client";

import { parseTokenIdsInput } from "./utils";

export default function TokenIdsEditor({
  selectedIds,
  onChange,
}: {
  readonly selectedIds: Set<string>;
  readonly onChange: (next: Set<string>) => void;
}) {
  const onAdd = (value: string) => {
    const next = new Set(selectedIds);
    for (const id of parseTokenIdsInput(value)) next.add(id);
    onChange(next);
  };
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <div className="tw-flex tw-gap-2 tw-flex-wrap">
        <input
          placeholder="Paste IDs or ranges e.g. 1,2,5-25"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const val = (e.target as HTMLInputElement).value;
              onAdd(val);
              (e.target as HTMLInputElement).value = "";
            }
          }}
          className="tw-bg-iron-800 tw-text-iron-100 tw-rounded tw-border tw-border-iron-700 tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-border-primary-500 tw-min-w-[260px]"
        />
        <div className="tw-text-iron-300 tw-text-xs tw-self-center">Selected: {selectedIds.size}</div>
        {selectedIds.size > 0 && (
          <button
            type="button"
            className="tw-text-xs tw-rounded tw-border tw-border-iron-700 tw-text-iron-200 tw-px-2 tw-py-1 hover:tw-bg-iron-800"
            onClick={() => onChange(new Set())}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

