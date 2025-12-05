interface CollectionLoadMoreProps {
  readonly isVisible: boolean;
  readonly isFetching: boolean;
  readonly onLoadMore: () => void;
}

export function CollectionLoadMore({
  isVisible,
  isFetching,
  onLoadMore,
}: Readonly<CollectionLoadMoreProps>) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="tw-flex tw-justify-center">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isFetching}
        className="tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-transition tw-bg-iron-900 tw-text-iron-400 tw-border tw-border-solid tw-border-iron-800 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-300"
      >
        {isFetching ? "Loading..." : "Load More"}
      </button>
    </div>
  );
}
