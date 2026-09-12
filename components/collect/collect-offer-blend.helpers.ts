import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";
import {
  collectPlanLegCost,
  collectPlanSelectionCost,
} from "./collect-plan-selection.helpers";
import { offerQuantity } from "./collect-offer-plan.helpers";
import type { OfferPlanRow } from "./collect-offer-plan.types";

/** A route buys the entire requested NFT quantity, preserving every exact observed listing. */
export function offerBuyOptions(
  rows: readonly OfferPlanRow[],
  legs: readonly ApiCollectPlanLeg[]
): ReadonlyMap<
  string,
  { readonly legs: readonly ApiCollectPlanLeg[]; readonly costWei: string }
> {
  const grouped = new Map<string, ApiCollectPlanLeg[]>();
  for (const leg of legs) {
    const group = grouped.get(leg.asset_key) ?? [];
    group.push(leg);
    grouped.set(leg.asset_key, group);
  }
  const options = new Map<
    string,
    { legs: readonly ApiCollectPlanLeg[]; costWei: string }
  >();
  for (const row of rows) {
    const group = grouped.get(row.assetKey);
    const quantity = offerQuantity(row);
    if (!group || quantity === null) continue;
    const hashes = new Set<string>();
    let copies = 0n;
    let valid = true;
    for (const leg of group) {
      const hash = leg.order_id.toLowerCase();
      if (
        !/^0x[0-9a-f]{64}$/.test(hash) ||
        hashes.has(hash) ||
        collectPlanLegCost(leg) === null
      ) {
        valid = false;
        break;
      }
      hashes.add(hash);
      copies += BigInt(leg.quantity);
    }
    const costWei = valid ? collectPlanSelectionCost(group) : null;
    if (copies === quantity && costWei !== null)
      options.set(row.assetKey, { legs: group, costWei });
  }
  return options;
}
