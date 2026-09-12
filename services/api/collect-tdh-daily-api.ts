import type { ApiCollectDailyTdhPlan } from "@/generated/models/ApiCollectDailyTdhPlan";
import type { ApiCollectDailyTdhRequest } from "@/generated/models/ApiCollectDailyTdhRequest";
import { commonApiPost } from "./common-api";

/** Read-only analysis; exact orders are refreshed again at purchase review. */
export const createCollectDailyTdhPlan = (
  body: ApiCollectDailyTdhRequest,
  signal: AbortSignal
) =>
  commonApiPost<ApiCollectDailyTdhRequest, ApiCollectDailyTdhPlan>({
    endpoint: "collect/tdh-daily-plans",
    body,
    signal,
    errorMode: "structured",
  });
