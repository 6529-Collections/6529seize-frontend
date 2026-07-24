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
      <Button
        variant="tertiary"
        size="md"
        onClick={onLoadMore}
        loading={isFetching}
      >
        Load More
      </Button>
    </div>
  );
}
import Button from "@/components/utils/button/Button";
