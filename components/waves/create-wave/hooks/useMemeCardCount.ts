"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";

export function useMemeCardCount({ enabled }: { readonly enabled: boolean }) {
  return useQuery<number, Error>({
    queryKey: [QueryKey.MEMES_LATEST, { scope: "meme-card-set-count" }],
    queryFn: async () => {
      const response = await commonApiFetch<{ count: number }>({
        endpoint: "memes_extended_data",
        params: {
          page_size: "1",
        },
      });
      return response.count;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
