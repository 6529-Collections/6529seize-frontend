/**
 * Wallet transactions for 6529 Desktop: the exact price of a mint, read
 * from the chain by the browser page. The rule table only caps the value;
 * the page requires the value to equal the current price.
 */

import type { Address } from "viem";
import type { TransactionDescription } from "./describe";

const MANIFOLD_PRICE_ABI = [
  {
    type: "function",
    name: "getClaim",
    stateMutability: "view",
    inputs: [
      { name: "creatorContractAddress", type: "address" },
      { name: "instanceId", type: "uint256" },
    ],
    outputs: [
      {
        name: "claim",
        type: "tuple",
        components: [
          { name: "total", type: "uint32" },
          { name: "totalMax", type: "uint32" },
          { name: "walletMax", type: "uint32" },
          { name: "startDate", type: "uint48" },
          { name: "endDate", type: "uint48" },
          { name: "storageProtocol", type: "uint8" },
          { name: "merkleRoot", type: "bytes32" },
          { name: "location", type: "string" },
          { name: "tokenId", type: "uint256" },
          { name: "cost", type: "uint256" },
          { name: "paymentReceiver", type: "address" },
          { name: "erc20", type: "address" },
          { name: "signingAddress", type: "address" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "MINT_FEE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MINT_FEE_MERKLE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const NEXTGEN_PRICE_ABI = [
  {
    type: "function",
    name: "getPrice",
    stateMutability: "view",
    inputs: [{ name: "_collectionId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** The read calls the page needs (a viem public client satisfies this). */
export interface PriceReader {
  readContract(parameters: {
    readonly address: Address;
    readonly abi: readonly unknown[];
    readonly functionName: string;
    readonly args?: readonly unknown[];
  }): Promise<unknown>;
}

const argOf = (description: TransactionDescription, name: string) =>
  description.args.find((arg) => arg.name === name)?.value;

/** Whether any allowlist proof is passed (Manifold charges the merkle fee). */
function hasProof(description: TransactionDescription): boolean {
  const proof = argOf(description, "merkleProof");
  const proofs = argOf(description, "merkleProofs");
  return (
    (Array.isArray(proof) && proof.length > 0) ||
    (Array.isArray(proofs) && proofs.length > 0)
  );
}

/** Whether this transaction's value is a mint price the page can read. */
export const hasReadablePrice = (description: TransactionDescription) =>
  description.contract === "memes" || description.contract === "nextgen";

/**
 * The value this mint must carry at the current price: (claim cost + fee)
 * x count for The Memes, price x count for NextGen. Null for other
 * transactions. Throws when a read fails.
 */
export async function readExpectedMintValue(
  client: PriceReader,
  description: TransactionDescription
): Promise<bigint | null> {
  const count = description.count;
  if (count === null) return null;
  const to = description.to as Address;
  if (description.contract === "memes") {
    const creator = argOf(description, "creatorContractAddress") as Address;
    const instanceId = argOf(description, "instanceId") as bigint;
    const [claim, fee] = await Promise.all([
      client.readContract({
        address: to,
        abi: MANIFOLD_PRICE_ABI,
        functionName: "getClaim",
        args: [creator, instanceId],
      }),
      client.readContract({
        address: to,
        abi: MANIFOLD_PRICE_ABI,
        functionName: hasProof(description) ? "MINT_FEE_MERKLE" : "MINT_FEE",
      }),
    ]);
    const cost = (claim as { readonly cost: bigint }).cost;
    return (cost + (fee as bigint)) * count;
  }
  if (description.contract === "nextgen") {
    const price = await client.readContract({
      address: to,
      abi: NEXTGEN_PRICE_ABI,
      functionName: "getPrice",
      args: [argOf(description, "_collectionID") as bigint],
    });
    return (price as bigint) * count;
  }
  return null;
}
