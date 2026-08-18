import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getWaveGroupValidationRequest } from "@/helpers/waves/wave-group-validation.helpers";
import { validateWaveGroups } from "@/services/api/wave-group-validation-api";
import type { CreateWaveConfig } from "@/types/waves.types";

export const useWaveGroupValidation = (config: CreateWaveConfig) => {
  const { admin, canChat, canDrop, canView, canVote } = config.groups;
  const request = useMemo(
    () =>
      getWaveGroupValidationRequest({
        groups: {
          admin,
          canChat,
          canDrop,
          canView,
          canVote,
        },
        waveType: config.overview.type,
        chatEnabled: config.chat.enabled,
        includeAuthenticatedUserAsAdmin: true,
      }),
    [
      admin,
      canChat,
      canDrop,
      canView,
      canVote,
      config.chat.enabled,
      config.overview.type,
    ]
  );

  return useQuery({
    queryKey: [QueryKey.WAVE_GROUP_VALIDATION, request],
    queryFn: ({ signal }) => validateWaveGroups(request, signal),
    enabled: request.visibility_group_id !== null,
    retry: false,
    staleTime: 15_000,
  });
};
