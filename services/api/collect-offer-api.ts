import type { ApiCollectOfferAnalysis } from "@/generated/models/ApiCollectOfferAnalysis";
import type { ApiCollectOfferAnalysisRequest } from "@/generated/models/ApiCollectOfferAnalysisRequest";
import { commonApiPost } from "@/services/api/common-api";

export const fetchCollectOfferAnalysis = (
  body: ApiCollectOfferAnalysisRequest,
  signal?: AbortSignal
) =>
  commonApiPost<ApiCollectOfferAnalysisRequest, ApiCollectOfferAnalysis>({
    endpoint: "collect/offer-analyses",
    body,
    signal,
    errorMode: "structured",
  });
