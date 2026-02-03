import { useQuery } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

interface UseWavesSearchProps {
  readonly name: string;
}

export function useWavesSearch({ name }: UseWavesSearchProps) {
  const trimmedName = name.trim();

  const { data: waves } = useQuery<ApiWave[]>({
    queryKey: [QueryKey.WAVES_SEARCH, { name: trimmedName }],
    queryFn: async () => {
      const params: Record<string, string> = {
        name: trimmedName,
        limit: "5",
        direct_message: "false",
      };
      return await commonApiFetch<ApiWave[]>({
        endpoint: "waves",
        params,
      });
    },
    enabled: trimmedName.length >= 2,
  });

  return { waves: waves ?? [] };
}
