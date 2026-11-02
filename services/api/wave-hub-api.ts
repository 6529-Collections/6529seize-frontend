import type { ApiUpdateWaveHubRequest } from "@/generated/models/ApiUpdateWaveHubRequest";
import type { ApiWaveV3 } from "@/generated/models/ApiWaveV3";
import { commonApiPatch } from "@/services/api/common-api";

export const updateWaveHub = (waveId: string, body: ApiUpdateWaveHubRequest) =>
  commonApiPatch<ApiUpdateWaveHubRequest, ApiWaveV3>({
    endpoint: `v3/waves/${encodeURIComponent(waveId)}`,
    body,
    errorMode: "structured",
  });
