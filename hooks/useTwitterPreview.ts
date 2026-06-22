import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { TweetPreview } from "@/lib/twitter";
import { parseTweetUrl } from "@/lib/twitter/url";
import { fetchTwitterPreview } from "@/services/api/twitter-preview-api";

const TWITTER_PREVIEW_STALE_TIME_MS = 10 * 60 * 1000;
const TWITTER_PREVIEW_GC_TIME_MS = 60 * 60 * 1000;

const getTwitterPreviewCacheKey = (href: string, tweetId: string): string =>
  parseTweetUrl(href)?.tweetId ?? tweetId;

export function useTwitterPreview({
  href,
  tweetId,
}: {
  readonly href: string;
  readonly tweetId: string;
}) {
  return useQuery<TweetPreview, Error>({
    queryKey: [
      QueryKey.TWITTER_PREVIEW,
      { tweetId: getTwitterPreviewCacheKey(href, tweetId) },
    ],
    queryFn: async () => await fetchTwitterPreview(href),
    staleTime: TWITTER_PREVIEW_STALE_TIME_MS,
    gcTime: TWITTER_PREVIEW_GC_TIME_MS,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
