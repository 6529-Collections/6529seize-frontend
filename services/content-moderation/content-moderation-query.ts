import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { QueryClient } from "@tanstack/react-query";

const CONTENT_PRESENTATION_QUERY_ROOTS = [
  QueryKey.DROP,
  QueryKey.DROPS,
  QueryKey.DROPS_LEADERBOARD,
  QueryKey.PROFILE_DROPS,
  QueryKey.IDENTITY_NOTIFICATIONS,
  QueryKey.WAVES_V2,
] as const;

export const invalidateContentModerationPresentation = async (
  queryClient: QueryClient
): Promise<void> => {
  await Promise.all(
    CONTENT_PRESENTATION_QUERY_ROOTS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    )
  );
};
