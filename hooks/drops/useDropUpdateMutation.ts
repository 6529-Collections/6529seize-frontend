"use client";

import { useMutation } from "@tanstack/react-query";
import { getStructuredApiErrorCode } from "@/services/api/common-api";
import { postDropUpdate } from "@/services/api/signed-drop-writes";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ApiUpdateDropRequest } from "@/generated/models/ApiUpdateDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useContext } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useMyStreamActions } from "@/contexts/wave/MyStreamContext";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";

interface DropUpdateMutationParams {
  dropId: string;
  request: ApiUpdateDropRequest;
  currentDrop: ApiDrop;
}

export const useDropUpdateMutation = () => {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const myStreamContext = useMyStreamActions();

  return useMutation({
    mutationFn: async ({
      dropId,
      request,
      currentDrop,
    }: DropUpdateMutationParams) =>
      await postDropUpdate({ dropId, waveId: currentDrop.wave.id }, request, {
        errorMode: "structured",
      }),
    onSuccess: (updatedDrop) => {
      setToast({
        message: "Drop updated.",
        type: "success",
      });

      // Update the drop in wave messages store using existing processIncomingDrop
      if (myStreamContext?.processIncomingDrop) {
        void myStreamContext.processIncomingDrop(
          updatedDrop,
          ProcessIncomingDropType.DROP_INSERT // This will merge/update the drop
        );
      }

      // Invalidate drops queries to ensure fresh data
      invalidateDrops();
    },
    onError: (error) => {
      if (getStructuredApiErrorCode(error) === "MODERATION_PERMIT_CONSUMED") {
        setToast({
          message: t(locale, "contentModeration.approvalConsumed"),
          type: "error",
        });
        return;
      }
      console.error("Failed to update drop:", error);

      // Check if it's a time limit error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("can't be edited after")) {
        setToast({
          message:
            "This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.",
          type: "error",
        });
      } else {
        setToast({
          message: "Couldn't update this drop. Please try again.",
          type: "error",
        });
      }
    },
  });
};
