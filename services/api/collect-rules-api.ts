import type { ApiCollectRule } from "@/generated/models/ApiCollectRule";
import type { ApiCollectRules } from "@/generated/models/ApiCollectRules";
import type { ApiCollectRuleDefinition } from "@/generated/models/ApiCollectRuleDefinition";
import type { ApiCollectRulePrepare } from "@/generated/models/ApiCollectRulePrepare";
import type { ApiCollectRulePrepared } from "@/generated/models/ApiCollectRulePrepared";
import {
  collectRuleItem,
  personalChange,
} from "@/lib/personal-records/personal-record-changes";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

const path = (id: string) => `collect/rules/${encodeURIComponent(id)}`;
export const fetchCollectRules = (signal?: AbortSignal) =>
  commonApiFetch<ApiCollectRules>({
    endpoint: "collect/rules",
    signal,
    cache: "no-store",
    errorMode: "structured",
  });
/**
 * Saves a new rule: today's route, or in primary a `collect.rule` record
 * whose rule id is the caller's idempotency key (a UUID), so a retry
 * repeats the same record. Null when saved as a record: callers read the
 * list again.
 */
export const createCollectRule = (
  body: ApiCollectRuleDefinition,
  idempotencyKey: string
): Promise<ApiCollectRule | null> =>
  savePersonalSetting<ApiCollectRule | null>({
    legacy: () =>
      commonApiPost<ApiCollectRuleDefinition, ApiCollectRule>({
        endpoint: "collect/rules",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
        errorMode: "structured",
      }),
    change: () =>
      personalChange({
        items: [collectRuleItem(idempotencyKey, body, false)],
      }),
    recordsResult: () => null,
  });

/**
 * Pauses or resumes a rule: today's route (at the rule's revision), or in
 * primary a `collect.rule` record with the rule's saved terms. Null when
 * saved as a record.
 */
export const setCollectRulePaused = (
  rule: ApiCollectRule,
  paused: boolean
): Promise<ApiCollectRule | null> =>
  savePersonalSetting<ApiCollectRule | null>({
    legacy: () =>
      commonApiPost<
        { expected_revision: number; paused: boolean },
        ApiCollectRule
      >({
        endpoint: `${path(rule.id)}/pause`,
        body: { expected_revision: rule.revision, paused },
        errorMode: "structured",
      }),
    change: () =>
      personalChange({
        items: [collectRuleItem(rule.id, rule.definition, paused)],
      }),
    recordsResult: () => null,
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
