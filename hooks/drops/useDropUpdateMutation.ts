import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../services/api/common-api";
import { ApiUpdateDropRequest } from "../../generated/models/ApiUpdateDropRequest";
import { ApiDrop } from "../../generated/models/ApiDrop";
import { ReactQueryWrapperContext } from "../../components/react-query-wrapper/ReactQueryWrapper";
import { useContext } from "react";
import { AuthContext } from "../../components/auth/Auth";
import { useMyStream } from "../../contexts/wave/MyStreamContext";
import { ProcessIncomingDropType } from "../../contexts/wave/hooks/useWaveRealtimeUpdater";

export interface DropUpdateMutationParams {
  dropId: string;
  request: ApiUpdateDropRequest;
  currentDrop: ApiDrop;
}

export const useDropUpdateMutation = () => {
  const { setToast } = useContext(AuthContext);
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const myStreamContext = useMyStream();

  return useMutation({
    mutationFn: async ({ dropId, request }: DropUpdateMutationParams) => {
      return await commonApiPost<ApiUpdateDropRequest, ApiDrop>({
        endpoint: `drops/${dropId}`,
        body: request,
      });
    },
    onSuccess: (updatedDrop) => {
      setToast({
        message: "Drop updated successfully",
        type: "success",
      });

      // Update the drop in wave messages store using existing processIncomingDrop
      if (myStreamContext?.processIncomingDrop) {
        myStreamContext.processIncomingDrop(
          updatedDrop, 
          ProcessIncomingDropType.DROP_INSERT // This will merge/update the drop
        );
      }

      // Invalidate drops queries to ensure fresh data
      invalidateDrops();
    },
    onError: (error) => {
      console.error("Failed to update drop:", error);
      
      // Check if it's a time limit error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("can't be edited after")) {
        setToast({
          message: "This drop can no longer be edited. Drops can only be edited within 5 minutes of creation.",
          type: "error",
        });
      } else {
        setToast({
          message: "Failed to update drop. Please try again.",
          type: "error",
        });
      }
    },
  });
};