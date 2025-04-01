import { useQuery } from "@tanstack/react-query";
import { ApiWave } from "../generated/models/ApiWave";
import { commonApiFetch } from "../services/api/common-api";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
export const useIsMemesWave = (waveId: string | null) => {
  const { data } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: "1e618a16-f093-4e1b-94aa-3e86a5889bb0" }],
    queryFn: async () => {
      console.log('IS MEMES WAVE', waveId);
      return await commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
      });
    },
    staleTime: Infinity,
    enabled: !!waveId,
  });

  console.log('IS MEMES WAVE', data?.id, process.env.MEMES_WAVE_ID);
  return waveId === process.env.MEMES_WAVE_ID;
};
