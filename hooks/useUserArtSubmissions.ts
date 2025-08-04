import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../services/api/common-api";
import { ApiDrop } from "../generated/models/ApiDrop";
import { ApiDropType } from "../generated/models/ApiDropType";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

interface ArtistSubmission {
  id: string;
  imageUrl: string;
  mediaMimeType: string;
  title?: string;
  createdAt: number;
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

export const useUserArtSubmissions = (user?: User): UseUserArtSubmissionsReturn => {
  // Query to fetch user's participatory drops (art submissions)
  const { data: drops, isLoading, error } = useQuery({
    queryKey: [QueryKey.PROFILE_DROPS, user?.handle || user?.id, 'art-submissions'],
    queryFn: async () => {
      if (!user?.handle && !user?.id) return [];
      
      const params: Record<string, string> = {
        limit: '50',
        author: user.handle ?? user.id,
        drop_type: ApiDropType.Participatory,
      };
      
      console.log(`[DEBUG] Fetching art submissions for user:`, {
        userHandle: user.handle,
        userId: user.id,
        authorParam: user.handle ?? user.id,
        params
      });
      
      const result = await commonApiFetch<ApiDrop[]>({
        endpoint: '/drops',
        params,
      });
      
      console.log(`[DEBUG] API returned ${result?.length || 0} drops for ${user.handle ?? user.id}:`, result);
      
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
    
    return drops
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
  }, [drops, user]);

  return {
    submissions,
    submissionCount: submissions.length,
    isLoading,
    error: error?.message || null,
  };
};