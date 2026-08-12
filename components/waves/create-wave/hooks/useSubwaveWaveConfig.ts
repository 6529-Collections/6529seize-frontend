"use client";

import { useEffect, useState } from "react";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { commonApiFetch } from "@/services/api/common-api";
import type { CreateWaveConfig } from "@/types/waves.types";
import { useWaveConfig } from "./useWaveConfig";

export function useSubwaveWaveConfig({
  parentAdminGroupId,
}: {
  readonly parentAdminGroupId?: string | null | undefined;
}) {
  const waveConfig = useWaveConfig();
  const [parentAdminGroup, setParentAdminGroup] = useState<ApiGroupFull | null>(
    null
  );

  useEffect(() => {
    if (!parentAdminGroupId) {
      return;
    }

    const abortController = new AbortController();
    void commonApiFetch<ApiGroupFull>({
      endpoint: `groups/${parentAdminGroupId}`,
      signal: abortController.signal,
    })
      .then(setParentAdminGroup)
      .catch(() => {
        // Submission can safely use the inherited ID without the optional
        // display details supplied by this request.
      });

    return () => abortController.abort();
  }, [parentAdminGroupId]);

  const config: CreateWaveConfig = parentAdminGroupId
    ? {
        ...waveConfig.config,
        groups: {
          ...waveConfig.config.groups,
          admin: waveConfig.config.groups.admin ?? parentAdminGroupId,
        },
      }
    : waveConfig.config;
  const groupsCache =
    parentAdminGroupId && parentAdminGroup?.id === parentAdminGroupId
      ? {
          ...waveConfig.groupsCache,
          [parentAdminGroup.id]: parentAdminGroup,
        }
      : waveConfig.groupsCache;

  return {
    ...waveConfig,
    config,
    groupsCache,
  };
}
