"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiSetPinnedDropRequest } from "@/generated/models/ApiSetPinnedDropRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

interface SetWavePinnedDropInput {
  readonly dropId: string;
}

interface UseSetWavePinnedDropOptions {
  readonly onSuccess?:
    | ((wave: ApiWave, input: SetWavePinnedDropInput) => void)
    | undefined;
  readonly onError?:
    | ((message: string, error: unknown, input: SetWavePinnedDropInput) => void)
    | undefined;
}

interface UseSetWavePinnedDropResult {
  readonly setPinnedDrop: (input: SetWavePinnedDropInput) => Promise<ApiWave>;
  readonly data: ApiWave | undefined;
  readonly isPending: boolean;
  readonly pendingDropId: string | null;
  readonly error: unknown;
  readonly errorMessage: string | null;
  readonly reset: () => void;
}

const toErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong";
};

export function useSetWavePinnedDrop(
  waveId: string,
  options?: UseSetWavePinnedDropOptions
): UseSetWavePinnedDropResult {
  const queryClient = useQueryClient();
  const [pendingDropId, setPendingDropId] = useState<string | null>(null);

  const mutation = useMutation<ApiWave, unknown, SetWavePinnedDropInput>({
    mutationFn: async ({ dropId }) =>
      await commonApiPost<ApiSetPinnedDropRequest, ApiWave>({
        endpoint: `waves/${waveId}/pinned-drop`,
        body: {
          drop_id: dropId,
        },
      }),
    onSuccess: async (wave, input) => {
      queryClient.setQueryData<ApiWave>(
        [QueryKey.WAVE, { wave_id: waveId }],
        wave
      );
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.DROPS],
        predicate: (query) => {
          const [, params] = query.queryKey;
          return (
            typeof params === "object" &&
            params !== null &&
            Reflect.get(params, "waveId") === waveId
          );
        },
      });
      options?.onSuccess?.(wave, input);
    },
    onError: (error, input) => {
      options?.onError?.(toErrorMessage(error), error, input);
    },
    onSettled: () => {
      setPendingDropId(null);
    },
  });

  const setPinnedDrop = useCallback(
    async (input: SetWavePinnedDropInput): Promise<ApiWave> => {
      setPendingDropId(input.dropId);
      return await mutation.mutateAsync(input);
    },
    [mutation]
  );

  const errorMessage = useMemo(() => {
    if (mutation.error === null) {
      return null;
    }
    return toErrorMessage(mutation.error);
  }, [mutation.error]);

  return {
    setPinnedDrop,
    data: mutation.data,
    isPending: mutation.isPending,
    pendingDropId,
    error: mutation.error,
    errorMessage,
    reset: mutation.reset,
  };
}
