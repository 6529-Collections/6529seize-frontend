import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import type { ApiCollectRule } from "@/generated/models/ApiCollectRule";
import { ApiCollectRuleStateEnum } from "@/generated/models/ApiCollectRule";
import type { ApiCollectRuleTarget } from "@/generated/models/ApiCollectRuleTarget";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { MARKET_ZERO } from "./market-validation";

export function collectRuleDeadlineFromPlan(
  plan: Pick<ApiCollectPlan, "updated_at">
): number {
  const deadline = plan.updated_at + 7 * 86400000;
  if (
    !Number.isSafeInteger(plan.updated_at) ||
    plan.updated_at <= 0 ||
    deadline > 8640000000000000
  )
    throw new Error("RULE_PLAN_REFRESH");
  return deadline;
}

export function ruleUnitPrice(order: ApiMarketTradeOrder): bigint {
  const total = BigInt(order.total_wei);
  const quantity = BigInt(order.quantity);
  if (
    order.currency.toLowerCase() !== MARKET_ZERO ||
    quantity <= 0n ||
    total <= 0n ||
    total % quantity !== 0n
  )
    throw new Error("RULE_UNSUPPORTED_ORDER");
  return total / quantity;
}

export function collectRuleTargetsFromPlan(
  plan: ApiCollectPlan
): ApiCollectRuleTarget[] {
  return plan.result.legs.map((leg) => {
    const price = leg.unit_price_wei;
    if (
      price === undefined ||
      !/^[1-9][0-9]{0,77}$/.test(price) ||
      !/^[1-9][0-9]{0,77}$/.test(leg.quantity) ||
      BigInt(price) >= 2n ** 256n ||
      BigInt(leg.quantity) >= 2n ** 256n
    )
      throw new Error("RULE_PLAN_REFRESH");
    // Saving reviewed bounds does not grant execution authority; prepare rechecks the market later.
    return {
      asset_key: leg.asset_key,
      target_quantity: leg.quantity,
      maximum_unit_price_wei: price,
    };
  });
}

export function collectRuleRemaining(
  rule: ApiCollectRule,
  target: ApiCollectRuleTarget
): bigint {
  const acquired =
    rule.acquired.find((item) => item.asset_key === target.asset_key)
      ?.quantity ?? "0";
  const remaining = BigInt(target.target_quantity) - BigInt(acquired);
  return remaining > 0n ? remaining : 0n;
}

export function collectRuleTrade(
  rule: ApiCollectRule,
  target: ApiCollectRuleTarget,
  orders: readonly ApiMarketTradeOrder[],
  acknowledgeExternal: boolean,
  observedAt: number
): ApiMarketPrepareRequest {
  if (
    rule.state !== ApiCollectRuleStateEnum.Active ||
    rule.pending_review ||
    !Number.isSafeInteger(observedAt) ||
    observedAt <= 0 ||
    rule.definition.expires_at <= observedAt
  )
    throw new Error("RULE_INACTIVE");
  const remaining = collectRuleRemaining(rule, target);
  if (remaining === 0n) throw new Error("RULE_TARGET_COMPLETE");
  const candidates = orders
    .filter((order) => {
      try {
        return ruleUnitPrice(order) <= BigInt(target.maximum_unit_price_wei);
      } catch {
        return false;
      }
    })
    .toSorted((a, b) => {
      const difference = ruleUnitPrice(a) - ruleUnitPrice(b);
      return difference < 0n ? -1 : Number(difference > 0n);
    });
  const order = candidates[0];
  if (!order) throw new Error("RULE_NO_MATCH");
  const quantity =
    remaining < BigInt(order.quantity) ? remaining : BigInt(order.quantity);
  return {
    profile_id: rule.definition.profile_id,
    wallet: rule.definition.funding_wallet,
    recipient: rule.definition.recipient,
    asset_key: target.asset_key,
    kind: ApiMarketKind.Buy,
    quantity: quantity.toString(),
    currency: MARKET_ZERO,
    amount_wei: (ruleUnitPrice(order) * quantity).toString(),
    acknowledge_external_recipient: acknowledgeExternal,
    order: order.identity,
  };
}
