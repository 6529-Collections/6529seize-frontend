"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  DROP_BATCH_STALE_TIME_MS,
  fetchDropsByIds,
  orderDropsByIds,
  seedDropCache,
} from "@/services/api/drop-api";

interface ArtistSubmission {
  id: string;
  imageUrl: string;
  mediaMimeType: string;
  title?: string | undefined;
  createdAt: number;
  drop?: ApiDrop | undefined;
}

interface User {
  id: string;
  handle?: string | null | undefined;
  level: number;
  cic: number;
  rep: number;
  pfp?: string | null | undefined;
  active_main_stage_submission_ids?: string[] | undefined;
}

interface UseUserArtSubmissionsReturn {
  submissions: ArtistSubmission[];
  submissionCount: number;
  isLoading: boolean;
  error: string | null;
}

interface UseSubmissionDropsReturn {
  submissionsWithDrops: ArtistSubmission[];
  isLoading: boolean;
  error: string | null;
}

const toArtistSubmission = (drop: ApiDrop): ArtistSubmission | null => {
  const firstMedia = drop.parts.at(0)?.media.at(0);
  if (!firstMedia?.url) {
    return null;
  }

  return {
    id: drop.id,
    imageUrl: firstMedia.url,
    mediaMimeType: firstMedia.mime_type,
    title: drop.title ?? undefined,
    createdAt: drop.created_at,
    drop,
  };
};

export const useSubmissionDrops = (
  submissions: ArtistSubmission[]
): UseSubmissionDropsReturn => {
  const queryClient = useQueryClient();
  const existingDropsById = useMemo(() => {
    const map = new Map<string, ApiDrop>();
    for (const submission of submissions) {
      if (submission.drop) {
        map.set(submission.id, submission.drop);
      }
    }
    return map;
  }, [submissions]);

  const missingDropIds = useMemo(
    () =>
      submissions
        .filter((submission) => !existingDropsById.has(submission.id))
        .map((submission) => submission.id),
    [existingDropsById, submissions]
  );
  const missingDropIdsKey = missingDropIds.join(",");

  const {
    data: fetchedDrops = [],
    isLoading,
    error,
  } = useQuery<ApiDrop[]>({
    queryKey: [
      QueryKey.DROP,
      {
        ids: missingDropIdsKey,
        scope: "submission-drops",
      },
    ],
    queryFn: async () => {
      const drops = await fetchDropsByIds(missingDropIds);
      seedDropCache(queryClient, drops);
      return drops;
    },
    enabled: missingDropIds.length > 0,
    staleTime: DROP_BATCH_STALE_TIME_MS,
  });

  const submissionsWithDrops = useMemo(() => {
    const fetchedDropsById = new Map(
      fetchedDrops.map((drop) => [drop.id, drop])
    );
    return submissions
      .map((submission) => ({
        ...submission,
        drop:
          existingDropsById.get(submission.id) ??
          fetchedDropsById.get(submission.id),
      }))
      .filter((submission) => submission.drop);
  }, [existingDropsById, fetchedDrops, submissions]);

  return {
    submissionsWithDrops,
    isLoading,
    error: error ? "Failed to load drop data" : null,
  };
};

export const useUserArtSubmissions = (
  user?: User
): UseUserArtSubmissionsReturn => {
  const queryClient = useQueryClient();
  const authorKey = useMemo(
    () => user?.handle ?? user?.id,
    [user?.handle, user?.id]
  );
  const activeSubmissionIds = useMemo(
    () => user?.active_main_stage_submission_ids ?? [],
    [user?.active_main_stage_submission_ids]
  );
  const activeSubmissionIdsKey = activeSubmissionIds.join(",");
  const queryKey = useMemo(
    () =>
      [
        QueryKey.PROFILE_DROPS,
        authorKey,
        "art-submissions",
        { ids: activeSubmissionIdsKey },
      ] as const,
    [activeSubmissionIdsKey, authorKey]
  );

  const {
    data: drops,
    isLoading,
    error,
  } = useQuery<ApiDrop[]>({
    queryKey,
    queryFn: async () => {
      const result = await fetchDropsByIds(activeSubmissionIds);
      seedDropCache(queryClient, result);
      return orderDropsByIds(activeSubmissionIds, result);
    },
    enabled: !!user && activeSubmissionIds.length > 0,
    staleTime: DROP_BATCH_STALE_TIME_MS,
  });

  const submissions = useMemo(() => {
    if (!drops || !user) return [];

    return drops
      .filter((drop) => drop.drop_type === ApiDropType.Participatory)
      .map(toArtistSubmission)
      .filter((submission): submission is ArtistSubmission => !!submission);
  }, [drops, user]);

  return {
    submissions,
    submissionCount: submissions.length,
    isLoading,
    error: error?.message ?? null,
  };
};
