import type { ApiDropForgeFundingRequest } from "@/generated/models/ApiDropForgeFundingRequest";
import type { ApiDropForgeFundingResponse } from "@/generated/models/ApiDropForgeFundingResponse";
import type { ApiDropForgeSettings } from "@/generated/models/ApiDropForgeSettings";
import type { ApiDropForgeSettingsRequest } from "@/generated/models/ApiDropForgeSettingsRequest";
import {
  commonApiFetch,
  commonApiPost,
  commonApiPut,
} from "@/services/api/common-api";

export const getForgeSettings = () =>
  commonApiFetch<ApiDropForgeSettings>({
    endpoint: "drop-forge/automation-settings",
  });
export const saveForgeSettings = (body: ApiDropForgeSettingsRequest) =>
  commonApiPut<ApiDropForgeSettingsRequest, ApiDropForgeSettings>({
    endpoint: "drop-forge/automation-settings",
    body,
  });
export const recordForgeFunding = (hash: string) =>
  commonApiPost<ApiDropForgeFundingRequest, ApiDropForgeFundingResponse>({
    endpoint: "drop-forge/funding",
    body: { hash },
  });
