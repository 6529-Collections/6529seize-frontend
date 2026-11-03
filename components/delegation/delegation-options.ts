import { DELEGATION_ALL_ADDRESS } from "@/constants/constants";
import { areEqualAddresses } from "@/helpers/Helpers";
import type {
  DelegationCollection,
  DelegationUseCase,
} from "./delegation-constants";
import {
  DELEGATION_USE_CASES,
  MEMES_COLLECTION,
  SUPPORTED_COLLECTIONS,
} from "./delegation-constants";

/** A search-param value as Next.js passes it to a page. */
type PresetQueryValue = string | readonly string[] | undefined;

/**
 * Short collection names that 6529.io links use instead of a contract
 * address, keyed in upper case.
 */
const COLLECTION_PRESET_ALIASES: ReadonlyMap<string, DelegationCollection> =
  new Map([["MEMES", MEMES_COLLECTION]]);

/**
 * The collections the delegation forms list. A delegation manager acting for
 * one collection can register only that collection.
 */
export function getDelegationCollectionOptions(subdelegation?: {
  readonly collection: DelegationCollection;
}): readonly DelegationCollection[] {
  if (
    !subdelegation ||
    areEqualAddresses(subdelegation.collection.contract, DELEGATION_ALL_ADDRESS)
  ) {
    return SUPPORTED_COLLECTIONS;
  }
  return [subdelegation.collection];
}

/** The listed collection for a contract address, or undefined. */
export function findDelegationCollectionOption(
  contract: string | undefined,
  options: readonly DelegationCollection[] = SUPPORTED_COLLECTIONS
): DelegationCollection | undefined {
  return options.find((option) => areEqualAddresses(option.contract, contract));
}

/** The use case the delegation form lists for a number, or undefined. */
export function findDelegationUseCaseOption(
  useCase: number | undefined
): DelegationUseCase | undefined {
  return DELEGATION_USE_CASES.find((option) => option.use_case === useCase);
}

function getSingleQueryValue(value: PresetQueryValue): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * A `collection` link preset as the form's option value: a listed contract
 * address (any letter case) or a known alias such as `MEMES`. Anything else
 * returns "" so the field starts unselected.
 */
function parseDelegationCollectionPreset(value: PresetQueryValue): string {
  const preset = getSingleQueryValue(value);
  if (!preset) {
    return "";
  }
  const collection =
    COLLECTION_PRESET_ALIASES.get(preset.toUpperCase()) ??
    findDelegationCollectionOption(preset);
  return collection?.contract ?? "";
}

/**
 * A `use_case` link preset as a listed use case number. Only the exact
 * decimal form of a listed number is accepted; anything else returns 0 so the
 * field starts unselected.
 */
function parseDelegationUseCasePreset(value: PresetQueryValue): number {
  const preset = getSingleQueryValue(value);
  const useCase = DELEGATION_USE_CASES.find(
    (option) => String(option.use_case) === preset
  );
  return useCase?.use_case ?? 0;
}

/**
 * The register-delegation presets that a Safe Collecting page passes on. Every
 * Safe Collecting page reads its `collection` and `use_case` presets here.
 */
export function parseDelegationFormPresets(query: {
  readonly collection?: PresetQueryValue;
  readonly use_case?: PresetQueryValue;
}): { collectionQuery: string; useCaseQuery: number } {
  return {
    collectionQuery: parseDelegationCollectionPreset(query.collection),
    useCaseQuery: parseDelegationUseCasePreset(query.use_case),
  };
}
