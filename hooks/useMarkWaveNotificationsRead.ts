"use client";

import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { useCallback, useContext } from "react";

interface WaveReadRequestState {
  promise: Promise<void>;
  pending: boolean;
}

const inFlightWaveReadRequests = new Map<string, WaveReadRequestState>();

const sendWaveReadRequest = async (
  waveId: string,
  invalidateNotifications: () => void
): Promise<void> => {
  await commonApiPostWithoutBodyAndResponse({
    endpoint: `notifications/wave/${waveId}/read`,
  });
  invalidateNotifications();
};

const startWaveReadRequest = async (
  waveId: string,
  state: WaveReadRequestState,
  invalidateNotifications: () => void
): Promise<void> => {
  let requestError: unknown;
  let hasRequestError = false;

  try {
    await sendWaveReadRequest(waveId, invalidateNotifications);
  } catch (error) {
    requestError = error;
    hasRequestError = true;
  }

  try {
    if (state.pending) {
      state.pending = false;
      state.promise = startWaveReadRequest(
        waveId,
        state,
        invalidateNotifications
      );
      await state.promise;
      return;
    }

    if (hasRequestError) {
      throw requestError;
    }
  } finally {
    if (inFlightWaveReadRequests.get(waveId) === state) {
      inFlightWaveReadRequests.delete(waveId);
    }
  }
};

export function useMarkWaveNotificationsRead(): (
  waveId: string
) => Promise<void> {
  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);

  return useCallback(
    (waveId: string): Promise<void> => {
      const existingState = inFlightWaveReadRequests.get(waveId);
      if (existingState) {
        existingState.pending = true;
        return existingState.promise;
      }

      const state: WaveReadRequestState = {
        promise: Promise.resolve(),
        pending: false,
      };
      inFlightWaveReadRequests.set(waveId, state);
      state.promise = startWaveReadRequest(
        waveId,
        state,
        invalidateNotifications
      );
      return state.promise;
    },
    [invalidateNotifications]
  );
}
