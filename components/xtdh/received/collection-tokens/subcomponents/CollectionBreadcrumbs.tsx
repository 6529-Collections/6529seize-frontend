interface CollectionBreadcrumbsProps {
  readonly collectionLabel: string;
  readonly tokenLabel?: string;
  readonly onNavigateToCollections: () => void;
  readonly onNavigateToTokens?: () => void;
}

export function CollectionBreadcrumbs({
  collectionLabel,
  tokenLabel,
  onNavigateToCollections,
  onNavigateToTokens,
}: Readonly<CollectionBreadcrumbsProps>) {
  const crumbs = [
    {
      label: "Received collections",
      onClick: onNavigateToCollections,
    },
    {
      label: collectionLabel,
      onClick: tokenLabel ? onNavigateToTokens : undefined,
    },
    tokenLabel
      ? {
          label: tokenLabel,
        }
      : null,
  ].filter(Boolean) as { label: string; onClick?: () => void }[];

  if (!crumbs.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="tw-flex tw-items-center">
      <ol className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-text-iron-400">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.label} className="tw-flex tw-items-center tw-gap-2">
              {crumb.onClick ? (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-iron-800 tw-bg-transparent tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-200 desktop-hover:hover:tw-bg-iron-900"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="tw-text-iron-100">{crumb.label}</span>
              )}
              {isLast ? null : <span className="tw-text-iron-500">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
