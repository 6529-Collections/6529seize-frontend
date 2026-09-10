import { buildCmsPackageCandidate, type CmsBuilderState } from "./package";
import {
  canonicalizeJson,
  withComputedCmsHashes,
} from "@/lib/profile-cms/protocol/v1";

/** Apply only the visual editor's changes; retain fields it cannot represent. */
export function updateCmsBuilderState(
  current: CmsBuilderState,
  changes: Partial<CmsBuilderState>
): CmsBuilderState {
  const next = { ...current, ...changes };
  if (!current.sourcePackage) return next;
  const timestamp = new Date(current.sourcePackage.provenance.created_at);
  const before = buildCmsPackageCandidate(
    { ...current, sourcePackage: undefined },
    timestamp
  );
  const after = buildCmsPackageCandidate(
    { ...next, sourcePackage: undefined },
    timestamp
  );
  const merged = mergeEditorChanges(current.sourcePackage, before, after);
  return {
    ...next,
    sourcePackage: withComputedCmsHashes(
      merged as typeof current.sourcePackage
    ),
  };
}

export function canVisuallyEditCmsPackage(state: CmsBuilderState): boolean {
  if (!state.sourcePackage) return true;
  const renderer = state.sourcePackage.payload.build_manifest?.renderer;
  if (
    renderer !== "6529-cms-builder-mvp" &&
    renderer !== "6529-cms-gallery-builder-mvp"
  )
    return false;
  const projected = buildCmsPackageCandidate(
    { ...state, sourcePackage: undefined },
    new Date(state.sourcePackage.provenance.created_at)
  );
  return (
    canonicalizeJson(projected.payload) ===
      canonicalizeJson(state.sourcePackage.payload) &&
    canonicalizeJson(projected.site) ===
      canonicalizeJson(state.sourcePackage.site)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIdentifiedArray(
  value: unknown,
  key: "id" | "path"
): value is Array<Record<string, unknown>> {
  return (
    Array.isArray(value) &&
    value.every(
      (item: unknown) => isRecord(item) && typeof item[key] === "string"
    )
  );
}

function mergeIdentifiedArrays(
  source: Array<Record<string, unknown>>,
  before: Array<Record<string, unknown>>,
  after: Array<Record<string, unknown>>,
  key: "id" | "path"
): unknown[] {
  const previous = new Map(before.map((item) => [item[key], item]));
  const updated = new Map(after.map((item) => [item[key], item]));
  const preserved = source.filter(
    (item) => !previous.has(item[key]) && !updated.has(item[key])
  );
  const originals = new Map(source.map((item) => [item[key], item]));
  return [
    ...after.map((item) =>
      originals.has(item[key])
        ? mergeEditorChanges(
            originals.get(item[key]),
            previous.get(item[key]),
            item
          )
        : item
    ),
    ...preserved,
  ];
}

/** Three-way projection merge: unchanged generated fields retain author data. */
function mergeEditorChanges(
  source: unknown,
  before: unknown,
  after: unknown
): unknown {
  if (JSON.stringify(before) === JSON.stringify(after)) return source;
  for (const key of ["id", "path"] as const) {
    if (
      isIdentifiedArray(source, key) &&
      isIdentifiedArray(before, key) &&
      isIdentifiedArray(after, key)
    )
      return mergeIdentifiedArrays(source, before, after, key);
  }
  if (isRecord(source) && isRecord(before) && isRecord(after)) {
    return mergeEditorObject(source, before, after);
  }
  return after;
}

function mergeEditorObject(
  source: Record<string, unknown>,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...source };
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (JSON.stringify(before[key]) === JSON.stringify(after[key])) continue;
    if (!(key in after)) delete result[key];
    else result[key] = mergeEditorChanges(source[key], before[key], after[key]);
  }
  return result;
}
