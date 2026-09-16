"use client";

import { useEffect, useState } from "react";

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
  const [isVisible, setIsVisible] = useState(false);
  // A save can temporarily block pagination while the sentinel stays visible.
  // Resume after that fetch settles, without requiring another scroll event.
  useEffect(() => {
    if (isVisible && hasNextPage && !isFetching && !isError) {
      void fetchNextPage();
    }
  }, [isVisible, hasNextPage, isFetching, isError, fetchNextPage]);
  return setIsVisible;
}
