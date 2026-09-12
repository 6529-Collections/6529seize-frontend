/** One browser may prompt the wallet for an operation at a time, including across tabs. */
export async function withMarketOperationLock<T = void>(
  operationId: string,
  execute: () => Promise<T>
): Promise<T> {
  const browser: Partial<Navigator> = navigator;
  const locks = browser.locks;
  if (!locks) throw new Error("MARKET_EXECUTION_LOCK_UNAVAILABLE");
  return locks.request(
    `6529-market-execute:${operationId}`,
    { mode: "exclusive", ifAvailable: true },
    async (lock) => {
      if (!lock) throw new Error("MARKET_EXECUTION_ALREADY_ACTIVE");
      return execute();
    }
  );
}
