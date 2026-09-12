import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import {
  batchNeedsPolling,
  fetchRecoverableMarketBatch,
} from "./market-batch-recovery";
import { listSavedMarketBatches } from "./market-batch-storage";
import { marketBatchLiteral } from "./market-batch-validation";

type SelectedOrder = Pick<
  ApiMarketBatchPrepareRequest["items"][number],
  "asset_key" | "order"
>;
interface ResumableBatch {
  operation: Awaited<ReturnType<typeof fetchRecoverableMarketBatch>>;
  request: ApiMarketBatchPrepareRequest;
}
export const marketBatchProfileLock = (profile: string) =>
  `batch-profile:${profile}`;
const orderKey = (item: SelectedOrder) =>
  `${item.asset_key}:${item.order.protocol_address.toLowerCase()}:${item.order.order_hash.toLowerCase()}`;

/** Resolve earlier intent before offering another purchase. Never infer failure from an absent hash. */
export async function findResumableMarketBatch(
  profile: string,
  items: readonly SelectedOrder[],
  options: {
    excludeId?: string;
    includeReview?: boolean;
    signal?: AbortSignal;
  } = {}
) {
  const selected = new Set(items.map(orderKey));
  const selectedAssets = new Set(items.map((item) => item.asset_key));
  const candidates = listSavedMarketBatches(profile).filter(
    ({ id, saved }) =>
      id !== options.excludeId &&
      saved.request.items.some((item) => selectedAssets.has(item.asset_key))
  );
  let found: ResumableBatch | null = null;
  let review: ResumableBatch | null = null;
  for (const { id, saved } of candidates) {
    const operation = await fetchRecoverableMarketBatch(
      id,
      profile,
      options.signal
    );
    if (
      operation.id !== id ||
      operation.wallet.toLowerCase() !== saved.request.wallet.toLowerCase()
    )
      throw new Error("MARKET_REVIEW_MISMATCH");
    if (batchNeedsPolling(operation)) {
      if (found) throw new Error("MARKET_RECOVERY_REQUIRED");
      found = { operation, request: saved.request };
    } else if (
      options.includeReview !== false &&
      saved.request.items.some((item) => selected.has(orderKey(item))) &&
      marketBatchLiteral(operation.state, "REVIEW") &&
      operation.expires_at > Date.now() &&
      (!review ||
        operation.updated_at > review.operation.updated_at ||
        (operation.updated_at === review.operation.updated_at &&
          operation.id.localeCompare(review.operation.id) > 0))
    ) {
      review = { operation, request: saved.request };
    }
  }
  return found ?? review;
}
