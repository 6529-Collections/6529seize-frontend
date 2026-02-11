import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";
import {
  FIELD_TO_LABEL_MAP,
  getInitialTraitsValues,
} from "@/components/waves/memes/traits/schema";
import type { MemeClaim } from "@/generated/models/MemeClaim";
import type { MemeClaimAttribute } from "@/generated/models/MemeClaimAttribute";
import type { MemeClaimUpdateRequest } from "@/generated/models/MemeClaimUpdateRequest";

const ATTRIBUTE_TRAIT_KEYS = (
  Object.keys(getInitialTraitsValues()) as (keyof TraitsData)[]
).filter((k) => k !== "title" && k !== "description");

export function getClaimSeason(claim: MemeClaim): string {
  const raw = (claim as unknown as Record<string, unknown>)["season"];
  if (raw != null && typeof raw === "string" && raw.trim() !== "")
    return raw.trim();
  if (raw != null && (typeof raw === "number" || typeof raw === "boolean"))
    return String(raw);
  const attr = (claim.attributes ?? []).find(
    (a) => a.trait_type?.trim().toLowerCase() === "season"
  );
  if (attr?.value != null) return String(attr.value).trim();
  return "";
}

export function claimToTraitsData(claim: MemeClaim): TraitsData {
  const initial = getInitialTraitsValues();
  const traits: TraitsData = { ...initial };
  traits.title = claim.name ?? "";
  traits.description = claim.description ?? "";
  const attrMap = new Map<string, string | number | boolean>();
  const labelToField = new Map<string, keyof TraitsData>(
    Object.entries(FIELD_TO_LABEL_MAP).map(([field, label]) => [
      label.toLowerCase(),
      field as keyof TraitsData,
    ])
  );
  const keyToField = new Map<string, keyof TraitsData>(
    Object.keys(initial).map((field) => [
      field.toLowerCase(),
      field as keyof TraitsData,
    ])
  );
  (claim.attributes ?? []).forEach((a) => {
    const rawKey = a.trait_type?.toString().trim().toLowerCase();
    if (!rawKey) return;
    const resolvedKey = labelToField.get(rawKey) ?? keyToField.get(rawKey);
    if (!resolvedKey) return;
    attrMap.set(resolvedKey, a.value as string | number | boolean);
  });
  const coerceValue = (
    key: keyof TraitsData,
    value: string | number | boolean
  ): string | number | boolean => {
    const initialValue = initial[key];
    if (typeof initialValue === "boolean") {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "yes" || normalized === "true") return true;
        if (normalized === "no" || normalized === "false") return false;
      }
      return Boolean(value);
    }
    if (typeof initialValue === "number") {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : initialValue;
      }
    }
    return value;
  };
  const traitsRecord: Record<string, unknown> = traits as unknown as Record<
    string,
    unknown
  >;
  ATTRIBUTE_TRAIT_KEYS.forEach((key) => {
    const v = attrMap.get(key);
    if (v !== undefined && v !== null) {
      traitsRecord[key] = coerceValue(key, v);
    }
  });
  return traits;
}

export function traitsDataToUpdateRequest(
  traits: TraitsData,
  editionSize: number | null,
  previousTraits?: TraitsData
): Partial<MemeClaimUpdateRequest> {
  const initial = getInitialTraitsValues();
  const normalizeValue = (
    key: keyof TraitsData,
    value: unknown
  ): string | number | boolean => {
    const initialValue = initial[key];
    if (typeof initialValue === "boolean") {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "yes" || normalized === "true") return true;
        if (normalized === "no" || normalized === "false") return false;
      }
      return Boolean(value);
    }
    if (typeof initialValue === "number") {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (value == null) return "";
    return String(value);
  };

  const hasChangedAttributeValues =
    previousTraits === undefined
      ? true
      : ATTRIBUTE_TRAIT_KEYS.some(
          (key) =>
            normalizeValue(key, traits[key]) !==
            normalizeValue(key, previousTraits[key])
        );

  const name = traits.title?.trim();
  const description = traits.description?.trim();
  const body: Partial<MemeClaimUpdateRequest> = {};

  if (hasChangedAttributeValues) {
    body.attributes = ATTRIBUTE_TRAIT_KEYS.map(
      (key): MemeClaimAttribute => ({
        trait_type: FIELD_TO_LABEL_MAP[key] ?? key,
        value:
          typeof normalizeValue(key, traits[key]) === "boolean"
            ? (normalizeValue(key, traits[key]) as boolean)
              ? "Yes"
              : "No"
            : (normalizeValue(key, traits[key]) as string | number),
      })
    );
  }

  if (
    name !== undefined &&
    name !== "" &&
    (previousTraits === undefined || name !== previousTraits.title?.trim())
  ) {
    body.name = name;
  }
  if (
    description !== undefined &&
    (previousTraits === undefined ||
      description !== previousTraits.description?.trim())
  ) {
    body.description = description;
  }
  if (editionSize != null) body.edition_size = editionSize;
  return body;
}
