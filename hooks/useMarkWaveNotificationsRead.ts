"use client";

import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { useCallback, useContext } from "react";

const inFlightWaveReadRequests = new Map<string, Promise<void>>();

export function useMarkWaveNotificationsRead(): (
  waveId: string
) => Promise<void> {
  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);

  return useCallback(
    (waveId: string): Promise<void> => {
      const existingRequest = inFlightWaveReadRequests.get(waveId);
      if (existingRequest) {
        return existingRequest;
      }

      const request = commonApiPostWithoutBodyAndResponse({
        endpoint: `notifications/wave/${waveId}/read`,
      })
        .then(() => {
          invalidateNotifications();
          return undefined;
        })
        .finally(() => {
          inFlightWaveReadRequests.delete(waveId);
        });

      inFlightWaveReadRequests.set(waveId, request);
      return request;
    },
    [invalidateNotifications]
  );
}
