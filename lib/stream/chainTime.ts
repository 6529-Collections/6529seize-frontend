import { getStreamClient } from "./client";

/**
 * A signature deadline on the chain's clock: the latest block's timestamp plus
 * `lifetimeSeconds`. Contracts compare deadlines with block.timestamp, so a
 * visitor's slow or fast computer clock must not decide them.
 */
export async function chainDeadline(lifetimeSeconds: number): Promise<bigint> {
  const block = await getStreamClient().getBlock({ blockTag: "latest" });
  return block.timestamp + BigInt(lifetimeSeconds);
}
