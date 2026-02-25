import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";
import {
  FIELD_TO_LABEL_MAP,
  getInitialTraitsValues,
} from "@/components/waves/memes/traits/schema";
import type { MintingClaim } from "@/generated/models/MintingClaim";
import type { MintingClaimAttribute } from "@/generated/models/MintingClaimAttribute";
import type { MintingClaimUpdateRequest } from "@/generated/models/MintingClaimUpdateRequest";

type TraitPrimitive = string | number | boolean;

const ATTRIBUTE_TRAIT_KEYS = (
  Object.keys(getInitialTraitsValues()) as (keyof TraitsData)[]
).filter((k) => k !== "title" && k !== "description");

export function getClaimSeason(claim: MintingClaim): string {
  const attr = (claim.attributes ?? []).find(
    (a) => a.trait_type?.trim().toLowerCase() === "type - season"
  );
  if (attr?.value != null) return String(attr.value).trim();
  return "";
}

function normalizeTraitPrimitive(
  initialValue: TraitPrimitive,
  value: unknown,
  numberFallback: number
): TraitPrimitive {
  const normalizeBooleanValue = (rawValue: unknown): boolean => {
    if (typeof rawValue === "boolean") return rawValue;
    if (typeof rawValue === "string") {
      const normalized = rawValue.trim().toLowerCase();
      if (normalized === "yes" || normalized === "true") return true;
      if (normalized === "no" || normalized === "false") return false;
    }
    return Boolean(rawValue);
  };

  const normalizeNumberValue = (
    rawValue: unknown,
    fallbackValue: number
  ): number => {
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      return rawValue;
    }
    if (rawValue == null) {
      return fallbackValue;
    }
    if (typeof rawValue === "string" && rawValue.trim() === "") {
      return fallbackValue;
    }
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : fallbackValue;
  };

  const isPrimitiveValue = (rawValue: unknown): rawValue is TraitPrimitive =>
    typeof rawValue === "string" ||
    typeof rawValue === "number" ||
    typeof rawValue === "boolean";

  if (typeof initialValue === "boolean") {
    return normalizeBooleanValue(value);
  }

  if (typeof initialValue === "number") {
    return normalizeNumberValue(value, numberFallback);
  }

  if (isPrimitiveValue(value)) {
    return value;
  }
  return "";
}

function toAttributeValue(value: TraitPrimitive): string | number {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return value;
}

export function claimToTraitsData(claim: MintingClaim): TraitsData {
  const initial = getInitialTraitsValues();
  const traits: TraitsData = { ...initial };
  traits.title = claim.name ?? "";
  traits.description = claim.description ?? "";
  const attrMap = new Map<string, TraitPrimitive>();
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
    attrMap.set(resolvedKey, a.value as TraitPrimitive);
  });
  const traitsRecord: Record<string, unknown> = traits as unknown as Record<
    string,
    unknown
  >;
  ATTRIBUTE_TRAIT_KEYS.forEach((key) => {
    const v = attrMap.get(key);
    if (v !== undefined && v !== null) {
      const initialValue = initial[key] as TraitPrimitive;
      const numberFallback = typeof initialValue === "number" ? initialValue : 0;
      traitsRecord[key] = normalizeTraitPrimitive(initialValue, v, numberFallback);
    }
  });
  return traits;
}

export function traitsDataToUpdateRequest(
  traits: TraitsData,
  editionSize: number | null,
  previousTraits?: TraitsData
): Partial<MintingClaimUpdateRequest> {
  const initial = getInitialTraitsValues();
  const normalizeValue = (
    key: keyof TraitsData,
    value: unknown
  ): TraitPrimitive => {
    return normalizeTraitPrimitive(initial[key] as TraitPrimitive, value, 0);
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
  const body: Partial<MintingClaimUpdateRequest> = {};

  if (hasChangedAttributeValues) {
    body.attributes = ATTRIBUTE_TRAIT_KEYS.map(
      (key): MintingClaimAttribute => {
        const normalizedValue = normalizeValue(key, traits[key]);
        return {
          trait_type: FIELD_TO_LABEL_MAP[key] ?? key,
          value: toAttributeValue(normalizedValue),
        };
      }
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
