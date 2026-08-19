import type { ApiWaveGroupValidationRequest } from "@/generated/models/ApiWaveGroupValidationRequest";
import type { ApiWaveGroupValidationResponse } from "@/generated/models/ApiWaveGroupValidationResponse";
import { commonApiPost } from "./common-api";

export const validateWaveGroups = async (
  body: ApiWaveGroupValidationRequest,
  signal?: AbortSignal
): Promise<ApiWaveGroupValidationResponse> =>
  await commonApiPost<
    ApiWaveGroupValidationRequest,
    ApiWaveGroupValidationResponse
  >({
    endpoint: "wave-group-validation",
    body,
    signal,
  });
