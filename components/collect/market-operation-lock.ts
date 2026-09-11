/** One browser may prompt the wallet for an operation at a time, including across tabs. */
export async function withMarketOperationLock(
  operationId: string,
  execute: () => Promise<void>
): Promise<void> {
  const browser: Partial<Navigator> = navigator;
  const locks = browser.locks;
  if (!locks) throw new Error("MARKET_EXECUTION_LOCK_UNAVAILABLE");
  await locks.request(
    `6529-market-execute:${operationId}`,
    { mode: "exclusive", ifAvailable: true },
    async (lock) => {
      if (!lock) throw new Error("MARKET_EXECUTION_ALREADY_ACTIVE");
      await execute();
    }
  );
}
