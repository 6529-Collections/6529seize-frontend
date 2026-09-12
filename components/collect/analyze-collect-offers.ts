import { fetchCollectOfferAnalysis } from "@/services/api/collect-offer-api";
import {
  buildOfferAnalysisRequest,
  offerAnalysisView,
} from "./collect-offer-analysis.adapter";
import type { OfferPlanAnalysisInput } from "./collect-offer-plan.types";

/** Analysis never prepares operations, opens a wallet or signs offers. */
export async function analyzeCollectOffers(input: OfferPlanAnalysisInput) {
  const request = buildOfferAnalysisRequest(input);
  const result = await fetchCollectOfferAnalysis(request);
  return offerAnalysisView(result, request);
}
