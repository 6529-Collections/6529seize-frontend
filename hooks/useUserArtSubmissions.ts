"use client"

import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

interface ArtistSubmission {
  id: string;
  imageUrl: string;
  mediaMimeType: string;
  title?: string;
  createdAt: number;
  drop?: ApiDrop;
}

interface User {
  id: string;
  handle?: string | null;
  level: number;
  cic: number;
  rep: number;
  pfp?: string | null;
  active_main_stage_submission_ids?: string[];
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

const fetchDrop = (dropId: string) =>
  commonApiFetch<ApiDrop>({
    endpoint: `drops/${dropId}`,
  });

export const useSubmissionDrops = (submissions: ArtistSubmission[]): UseSubmissionDropsReturn => {
  const dropQueries = useQueries({
    queries: submissions.map(submission => ({
      queryKey: [QueryKey.DROP, { drop_id: submission.id }],
      queryFn: () => fetchDrop(submission.id),
      enabled: !!submission.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }))
  });

  const submissionsWithDrops = useMemo(() => {
    return submissions.map((submission, index) => {
      const dropQuery = dropQueries[index];
      return {
        ...submission,
        drop: dropQuery?.data
      };
    }).filter(submission => submission.drop);
  }, [submissions, dropQueries]);

  const isLoading = dropQueries.some(query => query.isLoading);
  const hasError = dropQueries.some(query => query.error);
  const error = hasError ? "Failed to load drop data" : null;
  
  return {
    submissionsWithDrops,
    isLoading,
    error
  };
};

export const useUserArtSubmissions = (user?: User): UseUserArtSubmissionsReturn => {
  // Stable query key to prevent unnecessary re-renders
  const authorKey = useMemo(() => user?.handle ?? user?.id, [user?.handle, user?.id]);
  const queryKey = useMemo(() => [QueryKey.PROFILE_DROPS, authorKey, 'art-submissions'] as const, [authorKey]);

  // Query to fetch user's participatory drops (art submissions)
  const { data: drops, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.handle && !user?.id) return [];
      
      const params: Record<string, string> = {
        limit: '50',
        author: user.handle ?? user.id,
        drop_type: ApiDropType.Participatory,
      };
      
      
      const result = await commonApiFetch<ApiDrop[]>({
        endpoint: '/drops',
        params,
      });
      
      return result;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Transform API drops to ArtistSubmission format  
  const submissions = useMemo(() => {
    if (!drops || !user) return [];
    
    // Get the active main stage submission IDs from the user profile
    const activeSubmissionIds = user.active_main_stage_submission_ids || [];
    
    const realSubmissions = drops
      .filter(drop => drop.drop_type === ApiDropType.Participatory)
      .filter(drop => activeSubmissionIds.includes(drop.id)) // Only show ongoing main stage submissions
      .map(drop => {
        const firstMedia = drop.parts?.[0]?.media?.[0];
        const imageUrl = firstMedia?.url || '';
        const mediaMimeType = firstMedia?.mime_type || 'image/jpeg';
        
        return {
          id: drop.id,
          imageUrl,
          mediaMimeType,
          title: drop.title || undefined,
          createdAt: drop.created_at,
        };
      })
      .filter(submission => submission.imageUrl);
    
    return realSubmissions;
  }, [drops, user]);

  return {
    submissions,
    submissionCount: submissions.length,
    isLoading,
    error: error?.message || null,
  };
};