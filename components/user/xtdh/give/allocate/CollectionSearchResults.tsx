"use client";

import type { SearchResult } from "./utils";
import { short } from "./utils";

export default function CollectionSearchResults({
  results,
  loading,
  error,
  selectedAddress,
  onSelect,
}: {
  readonly results: SearchResult[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly selectedAddress: string | null;
  readonly onSelect: (r: SearchResult) => void;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1 tw-max-h-72 tw-overflow-auto">
      {loading && <div className="tw-text-iron-300 tw-text-sm">Searching…</div>}
      {error && <div className="tw-text-red-400 tw-text-sm">{error}</div>}
      {!loading && !error && results.length > 0 &&
        results.map((r) => (
          <button
            key={r.address}
            onClick={() => onSelect(r)}
            className={`tw-w-full tw-text-left tw-px-3 tw-py-2 tw-rounded hover:tw-bg-iron-800 tw-transition ${
              selectedAddress === r.address ? "tw-bg-iron-800 tw-border tw-border-iron-700" : ""
            }`}
          >
            <div className="tw-text-iron-100 tw-text-sm">{r.name || r.address}</div>
            <div className="tw-text-iron-500 tw-text-xs">{short(r.address)} • {r.standard}</div>
          </button>
        ))}
      {!loading && !error && results.length === 0 && (
        <div className="tw-text-iron-300 tw-text-sm">No results.</div>
      )}
    </div>
  );
}

