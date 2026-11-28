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

/** A kept signature is reused only while at least this much of its life is left. */
const MIN_REUSE_LIFE_S = 300n;

/**
 * Whether a signature made earlier in this run (kept after a failed send) can
 * still be sent: its deadline is at least five minutes past the latest block.
 */
export async function deadlineStillUsable(deadline: bigint): Promise<boolean> {
  const block = await getStreamClient().getBlock({ blockTag: "latest" });
  return deadline >= block.timestamp + MIN_REUSE_LIFE_S;
}
