interface NftSuggestFooterProps {
  readonly hiddenCount: number;
  readonly onToggleSpam: () => void;
}

export function NftSuggestFooter({ hiddenCount, onToggleSpam }: NftSuggestFooterProps) {
  if (hiddenCount <= 0) {
    return null;
  }
  return (
    <div className="tw-border-t tw-border-iron-700 tw-px-3 tw-py-2 tw-text-xs tw-text-amber-300">
      Filtered suspected spam collections ({hiddenCount}).
      <button
        type="button"
        className="tw-ml-2 tw-text-primary-400 hover:tw-underline"
        onClick={onToggleSpam}
      >
        Show anyway
      </button>
    </div>
  );
}
