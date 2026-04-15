"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDropCurationRequest } from "@/generated/models/ApiDropCurationRequest";
import { postDropCuration } from "@/services/api/drop-curations-api";
import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";

interface DropCurationOrderUpdate {
  readonly dropId: string;
  readonly priorityOrder: number;
}

export function useDropCurationOrderMutation({
  curationId,
}: {
  readonly curationId: string;
}) {
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const { setToast } = useAuth();

  const mutation = useMutation({
    mutationFn: async (updates: readonly DropCurationOrderUpdate[]) => {
      await Promise.all(
        updates.map(async ({ dropId, priorityOrder }) => {
          const body: ApiDropCurationRequest = {
            curation_id: curationId,
            priority_order: priorityOrder,
          };

          await postDropCuration({
            dropId,
            body,
          });
        })
      );
    },
    onSuccess: () => {
      invalidateDrops();
    },
    onError: (error) => {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Failed to update curation order.";

      setToast({
        type: "error",
        message,
      });
    },
  });

  return {
    persistOrderAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
