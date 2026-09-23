"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { NFTLite } from "@/entities/INFT";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

export type PublishedMemesStatus = "loading" | "ready" | "error";

interface MemesLiteResponse {
  readonly data: NFTLite[];
}

const EMPTY_PUBLISHED_MEME_IDS = new Set<number>();

function getPublishedMemeIds(memes: readonly NFTLite[]): ReadonlySet<number> {
  return new Set(memes.map((meme) => meme.id));
}

export default function usePublishedMemes() {
  const query = useQuery({
    queryKey: [QueryKey.MEMES_LITE],
    queryFn: async () => {
      const response = await commonApiFetch<MemesLiteResponse>({
        endpoint: "memes_lite",
      });
      return response.data;
    },
    select: getPublishedMemeIds,
    staleTime: 60_000,
  });

  let status: PublishedMemesStatus = "ready";
  if (query.isPending) {
    status = "loading";
  } else if (query.isError) {
    status = "error";
  }

  return {
    publishedMemeIds: query.data ?? EMPTY_PUBLISHED_MEME_IDS,
    status,
  };
}
