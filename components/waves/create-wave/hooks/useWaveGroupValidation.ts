import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getWaveGroupValidationRequest } from "@/helpers/waves/wave-group-validation.helpers";
import { validateWaveGroups } from "@/services/api/wave-group-validation-api";
import type { CreateWaveConfig } from "@/types/waves.types";

export const useWaveGroupValidation = (config: CreateWaveConfig) => {
  const request = useMemo(
    () =>
      getWaveGroupValidationRequest({
        groups: config.groups,
        waveType: config.overview.type,
        chatEnabled: config.chat.enabled,
      }),
    [config.chat.enabled, config.groups, config.overview.type]
  );

  return useQuery({
    queryKey: [QueryKey.WAVE_GROUP_VALIDATION, request],
    queryFn: ({ signal }) => validateWaveGroups(request, signal),
    enabled: request.visibility_group_id !== null,
    retry: false,
    staleTime: 15_000,
  });
};
