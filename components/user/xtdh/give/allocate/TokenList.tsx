"use client";

export default function TokenList({
  tokens,
  selectedIds,
  onToggle,
  loading,
  hasMore,
  onLoadMore,
}: {
  readonly tokens: string[];
  readonly selectedIds: Set<string>;
  readonly onToggle: (id: string, checked: boolean) => void;
  readonly loading: boolean;
  readonly hasMore: boolean;
  readonly onLoadMore: () => void;
}) {
  return (
    <div className="tw-border tw-border-iron-800 tw-rounded tw-max-h-48 tw-overflow-auto">
      {tokens.length === 0 && loading && (
        <div className="tw-text-iron-300 tw-text-sm tw-p-2">Loading tokens…</div>
      )}
      {tokens.map((id) => {
        const checked = selectedIds.has(id);
        return (
          <label
            key={id}
            className="tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-border-b tw-border-iron-900 hover:tw-bg-iron-800"
          >
            <span className="tw-text-iron-200 tw-text-sm">Token #{id}</span>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onToggle(id, e.target.checked)}
            />
          </label>
        );
      })}
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="tw-w-full tw-text-center tw-py-2 tw-text-iron-300 hover:tw-bg-iron-800"
        >
          Load more
        </button>
      )}
    </div>
  );
}

