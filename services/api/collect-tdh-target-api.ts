import type { ApiCollectTdhTargetPlan } from "@/generated/models/ApiCollectTdhTargetPlan";
import type { ApiCollectTdhTargetRequest } from "@/generated/models/ApiCollectTdhTargetRequest";
import { commonApiPost } from "./common-api";

/** Read-only portfolio analysis. Purchases still require a separately reviewed batch. */
export const createCollectTdhTargetPlan = (
  body: ApiCollectTdhTargetRequest,
  signal: AbortSignal
) =>
  commonApiPost<ApiCollectTdhTargetRequest, ApiCollectTdhTargetPlan>({
    endpoint: "collect/tdh-target-plans",
    body,
    signal,
    errorMode: "structured",
  });
