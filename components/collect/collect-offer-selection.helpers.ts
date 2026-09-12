import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";
import type { ApiCollectRequirement } from "@/generated/models/ApiCollectRequirement";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";

type Requirement = Pick<
  ApiCollectRequirement,
  "missing_quantity" | "asset_keys"
>;
type Leg = Pick<ApiCollectPlanLeg, "asset_key" | "quantity">;

function positiveQuantity(value: string): bigint | null {
  if (!/^[1-9]\d{0,77}$/.test(value)) return null;
  const quantity = BigInt(value);
  return quantity < 2n ** 256n ? quantity : null;
}

/** Distinct purchase lines for an edition combine into one exact-NFT offer. */
export function collectSelectedOfferSelection(
  items: readonly {
    readonly asset: ApiCollectAsset;
    readonly quantity: string;
  }[]
) {
  const selections = new Map<
    string,
    { asset: ApiCollectAsset; quantity: bigint }
  >();
  for (const { asset, quantity: rawQuantity } of items) {
    const quantity = positiveQuantity(rawQuantity);
    if (quantity === null) throw new Error("INVALID_OFFER_QUANTITY");
    const combined =
      (selections.get(asset.asset_key)?.quantity ?? 0n) + quantity;
    if (combined >= 2n ** 256n) throw new Error("INVALID_OFFER_QUANTITY");
    selections.set(asset.asset_key, { asset, quantity: combined });
  }
  return [...selections.values()].map(({ asset, quantity }) => ({
    asset,
    quantity: quantity.toString(),
  }));
}

/** Overlapping requirements describe the same missing NFT, not extra purchases. */
export function collectMissingOfferSelection(
  requirements: readonly Requirement[],
  chosenLegs: readonly Leg[]
) {
  const quantities = new Map<string, bigint>();
  const alternatives = new Set<string>();
  let hasAlternatives = false;
  const include = (assetKey: string, quantity: bigint) => {
    quantities.set(
      assetKey,
      quantity > (quantities.get(assetKey) ?? 0n)
        ? quantity
        : quantities.get(assetKey)!
    );
  };
  for (const requirement of requirements) {
    const quantity = positiveQuantity(requirement.missing_quantity);
    if (quantity === null) continue;
    const keys = [...new Set(requirement.asset_keys)];
    if (keys.length === 1) include(keys[0]!, quantity);
    else if (keys.length > 1) {
      hasAlternatives = true;
      for (const key of keys) alternatives.add(key);
    }
  }
  // Trait matches are alternatives. Only propose those already chosen by the plan.
  for (const leg of chosenLegs) {
    const quantity = positiveQuantity(leg.quantity);
    if (quantity !== null && alternatives.has(leg.asset_key))
      include(leg.asset_key, quantity);
  }
  return {
    items: [...quantities].map(([assetKey, quantity]) => ({
      assetKey,
      quantity: quantity.toString(),
    })),
    hasAlternatives,
  };
}
