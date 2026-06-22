import { useQuery } from "@tanstack/react-query";

import { getWavePreviewQueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { SidebarWave } from "@/types/waves.types";

export function useCachedWavePreviewById(waveId: string | null) {
  const { data: wavePreview } = useQuery<SidebarWave>({
    queryKey: getWavePreviewQueryKey(waveId),
    queryFn: () => Promise.reject(new Error("Wave preview cache miss")),
    enabled: false,
    staleTime: 60000,
  });

  return { wavePreview };
}
