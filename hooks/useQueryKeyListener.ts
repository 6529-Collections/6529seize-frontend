"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useQueryKeyListener(
  queryKey: string | string[],
  callback: () => void
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.query.queryKey === queryKey ||
        (Array.isArray(queryKey) &&
          JSON.stringify(event?.query.queryKey) === JSON.stringify(queryKey))
      ) {
        callback();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, queryKey, callback]);
}
