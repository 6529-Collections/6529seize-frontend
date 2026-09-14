import type { ApiCollectRule } from "@/generated/models/ApiCollectRule";
import type { ApiCollectRules } from "@/generated/models/ApiCollectRules";
import type { ApiCollectRuleDefinition } from "@/generated/models/ApiCollectRuleDefinition";
import type { ApiCollectRulePause } from "@/generated/models/ApiCollectRulePause";
import type { ApiCollectRulePrepare } from "@/generated/models/ApiCollectRulePrepare";
import type { ApiCollectRulePrepared } from "@/generated/models/ApiCollectRulePrepared";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

const path = (id: string) => `collect/rules/${encodeURIComponent(id)}`;
export const fetchCollectRules = (signal?: AbortSignal) =>
  commonApiFetch<ApiCollectRules>({
    endpoint: "collect/rules",
    signal,
    cache: "no-store",
    errorMode: "structured",
  });
export const createCollectRule = (
  body: ApiCollectRuleDefinition,
  idempotencyKey: string
) =>
  commonApiPost<ApiCollectRuleDefinition, ApiCollectRule>({
    endpoint: "collect/rules",
    body,
    headers: { "Idempotency-Key": idempotencyKey },
    errorMode: "structured",
  });
export const pauseCollectRule = (id: string, body: ApiCollectRulePause) =>
  commonApiPost<ApiCollectRulePause, ApiCollectRule>({
    endpoint: `${path(id)}/pause`,
    body,
    errorMode: "structured",
  });
export const reconcileCollectRule = (id: string) =>
  commonApiPost<Record<string, never>, ApiCollectRule>({
    endpoint: `${path(id)}/reconcile`,
    body: {},
    errorMode: "structured",
  });
export const prepareCollectRule = (
  id: string,
  body: ApiCollectRulePrepare,
  idempotencyKey: string
) =>
  commonApiPost<ApiCollectRulePrepare, ApiCollectRulePrepared>({
    endpoint: `${path(id)}/prepare`,
    body,
    headers: { "Idempotency-Key": idempotencyKey },
    errorMode: "structured",
  });
