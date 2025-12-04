interface CollectionBreadcrumbsProps {
  readonly collectionLabel: string;
  readonly tokenLabel?: string;
  readonly grantLabel?: string;
  readonly onNavigateToCollections: () => void;
  readonly onNavigateToTokens?: () => void;
  readonly onNavigateToContributors?: () => void;
}

export function CollectionBreadcrumbs({
  collectionLabel: _collectionLabel,
  tokenLabel,
  grantLabel,
  onNavigateToCollections,
  onNavigateToTokens,
  onNavigateToContributors,
}: Readonly<CollectionBreadcrumbsProps>) {
  // Determine the back action based on current depth
  const backAction = grantLabel
    ? onNavigateToContributors
    : tokenLabel
      ? onNavigateToTokens
      : onNavigateToCollections;

  const backLabel = grantLabel
    ? "Back"
    : tokenLabel
      ? "Back"
      : "Back to collections";

  if (!backAction) {
    return null;
  }

  return (
    <nav aria-label="Navigation" className="tw-flex tw-items-center">
      <button
        type="button"
        onClick={backAction}
        className="tw-inline-flex tw-items-center tw-gap-1.5 tw-bg-transparent tw-p-0 tw-border-none tw-outline-none tw-text-sm tw-font-medium tw-text-iron-400 tw-transition-colors desktop-hover:hover:tw-text-iron-200 focus:tw-outline-none focus:tw-ring-0"
      >
        <span aria-hidden="true">←</span>
        <span>{backLabel}</span>
      </button>
    </nav>
  );
}
