import type { ApiCollectAssetsPage } from "@/generated/models/ApiCollectAssetsPage";
import type { ApiCollectCapabilities } from "@/generated/models/ApiCollectCapabilities";
import type { ApiCollectCatalog } from "@/generated/models/ApiCollectCatalog";
import type { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import type { ApiCollectPlanRequest } from "@/generated/models/ApiCollectPlanRequest";
import type { ApiCollectTdhRequest } from "@/generated/models/ApiCollectTdhRequest";
import type { ApiCollectTdhProjection } from "@/generated/models/ApiCollectTdhProjection";
import type { ApiCollectTdhRankingRequest } from "@/generated/models/ApiCollectTdhRankingRequest";
import type { ApiCollectTdhRanking } from "@/generated/models/ApiCollectTdhRanking";
import { commonApiFetch, commonApiPost } from "./common-api";

export const fetchCollectCatalog = (signal?: AbortSignal) =>
  commonApiFetch<ApiCollectCatalog>({
    endpoint: "collect/catalog",
    signal,
    errorMode: "structured",
  });
export const fetchCollectCapabilities = (signal?: AbortSignal) =>
  commonApiFetch<ApiCollectCapabilities>({
    endpoint: "collect/capabilities",
    signal,
    cache: "no-store",
    errorMode: "structured",
  });
export const fetchCollectAssets = (options: {
  readonly family?: ApiCollectFamily;
  readonly query: string;
  readonly page: number;
  readonly signal?: AbortSignal;
}) =>
  commonApiFetch<ApiCollectAssetsPage>({
    endpoint: "collect/assets",
    signal: options.signal,
    errorMode: "structured",
    params: {
      ...(options.family !== undefined ? { family: options.family } : {}),
      query: options.query,
      page: String(options.page),
      page_size: "24",
    },
  });
export const createCollectPlan = (body: ApiCollectPlanRequest) =>
  commonApiPost<ApiCollectPlanRequest, ApiCollectPlan>({
    endpoint: "collect/plans",
    body,
    errorMode: "structured",
  });
export const advanceCollectPlan = (id: string, signal?: AbortSignal) =>
  commonApiPost<Record<string, never>, ApiCollectPlan>({
    endpoint: `collect/plans/${encodeURIComponent(id)}/advance`,
    body: {},
    signal,
    errorMode: "structured",
  });
export const compareCollectTdh = (body: ApiCollectTdhRankingRequest) =>
  commonApiPost<ApiCollectTdhRankingRequest, ApiCollectTdhRanking>({
    endpoint: "collect/tdh-ranking",
    body,
    errorMode: "structured",
  });
export const projectCollectTdh = (body: ApiCollectTdhRequest) =>
  commonApiPost<ApiCollectTdhRequest, ApiCollectTdhProjection>({
    endpoint: "collect/tdh-scenarios",
    body,
    errorMode: "structured",
  });
