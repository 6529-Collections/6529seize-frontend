import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  WaitForTransactionReceiptTimeoutError,
  type Abi,
  type Address,
  type Hex,
  type TransactionReceipt,
} from "viem";

import { getStreamClient, STREAM_CHAIN } from "@/lib/stream/client";

export interface TxRequest {
  readonly address: Address;
  readonly abi: Abi;
  readonly functionName: string;
  readonly args?: readonly unknown[] | undefined;
  readonly value?: bigint | undefined;
}

export type TxPhase = "idle" | "wallet" | "pending" | "slow" | "done" | "error";

export interface TxState {
  readonly phase: TxPhase;
  readonly hash?: Hex | undefined;
  /** A contract error name, "rejected", "chain", or "failed". */
  readonly error?: string | undefined;
}

/** A failed send: the error name, and the hash when the transaction reached the chain. */
export class StreamTxError extends Error {
  constructor(
    readonly errorName: string,
    readonly hash?: Hex | undefined
  ) {
    super(errorName);
  }
}

/** The contract error name a failed call carries; "rejected", "chain" or "failed" otherwise. */
export function errorNameOf(error: unknown): string {
  if (error instanceof StreamTxError) return error.errorName;
  if (error instanceof BaseError) {
    if (error.walk((cause) => cause instanceof UserRejectedRequestError)) return "rejected";
    if (error.name === "ChainMismatchError" || error.walk((cause) => (cause as Error).name === "ChainMismatchError")) {
      return "chain";
    }
    const reverted = error.walk((cause) => cause instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      return reverted.data?.errorName ?? reverted.reason ?? "failed";
    }
    if (/user rejected|user denied/i.test(error.message)) return "rejected";
  }
  return "failed";
}

type WriteContract = (parameters: never) => Promise<Hex>;

const SLOW_AFTER_MS = 90_000;

/**
 * Simulates (so a refusal shows before the wallet opens), sends through the
 * wallet, then waits for the block without giving up: after a while it reports
 * "slow" and keeps waiting, because a transaction that is late is not failed.
 * A transaction that reverts on chain is simulated again at its block to name
 * the reason. Resolves once the read node has reached the receipt's block, so
 * a refetch right after sees the new state.
 */
export async function sendStreamTx(args: {
  readonly account: Address;
  readonly request: TxRequest;
  readonly writeContractAsync: WriteContract;
  readonly onState: (state: TxState) => void;
}): Promise<TransactionReceipt> {
  const { account, request, onState } = args;
  const client = getStreamClient();
  const call = {
    account,
    address: request.address,
    abi: request.abi,
    functionName: request.functionName,
    args: request.args ?? [],
    value: request.value,
  };
  onState({ phase: "wallet" });
  await client.simulateContract(call as never);
  const hash = await args.writeContractAsync({ ...call, chainId: STREAM_CHAIN.id } as never);
  onState({ phase: "pending", hash });
  let receipt: TransactionReceipt | null = null;
  while (!receipt) {
    try {
      receipt = await client.waitForTransactionReceipt({ hash, timeout: SLOW_AFTER_MS });
    } catch (error) {
      if (!(error instanceof WaitForTransactionReceiptTimeoutError)) throw new StreamTxError("failed", hash);
      onState({ phase: "slow", hash });
    }
  }
  if (receipt.status !== "success") {
    let name = "failed";
    try {
      await client.simulateContract({ ...call, blockNumber: receipt.blockNumber } as never);
    } catch (error) {
      name = errorNameOf(error);
    }
    throw new StreamTxError(name, hash);
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    if ((await client.getBlockNumber().catch(() => receipt.blockNumber)) >= receipt.blockNumber) break;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  onState({ phase: "done", hash });
  return receipt;
}
