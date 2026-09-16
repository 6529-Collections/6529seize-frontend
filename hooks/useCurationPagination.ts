export function useCurationPagination({
  fetchNextPage,
  hasNextPage,
  isFetching,
  isError,
}: {
  readonly fetchNextPage: () => Promise<void>;
  readonly hasNextPage: boolean | undefined;
  readonly isFetching: boolean;
  readonly isError: boolean;
}) {
  return {
    // Remount the sentinel when a save releases the fetch lock so its observer
    // reports the still-visible state again without waiting for another scroll.
    sentinelKey: `${Boolean(hasNextPage)}:${isFetching}:${isError}`,
    onIntersection: (isVisible: boolean) => {
      if (!isVisible || !hasNextPage || isFetching || isError) return;
      void fetchNextPage();
    },
  };
}
