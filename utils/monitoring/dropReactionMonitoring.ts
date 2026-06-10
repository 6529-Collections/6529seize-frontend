"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import * as Sentry from "@sentry/nextjs";

const RECONCILIATION_WINDOW_MS = 15_000;
const DEDUPE_WINDOW_MS = 60_000;
const MUTATION_RETENTION_MS = 5 * 60_000;
const REACTION_FEATURE = "drop-reaction";
const REACTION_REQUEST_OPERATION = "reaction-request";
const REACTION_ANOMALY_OPERATION = "reaction-anomaly";
const ANOMALY_OPTIMISTIC_REVERTED = "optimistic-reverted";
const WEBSOCKET_STATUSES = new Set<string>(Object.values(WebSocketStatus));

export type ReactionSource = "quick-react" | "picker" | "chip";
type ReactionAction = "add" | "remove" | "replace";
type ReactionErrorKind =
  | "network"
  | "auth"
  | "rate-limit"
  | "server"
  | "endpoint-contract";

interface ReactionMutationContext {
  readonly mutationId: string;
  readonly dropMutationSeq: number;
  readonly dropId: string;
  readonly waveId: string;
  readonly source: ReactionSource;
  readonly action: ReactionAction;
  readonly previousReaction: string | null;
  readonly intendedReaction: string | null;
  readonly optimisticReaction: string | null;
  readonly profileId: string | null;
  readonly startedAt: number;
  readonly pathname: string | null;
  readonly visibilityState: string | null;
  readonly online: boolean | null;
  readonly websocketStatus: WebSocketStatus | null;
  endpoint?: string | null;
  method?: string | null;
  requestSentAt: number | null;
  apiSucceededAt: number | null;
  apiFailedAt: number | null;
  realtimeReconciledAt: number | null;
  failureCaptured?: boolean;
  supersededByMutationId?: string | null;
}

interface ReactionMutationResult {
  readonly isLatestMutation: boolean;
  readonly supersededByMutationId: string | null;
}

interface ReactionRealtimeReconciliationResult {
  readonly shouldApplyCanonicalDrop: boolean;
  readonly expectedReaction: string | null;
  readonly serverReaction: string | null;
  readonly supersededByMutationId?: string;
}

const latestMutationIdByDrop = new Map<string, string>();
const activeIntentMutationIdByDrop = new Map<string, string>();
const dropMutationSeqByDrop = new Map<string, number>();
const mutationContextById = new Map<string, ReactionMutationContext>();
const dedupeEventAtByKey = new Map<string, number>();

function pruneState(now: number): void {
  for (const [key, timestamp] of dedupeEventAtByKey.entries()) {
    if (now - timestamp > DEDUPE_WINDOW_MS) {
      dedupeEventAtByKey.delete(key);
    }
  }

  for (const [mutationId, context] of mutationContextById.entries()) {
    if (now - context.startedAt <= MUTATION_RETENTION_MS) {
      continue;
    }

    mutationContextById.delete(mutationId);
    if (latestMutationIdByDrop.get(context.dropId) === mutationId) {
      latestMutationIdByDrop.delete(context.dropId);
      dropMutationSeqByDrop.delete(context.dropId);
    }
    if (activeIntentMutationIdByDrop.get(context.dropId) === mutationId) {
      activeIntentMutationIdByDrop.delete(context.dropId);
    }
  }
}

function shouldCaptureEvent(key: string, now: number): boolean {
  const lastCapturedAt = dedupeEventAtByKey.get(key);
  if (
    typeof lastCapturedAt === "number" &&
    now - lastCapturedAt < DEDUPE_WINDOW_MS
  ) {
    return false;
  }

  dedupeEventAtByKey.set(key, now);
  return true;
}

function createMutationId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `reaction-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getCurrentPathname(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.location.pathname || null;
}

function getVisibilityState(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  return document.visibilityState;
}

function getOnlineStatus(): boolean | null {
  if (typeof navigator === "undefined") {
    return null;
  }
  return navigator.onLine;
}

function toNullableReaction(value: string | null | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function toWebsocketStatus(
  value: WebSocketStatus | string | null | undefined
): WebSocketStatus | null {
  if (typeof value === "string" && WEBSOCKET_STATUSES.has(value)) {
    return value as WebSocketStatus;
  }

  return null;
}

function addReactionBreadcrumb(
  message: string,
  context: ReactionMutationContext,
  data: Record<string, unknown> = {},
  level: "info" | "warning" | "error" = "info"
): void {
  Sentry.addBreadcrumb({
    category: "reactions",
    level,
    message,
    data: {
      mutation_id: context.mutationId,
      drop_mutation_seq: context.dropMutationSeq,
      drop_id: context.dropId,
      wave_id: context.waveId,
      source: context.source,
      action: context.action,
      previous_reaction: context.previousReaction,
      intended_reaction: context.intendedReaction,
      optimistic_reaction: context.optimisticReaction,
      profile_id: context.profileId ?? undefined,
      pathname: context.pathname ?? undefined,
      visibility_state: context.visibilityState ?? undefined,
      online: context.online ?? undefined,
      websocket_status: context.websocketStatus ?? undefined,
      endpoint: context.endpoint ?? undefined,
      method: context.method ?? undefined,
      ...data,
    },
  });
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error) {
    const typedError = error as {
      message?: unknown;
      error?: unknown;
    };
    if (typeof typedError.message === "string") {
      return typedError.message;
    }
    if (typeof typedError.error === "string") {
      return typedError.error;
    }
  }
  return String(error);
}

function toCaptureExceptionInput(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(toErrorMessage(error));
}

function parseStatusCode(status: unknown): number | null {
  if (typeof status === "number" && Number.isFinite(status)) {
    return status;
  }

  if (typeof status === "string") {
    const parsed = Number.parseInt(status, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function extractErrorStatusCode(error: unknown): number | null {
  if (error === null || typeof error !== "object") {
    return null;
  }

  const typedError = error as {
    status?: unknown;
    code?: unknown;
    response?: {
      status?: unknown;
    };
    cause?: {
      status?: unknown;
      code?: unknown;
      response?: {
        status?: unknown;
      };
    };
  };

  return (
    parseStatusCode(typedError.status) ??
    parseStatusCode(typedError.response?.status) ??
    parseStatusCode(typedError.code) ??
    parseStatusCode(typedError.cause?.status) ??
    parseStatusCode(typedError.cause?.response?.status) ??
    parseStatusCode(typedError.cause?.code)
  );
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  const normalizedMessage = toErrorMessage(error).toLowerCase();
  return (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("load failed") ||
    normalizedMessage.includes("networkerror") ||
    normalizedMessage.includes("network error") ||
    normalizedMessage.includes("network request failed")
  );
}

function classifyReactionError(error: unknown): {
  statusCode: number | null;
  errorKind: ReactionErrorKind;
} {
  const statusCode = extractErrorStatusCode(error);

  if (statusCode === 401 || statusCode === 403) {
    return { statusCode, errorKind: "auth" };
  }

  if (statusCode === 429) {
    return { statusCode, errorKind: "rate-limit" };
  }

  if (statusCode === 404 || statusCode === 405) {
    return { statusCode, errorKind: "endpoint-contract" };
  }

  if (typeof statusCode === "number" && statusCode >= 500) {
    return { statusCode, errorKind: "server" };
  }

  if (isNetworkError(error)) {
    return { statusCode, errorKind: "network" };
  }

  return { statusCode, errorKind: "server" };
}

function captureReactionEvent({
  error,
  level,
  fingerprint,
  tags,
  extra,
}: {
  error: Error;
  level: "warning" | "error";
  fingerprint: string[];
  tags: Record<string, string>;
  extra: Record<string, unknown>;
}): void {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    scope.setFingerprint(fingerprint);
    Object.entries(tags).forEach(([key, value]) => {
      scope.setTag(key, value);
    });
    scope.setExtras(extra);
    Sentry.captureException(error);
  });
}

function recordSupersededResponse(
  context: ReactionMutationContext,
  now: number
): ReactionMutationResult {
  const latestMutationId = latestMutationIdByDrop.get(context.dropId);
  if (!latestMutationId || latestMutationId === context.mutationId) {
    return {
      isLatestMutation: true,
      supersededByMutationId: null,
    };
  }

  context.supersededByMutationId = latestMutationId;
  addReactionBreadcrumb(
    "reaction.response_superseded",
    context,
    {
      superseded: true,
      superseded_by_mutation_id: latestMutationId,
      time_since_mutation_ms: now - context.startedAt,
    },
    "warning"
  );

  return {
    isLatestMutation: false,
    supersededByMutationId: latestMutationId,
  };
}

function clearActiveIntentForContext(context: ReactionMutationContext): void {
  if (activeIntentMutationIdByDrop.get(context.dropId) === context.mutationId) {
    activeIntentMutationIdByDrop.delete(context.dropId);
  }
}

export function deriveReactionAction(
  previousReaction: string | null | undefined,
  intendedReaction: string | null | undefined
): ReactionAction {
  const previous = toNullableReaction(previousReaction);
  const intended = toNullableReaction(intendedReaction);

  if (intended === null) {
    return "remove";
  }

  if (previous === null) {
    return "add";
  }

  return "replace";
}

export function beginReactionMutation(params: {
  dropId: string;
  waveId: string;
  source: ReactionSource;
  action: ReactionAction;
  previousReaction: string | null | undefined;
  intendedReaction: string | null | undefined;
  optimisticReaction: string | null | undefined;
  profileId: string | null | undefined;
  websocketStatus?: WebSocketStatus | string | null;
}): ReactionMutationContext {
  const now = Date.now();
  pruneState(now);

  const nextSeq = (dropMutationSeqByDrop.get(params.dropId) ?? 0) + 1;
  dropMutationSeqByDrop.set(params.dropId, nextSeq);

  const context: ReactionMutationContext = {
    mutationId: createMutationId(),
    dropMutationSeq: nextSeq,
    dropId: params.dropId,
    waveId: params.waveId,
    source: params.source,
    action: params.action,
    previousReaction: toNullableReaction(params.previousReaction),
    intendedReaction: toNullableReaction(params.intendedReaction),
    optimisticReaction: toNullableReaction(params.optimisticReaction),
    profileId: params.profileId ?? null,
    startedAt: now,
    pathname: getCurrentPathname(),
    visibilityState: getVisibilityState(),
    online: getOnlineStatus(),
    websocketStatus: toWebsocketStatus(params.websocketStatus),
    requestSentAt: null,
    apiSucceededAt: null,
    apiFailedAt: null,
    realtimeReconciledAt: null,
  };

  latestMutationIdByDrop.set(params.dropId, context.mutationId);
  activeIntentMutationIdByDrop.set(params.dropId, context.mutationId);
  mutationContextById.set(context.mutationId, context);

  addReactionBreadcrumb("reaction.intent", context);

  return context;
}

export function recordReactionOptimisticApplied(
  context: ReactionMutationContext
): void {
  addReactionBreadcrumb("reaction.optimistic_applied", context);
}

export function recordReactionRequestSent(
  context: ReactionMutationContext,
  params: {
    endpoint: string;
    method: "POST" | "DELETE";
  }
): void {
  context.endpoint = params.endpoint;
  context.method = params.method;
  context.requestSentAt = Date.now();

  addReactionBreadcrumb("reaction.request_sent", context);
}

export function isReactionMutationLatest(params: {
  readonly dropId: string;
  readonly mutationId: string;
}): boolean {
  return latestMutationIdByDrop.get(params.dropId) === params.mutationId;
}

export function recordReactionRequestSucceeded(
  context: ReactionMutationContext
): ReactionMutationResult {
  const now = Date.now();
  context.apiSucceededAt = now;

  const result = recordSupersededResponse(context, now);

  addReactionBreadcrumb("reaction.request_succeeded", context, {
    latency_ms: now - (context.requestSentAt ?? context.startedAt),
  });

  return result;
}

export function recordReactionRequestFailed(
  context: ReactionMutationContext,
  error: unknown
): ReactionMutationResult {
  const now = Date.now();
  context.apiFailedAt = now;

  const result = recordSupersededResponse(context, now);

  const { statusCode, errorKind } = classifyReactionError(error);
  const latencyMs = now - (context.requestSentAt ?? context.startedAt);
  const errorMessage = toErrorMessage(error);

  addReactionBreadcrumb(
    "reaction.request_failed",
    context,
    {
      status_code: statusCode ?? undefined,
      latency_ms: latencyMs,
      error_kind: errorKind,
      error_message: errorMessage,
    },
    "warning"
  );

  if (!result.isLatestMutation) {
    return result;
  }

  const dedupeKey = [
    "failure",
    errorKind,
    context.dropId,
    context.source,
    context.action,
    statusCode ?? "na",
  ].join(":");

  if (!shouldCaptureEvent(dedupeKey, now)) {
    context.failureCaptured = true;
    clearActiveIntentForContext(context);
    return result;
  }

  captureReactionEvent({
    error: toCaptureExceptionInput(error),
    level: errorKind === "server" ? "error" : "warning",
    fingerprint: [REACTION_FEATURE, errorKind],
    tags: {
      feature: REACTION_FEATURE,
      operation: REACTION_REQUEST_OPERATION,
      source: context.source,
      action: context.action,
      error_kind: errorKind,
    },
    extra: {
      mutation_id: context.mutationId,
      drop_mutation_seq: context.dropMutationSeq,
      drop_id: context.dropId,
      wave_id: context.waveId,
      previous_reaction: context.previousReaction,
      intended_reaction: context.intendedReaction,
      optimistic_reaction: context.optimisticReaction,
      profile_id: context.profileId ?? undefined,
      pathname: context.pathname ?? undefined,
      visibility_state: context.visibilityState ?? undefined,
      online: context.online ?? undefined,
      websocket_status: context.websocketStatus ?? undefined,
      endpoint: context.endpoint ?? undefined,
      method: context.method ?? undefined,
      status_code: statusCode ?? undefined,
      latency_ms: latencyMs,
      error_kind: errorKind,
      error_message: errorMessage,
    },
  });

  context.failureCaptured = true;
  clearActiveIntentForContext(context);
  return result;
}

export function recordReactionRollbackApplied(
  context: ReactionMutationContext
): void {
  addReactionBreadcrumb("reaction.rollback_applied", context);
}

export function recordReactionRealtimeReconciliation(params: {
  drop: Pick<ApiDrop, "id"> & {
    readonly wave: Pick<ApiDrop["wave"], "id">;
    readonly context_profile_context: ApiDrop["context_profile_context"];
  };
  websocketStatus?: WebSocketStatus | string | null;
}): ReactionRealtimeReconciliationResult {
  const now = Date.now();
  pruneState(now);

  const serverReaction = toNullableReaction(
    params.drop.context_profile_context?.reaction
  );
  const defaultResult: ReactionRealtimeReconciliationResult = {
    shouldApplyCanonicalDrop: true,
    expectedReaction: null,
    serverReaction,
  };

  const activeIntentMutationId = activeIntentMutationIdByDrop.get(
    params.drop.id
  );
  if (!activeIntentMutationId) {
    return defaultResult;
  }

  const context = mutationContextById.get(activeIntentMutationId);
  if (!context) {
    return defaultResult;
  }

  const expectedReaction = context.intendedReaction;
  const timeSinceMutationMs = now - context.startedAt;
  const websocketStatus =
    toWebsocketStatus(params.websocketStatus) ?? undefined;
  const resultBase = {
    expectedReaction,
    serverReaction,
  };

  if (serverReaction === expectedReaction) {
    context.realtimeReconciledAt = now;
    addReactionBreadcrumb("reaction.realtime_reconciled", context, {
      reconciled_from: "ws_refetch",
      server_reaction: serverReaction ?? undefined,
      time_since_mutation_ms: timeSinceMutationMs,
      websocket_status: websocketStatus,
    });
    return {
      ...resultBase,
      shouldApplyCanonicalDrop: true,
    };
  }

  if (timeSinceMutationMs <= RECONCILIATION_WINDOW_MS) {
    addReactionBreadcrumb(
      "reaction.realtime_superseded",
      context,
      {
        reconciled_from: "ws_refetch",
        expected_reaction: expectedReaction ?? undefined,
        server_reaction: serverReaction ?? undefined,
        superseded_by_mutation_id: context.mutationId,
        time_since_mutation_ms: timeSinceMutationMs,
        websocket_status: websocketStatus,
      },
      "warning"
    );

    return {
      ...resultBase,
      shouldApplyCanonicalDrop: false,
      supersededByMutationId: context.mutationId,
    };
  }

  if (context.apiFailedAt !== null || context.apiSucceededAt === null) {
    return {
      ...resultBase,
      shouldApplyCanonicalDrop: true,
    };
  }

  addReactionBreadcrumb(
    "reaction.optimistic_reverted",
    context,
    {
      reconciled_from: "ws_refetch",
      server_reaction: serverReaction ?? undefined,
      time_since_mutation_ms: timeSinceMutationMs,
      websocket_status: websocketStatus,
    },
    "warning"
  );

  const dedupeKey = [
    ANOMALY_OPTIMISTIC_REVERTED,
    context.dropId,
    context.source,
    context.action,
    context.intendedReaction ?? "null",
    serverReaction ?? "null",
  ].join(":");

  if (!shouldCaptureEvent(dedupeKey, now)) {
    clearActiveIntentForContext(context);
    return {
      ...resultBase,
      shouldApplyCanonicalDrop: true,
    };
  }

  captureReactionEvent({
    error: new Error(
      "Reaction optimistic state disagreed with canonical state"
    ),
    level: "warning",
    fingerprint: [REACTION_FEATURE, ANOMALY_OPTIMISTIC_REVERTED],
    tags: {
      feature: REACTION_FEATURE,
      operation: REACTION_ANOMALY_OPERATION,
      anomaly_kind: ANOMALY_OPTIMISTIC_REVERTED,
      source: context.source,
      action: context.action,
    },
    extra: {
      mutation_id: context.mutationId,
      drop_mutation_seq: context.dropMutationSeq,
      drop_id: context.dropId,
      wave_id: context.waveId,
      previous_reaction: context.previousReaction,
      intended_reaction: context.intendedReaction,
      optimistic_reaction: context.optimisticReaction,
      server_reaction: serverReaction ?? undefined,
      profile_id: context.profileId ?? undefined,
      pathname: context.pathname ?? undefined,
      visibility_state: context.visibilityState ?? undefined,
      online: context.online ?? undefined,
      websocket_status:
        toWebsocketStatus(params.websocketStatus) ??
        context.websocketStatus ??
        undefined,
      endpoint: context.endpoint ?? undefined,
      method: context.method ?? undefined,
      reconciled_from: "ws_refetch",
      time_since_mutation_ms: timeSinceMutationMs,
      anomaly_kind: ANOMALY_OPTIMISTIC_REVERTED,
    },
  });

  clearActiveIntentForContext(context);

  return {
    ...resultBase,
    shouldApplyCanonicalDrop: true,
  };
}

export function __resetDropReactionMonitoringForTests(): void {
  latestMutationIdByDrop.clear();
  activeIntentMutationIdByDrop.clear();
  dropMutationSeqByDrop.clear();
  mutationContextById.clear();
  dedupeEventAtByKey.clear();
}
