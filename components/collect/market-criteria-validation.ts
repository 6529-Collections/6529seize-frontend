import { concat, keccak256, toHex, type Hex } from "viem";

interface CriteriaResolver {
  readonly orderIndex: bigint;
  readonly side: number;
  readonly index: bigint;
  readonly identifier: bigint;
  readonly criteriaProof: readonly Hex[];
}

/** Bind the resolver to the current page NFT and the original signed criteria root. */
export function validateMarketCriteriaResolution({
  accepting,
  itemType,
  expectedType,
  root,
  tokenId,
  resolvers,
}: {
  readonly accepting: boolean;
  readonly itemType: number;
  readonly expectedType: number;
  readonly root: bigint;
  readonly tokenId: bigint;
  readonly resolvers: readonly CriteriaResolver[];
}): void {
  const fail = (): never => {
    throw new Error("MARKET_REVIEW_MISMATCH");
  };
  if (!accepting || itemType !== expectedType + 2) {
    if (resolvers.length !== 0) fail();
    return;
  }
  const resolver = resolvers[0];
  if (!resolver) return fail();
  if (
    resolvers.length !== 1 ||
    resolver.orderIndex !== 0n ||
    resolver.side !== 1 ||
    resolver.index !== 0n ||
    resolver.identifier !== tokenId ||
    resolver.criteriaProof.length > 32
  )
    return fail();
  if (root === 0n) {
    if (resolver.criteriaProof.length !== 0) fail();
    return;
  }
  let hash = keccak256(toHex(tokenId, { size: 32 }));
  for (const sibling of resolver.criteriaProof) {
    if (!/^0x[0-9a-fA-F]{64}$/.test(sibling)) fail();
    hash = keccak256(
      concat(
        BigInt(hash) <= BigInt(sibling) ? [hash, sibling] : [sibling, hash]
      )
    );
  }
  if (BigInt(hash) !== root) fail();
}
