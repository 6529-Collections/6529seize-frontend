import {
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  type Hex,
  type PublicClient,
} from "viem";
import type { ContractWalletReader } from "./verify-signed-events";

const EIP1271_ABI = [
  {
    type: "function",
    name: "isValidSignature",
    stateMutability: "view",
    inputs: [
      { name: "hash", type: "bytes32" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [{ name: "magicValue", type: "bytes4" }],
  },
] as const;

/**
 * The contract answered but did not accept the signature: it reverted or
 * returned nothing (no such function). Anything else, such as a transport or
 * node failure, means Ethereum could not be read.
 */
const isContractRejection = (error: unknown): boolean =>
  error instanceof BaseError &&
  error.walk(
    (cause) =>
      cause instanceof ContractFunctionRevertedError ||
      cause instanceof ContractFunctionZeroDataError
  ) !== null;

/**
 * Reads contract wallets through an Ethereum mainnet client. Errors other
 * than a contract rejection propagate, so the verdict is "unverifiable".
 */
export const createContractWalletReader = (
  client: Pick<PublicClient, "getCode" | "readContract">
): ContractWalletReader => ({
  hasCode: async (address: Hex) => {
    const code = await client.getCode({ address });
    return code !== undefined && code !== "0x";
  },
  isValidSignature: async ({ address, hash, signature }) => {
    try {
      return await client.readContract({
        address,
        abi: EIP1271_ABI,
        functionName: "isValidSignature",
        args: [hash, signature],
      });
    } catch (error) {
      if (isContractRejection(error)) {
        return null;
      }
      throw error;
    }
  },
});
