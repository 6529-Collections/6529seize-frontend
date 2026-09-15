import type { ApiMarketOperationResult } from "@/generated/models/ApiMarketOperationResult";
import { fetchRecoverableMarketOperation } from "./market-recovery";
import { createFetchDeadline } from "@/lib/fetch/fetchDeadline";

/** Recheck loaded live orders without opening a wallet or flooding the API. */
export async function reconcileMarketHistory(
  operations: readonly ApiMarketOperationResult[],
  profileId: string,
  signal: AbortSignal
): Promise<readonly ApiMarketOperationResult[]> {
  const live = operations.filter(
    (operation) =>
      operation.kind.toString() !== "BUY_BATCH" &&
      operation.state.toString() === "LIVE"
  );
  const results: ApiMarketOperationResult[] = [];
  for (let start = 0; start < live.length; start += 4) {
    signal.throwIfAborted();
    const values = await Promise.all(
      live.slice(start, start + 4).map(async (operation) => {
        const deadline = createFetchDeadline(
          signal,
          10_000,
          () => new Error("Receipt status check timed out")
        );
        try {
          return await deadline.run(() =>
            fetchRecoverableMarketOperation(
              operation.id,
              profileId,
              deadline.signal
            )
          );
        } catch {
          signal.throwIfAborted();
          return operation;
        } finally {
          deadline.dispose();
        }
      })
    );
    results.push(...values);
  }
  return results;
}
