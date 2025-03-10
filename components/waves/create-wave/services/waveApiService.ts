import { ApiCreateNewWave } from "../../../../generated/models/ApiCreateNewWave";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { commonApiPost } from "../../../../services/api/common-api";
import { UseMutationResult, useMutation } from "@tanstack/react-query";

/**
 * Custom hook for wave creation mutation
 * @param options Configuration options for the mutation
 * @returns UseMutation result
 */
export const useAddWaveMutation = (options: {
  onSuccess: (response: ApiWave) => void;
  onError: (error: unknown) => void;
  onSettled: () => void;
}): UseMutationResult<ApiWave, unknown, ApiCreateNewWave, unknown> => {
  return useMutation({
    mutationFn: async (body: ApiCreateNewWave) =>
      await commonApiPost<ApiCreateNewWave, ApiWave>({
        endpoint: `waves`,
        body,
      }),
    onSuccess: options.onSuccess,
    onError: options.onError,
    onSettled: options.onSettled,
  });
};