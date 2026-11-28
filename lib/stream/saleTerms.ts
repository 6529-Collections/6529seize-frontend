import { assetAllowlistAbi, economicsAbi, englishAuctionAbi } from "./abis";
import { getStreamClient } from "./client";
import { getStreamInstance } from "./instances";
import { CURRENCY_ETH } from "./item";

/** Shares in the auction contract are out of 100,000. */
const SHARE_DENOMINATOR = 100_000;

/** The 1/1 auction's terms on this instance, read from the contracts (never hard-coded). */
export interface SaleTerms {
  /** How long a sale runs, in seconds. */
  readonly duration: number;
  /** A bid this close to the end moves the end to this long after the bid, in seconds. */
  readonly extensionWindow: number;
  /** Each bid must beat the last by at least this fraction (0.05 = 5%). */
  readonly bidStep: number;
  /** The opening bid in wei (ETH). */
  readonly openingBid: bigint;
}

export async function readSaleTerms(): Promise<SaleTerms> {
  const client = getStreamClient();
  const instance = getStreamInstance();
  const [config, allowlist] = await Promise.all([
    client.readContract({ address: instance.addresses.englishAuction, abi: englishAuctionAbi, functionName: "config" }),
    client.readContract({ address: instance.addresses.economics, abi: economicsAbi, functionName: "assetAllowlist" }),
  ]);
  const openingBid = await client.readContract({
    address: allowlist,
    abi: assetAllowlistAbi,
    functionName: "openingBid",
    args: [CURRENCY_ETH],
  });
  return {
    duration: Number(config.duration),
    extensionWindow: Number(config.extensionWindow),
    bidStep: Number(config.incrementShare) / SHARE_DENOMINATOR,
    openingBid,
  };
}
