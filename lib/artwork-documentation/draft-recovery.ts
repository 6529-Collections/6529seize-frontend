import { ApiArtworkDocumentationAnswerIntendedVisibilityEnum } from "@/generated/models/ApiArtworkDocumentationAnswer";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationOperation } from "@/generated/models/ApiArtworkDocumentationOperation";
import { canEditDocumentationField } from "./capabilities";
import type { DraftSnapshot, PendingEdit } from "./draft-controller";

const PREFIX = "6529-artwork-draft-v1:";
const ACTOR_KEY = `${PREFIX}actor`;
const MAX_LENGTH = 1_048_576;
const MAX_AGE = 24 * 60 * 60_000;
const MAX_EDITS = 256;

type RecoveryEdit = Pick<PendingEdit, "moduleId" | "operation">;
interface RecoveryRecord {
  readonly version: 1;
  readonly actorKey: string;
  readonly contextId: string;
  readonly profileId: string;
  readonly profileVersion: number;
  readonly draftVersion: number;
  readonly artistRecordVersion: number;
  readonly savedAt: number;
  readonly reviewRequired: boolean;
  readonly edits: readonly RecoveryEdit[];
}
interface RecoveredDocumentationDraft {
  readonly edits: readonly RecoveryEdit[];
  readonly requireReview: boolean;
}

function storage(): Storage | null {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
}
function key(actorKey: string, contextId: string): string {
  return `${PREFIX}${encodeURIComponent(actorKey)}:${contextId}`;
}
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function keysWithin(
  value: Record<string, unknown>,
  allowed: readonly string[]
) {
  return Object.keys(value).every((name) => allowed.includes(name));
}
function safeJson(value: unknown, depth = 0): boolean {
  if (depth > 24) return false;
  if (value === null || typeof value === "boolean" || typeof value === "string")
    return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value))
    return (
      value.length <= 1024 &&
      value.every((item: unknown) => safeJson(item, depth + 1))
    );
  if (!object(value) || Object.getPrototypeOf(value) !== Object.prototype)
    return false;
  const entries = Object.entries(value);
  return (
    entries.length <= 256 &&
    entries.every(
      ([name, item]) =>
        !["__proto__", "prototype", "constructor"].includes(name) &&
        safeJson(item, depth + 1)
    )
  );
}
function isOperation(
  value: unknown
): value is ApiArtworkDocumentationOperation {
  if (
    !object(value) ||
    !keysWithin(value, ["op", "field", "answer"]) ||
    typeof value["field"] !== "string" ||
    value["field"].length > 128
  )
    return false;
  if (value["op"] === "unset") return value["answer"] === undefined;
  const answer = value["answer"];
  if (
    value["op"] !== "set" ||
    !object(answer) ||
    !keysWithin(answer, [
      "status",
      "value",
      "explanation",
      "intended_visibility",
    ])
  )
    return false;
  return (
    typeof answer["status"] === "string" &&
    [
      "provided",
      "unknown",
      "unavailable",
      "withheld",
      "not_applicable",
    ].includes(answer["status"]) &&
    (answer["intended_visibility"] === undefined ||
      answer["intended_visibility"] === "public_record" ||
      answer["intended_visibility"] === "restricted") &&
    (answer["explanation"] === undefined ||
      typeof answer["explanation"] === "string") &&
    (answer["value"] === undefined || safeJson(answer["value"]))
  );
}
function isEdit(value: unknown): value is RecoveryEdit {
  return (
    object(value) &&
    keysWithin(value, ["moduleId", "operation"]) &&
    typeof value["moduleId"] === "string" &&
    value["moduleId"].length <= 128 &&
    isOperation(value["operation"])
  );
}
function isRecord(value: unknown): value is RecoveryRecord {
  if (
    !object(value) ||
    !keysWithin(value, [
      "version",
      "actorKey",
      "contextId",
      "profileId",
      "profileVersion",
      "draftVersion",
      "artistRecordVersion",
      "savedAt",
      "reviewRequired",
      "edits",
    ])
  )
    return false;
  return (
    value["version"] === 1 &&
    typeof value["reviewRequired"] === "boolean" &&
    ["actorKey", "contextId", "profileId"].every(
      (name) => typeof value[name] === "string"
    ) &&
    ["profileVersion", "draftVersion", "artistRecordVersion", "savedAt"].every(
      (name) =>
        typeof value[name] === "number" &&
        Number.isSafeInteger(value[name]) &&
        value[name] >= 0
    ) &&
    Array.isArray(value["edits"]) &&
    value["edits"].length <= MAX_EDITS &&
    value["edits"].every(isEdit)
  );
}
function canRecover(
  context: ApiArtworkDocumentationContext,
  edit: RecoveryEdit
): boolean {
  const definition = context.profile.modules
    .find((module) => String(module.id) === edit.moduleId)
    ?.fields.find((field) => field.id === edit.operation.field);
  return (
    definition !== undefined &&
    definition.read_only !== true &&
    canEditDocumentationField(
      context,
      `${edit.moduleId}.${edit.operation.field}`,
      definition.locked_restricted ||
        edit.operation.answer?.intended_visibility ===
          ApiArtworkDocumentationAnswerIntendedVisibilityEnum.Restricted
    )
  );
}

/** Erases only tab-local documentation buffers, never other application storage. */
export function clearDocumentationDraftRecovery(): void {
  try {
    const target = storage();
    if (!target) return;
    for (let index = target.length - 1; index >= 0; index--) {
      const name = target.key(index);
      if (name?.startsWith(PREFIX)) target.removeItem(name);
    }
  } catch {
    // Recovery is best effort when browser storage is disabled.
  }
}
export function activateDocumentationDraftRecovery(actorKey: string): void {
  try {
    const target = storage();
    if (!target) return;
    if (target.getItem(ACTOR_KEY) !== actorKey)
      clearDocumentationDraftRecovery();
    target.setItem(ACTOR_KEY, actorKey);
  } catch {
    // The write path reports unavailable recovery without interrupting editing.
  }
}

/** Only pending operations are retained: no server context, credentials or file bytes. */
export function saveDocumentationDraftRecovery(
  actorKey: string,
  snapshot: DraftSnapshot
): boolean {
  try {
    const target = storage();
    if (!target) return false;
    // A logout/switch revokes old subscribers before React finishes unmounting.
    const storedActor = target.getItem(ACTOR_KEY);
    if (storedActor === null) return false;
    if (storedActor !== actorKey) return true;
    const recordKey = key(actorKey, snapshot.context.id);
    const edits = snapshot.edits.map(({ moduleId, operation }) => ({
      moduleId,
      operation,
    }));
    if (!edits.length) {
      target.removeItem(recordKey);
      return true;
    }
    const record: RecoveryRecord = {
      version: 1,
      actorKey,
      contextId: snapshot.context.id,
      profileId: snapshot.context.profile.profile_id,
      profileVersion: snapshot.context.profile.version,
      draftVersion: snapshot.context.draft_version,
      artistRecordVersion: snapshot.context.artist_record_version,
      savedAt: Date.now(),
      reviewRequired: snapshot.state === "conflict",
      edits,
    };
    if (!isRecord(record)) {
      target.removeItem(recordKey);
      return false;
    }
    const serialized = JSON.stringify(record);
    if (serialized.length > MAX_LENGTH || !isRecord(JSON.parse(serialized))) {
      target.removeItem(recordKey);
      return false;
    }
    target.setItem(recordKey, serialized);
    return true;
  } catch {
    try {
      storage()?.removeItem(key(actorKey, snapshot.context.id));
    } catch {
      // Do not replace a failed recovery write with an older local answer.
    }
    return false;
  }
}

export function readDocumentationDraftRecovery(
  actorKey: string,
  context: ApiArtworkDocumentationContext
): RecoveredDocumentationDraft | null {
  try {
    const target = storage();
    if (target?.getItem(ACTOR_KEY) !== actorKey) return null;
    const recordKey = key(actorKey, context.id);
    const serialized = target.getItem(recordKey);
    if (!serialized) return null;
    let parsed: unknown;
    if (serialized.length <= MAX_LENGTH) {
      try {
        parsed = JSON.parse(serialized);
      } catch {
        parsed = null;
      }
    }
    if (
      !isRecord(parsed) ||
      parsed.actorKey !== actorKey ||
      parsed.contextId !== context.id ||
      parsed.savedAt > Date.now() ||
      Date.now() - parsed.savedAt > MAX_AGE
    ) {
      target.removeItem(recordKey);
      return null;
    }
    const seen = new Set<string>();
    const edits = parsed.edits.filter((edit) => {
      const path = `${edit.moduleId}.${edit.operation.field}`;
      if (seen.has(path) || !canRecover(context, edit)) return false;
      seen.add(path);
      return true;
    });
    if (!edits.length) {
      target.removeItem(recordKey);
      return null;
    }
    return {
      edits,
      requireReview:
        parsed.reviewRequired ||
        parsed.draftVersion !== context.draft_version ||
        parsed.artistRecordVersion !== context.artist_record_version ||
        parsed.profileId !== context.profile.profile_id ||
        parsed.profileVersion !== context.profile.version,
    };
  } catch {
    return null;
  }
}
