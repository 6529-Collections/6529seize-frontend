"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import type { ApiWaveCurationRequest } from "@/generated/models/ApiWaveCurationRequest";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import {
  getWaveCurationsQueryKey,
  sortWaveCurations,
} from "./useWaveCurations";

type WaveCurationMoveDirection = "previous" | "next";

interface MoveWaveCurationVariables {
  readonly curation: ApiWaveCuration;
  readonly targetPriorityOrder: number;
}

interface MoveWaveCurationContext {
  readonly previousCurations?: ApiWaveCuration[] | undefined;
}

interface MoveCurationParams {
  readonly curation: ApiWaveCuration;
  readonly direction: WaveCurationMoveDirection;
  readonly curations: readonly ApiWaveCuration[];
}

interface ReorderCurationParams {
  readonly curation: ApiWaveCuration;
  readonly targetPriorityOrder: number;
  readonly curations: readonly ApiWaveCuration[];
}

const getMovedCurations = ({
  curations,
  curationId,
  targetPriorityOrder,
}: {
  readonly curations: readonly ApiWaveCuration[];
  readonly curationId: string;
  readonly targetPriorityOrder: number;
}): ApiWaveCuration[] => {
  const orderedCurations = sortWaveCurations(curations);
  const currentIndex = orderedCurations.findIndex(
    (curation) => curation.id === curationId
  );

  if (currentIndex < 0) {
    return orderedCurations;
  }

  const targetIndex = Math.max(
    0,
    Math.min(targetPriorityOrder - 1, orderedCurations.length - 1)
  );

  if (targetIndex === currentIndex) {
    return orderedCurations;
  }

  const nextCurations = [...orderedCurations];
  const [movedCuration] = nextCurations.splice(currentIndex, 1);

  if (!movedCuration) {
    return orderedCurations;
  }

  nextCurations.splice(targetIndex, 0, movedCuration);

  return nextCurations.map((curation, index) => ({
    ...curation,
    priority_order: index + 1,
  }));
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Failed to update curation order.";
};

export function useWaveCurationReorderMutation({
  waveId,
}: {
  readonly waveId: string;
}) {
  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useAuth();
  const queryKey = useMemo(() => getWaveCurationsQueryKey(waveId), [waveId]);

  const mutation = useMutation<
    ApiWaveCuration,
    Error,
    MoveWaveCurationVariables,
    MoveWaveCurationContext
  >({
    mutationFn: async ({ curation, targetPriorityOrder }) => {
      const auth = await requestAuth();
      if (!auth.success) {
        throw new Error("Authentication was cancelled.");
      }

      const body: ApiWaveCurationRequest = {
        name: curation.name,
        group_id: curation.group_id,
        priority_order: targetPriorityOrder,
      };

      return await commonApiPost<ApiWaveCurationRequest, ApiWaveCuration>({
        endpoint: `waves/${waveId}/curations/${curation.id}`,
        body,
        errorMode: "structured",
      });
    },
    onMutate: async ({ curation, targetPriorityOrder }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousCurations =
        queryClient.getQueryData<ApiWaveCuration[]>(queryKey);

      queryClient.setQueryData<ApiWaveCuration[]>(queryKey, (current) =>
        current
          ? getMovedCurations({
              curations: current,
              curationId: curation.id,
              targetPriorityOrder,
            })
          : current
      );

      return { previousCurations };
    },
    onSuccess: (savedCuration) => {
      queryClient.setQueryData<ApiWaveCuration[]>(queryKey, (current) => {
        if (!current) {
          return [savedCuration];
        }

        return sortWaveCurations(
          current.map((curation) =>
            curation.id === savedCuration.id ? savedCuration : curation
          )
        );
      });

      setToast({
        type: "success",
        message: "Curation order updated.",
      });
    },
    onError: (error, _variables, context) => {
      if (context?.previousCurations !== undefined) {
        queryClient.setQueryData(queryKey, context.previousCurations);
      }

      setToast({
        type: "error",
        title: "Couldn't update the curation order.",
        description: "Please try again.",
        details: getToastErrorDetails(error, getErrorMessage(error)),
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
  const { isPending, mutate, variables } = mutation;
  const pendingVariables: MoveWaveCurationVariables | undefined = isPending
    ? variables
    : undefined;

  const moveCuration = useCallback(
    ({ curation, direction, curations }: MoveCurationParams) => {
      const orderedCurations = sortWaveCurations(curations);
      const currentIndex = orderedCurations.findIndex(
        (item) => item.id === curation.id
      );

      if (currentIndex < 0) {
        return;
      }

      const targetIndex =
        direction === "previous" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= orderedCurations.length) {
        return;
      }

      mutate({
        curation,
        targetPriorityOrder: targetIndex + 1,
      });
    },
    [mutate]
  );

  const reorderCuration = useCallback(
    ({ curation, targetPriorityOrder, curations }: ReorderCurationParams) => {
      const orderedCurations = sortWaveCurations(curations);
      const currentIndex = orderedCurations.findIndex(
        (item) => item.id === curation.id
      );
      const targetIndex = targetPriorityOrder - 1;

      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= orderedCurations.length ||
        targetIndex === currentIndex
      ) {
        return;
      }

      mutate({
        curation,
        targetPriorityOrder,
      });
    },
    [mutate]
  );

  return {
    moveCuration,
    reorderCuration,
    isPending,
    pendingCurationId: pendingVariables?.curation.id ?? null,
  };
}
