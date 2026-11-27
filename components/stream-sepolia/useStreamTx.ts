"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  type Abi,
  type Address,
  type Hex,
  type TransactionReceipt,
} from "viem";
import { useWriteContract } from "wagmi";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { getStreamClient, STREAM_CHAIN } from "@/lib/stream/client";

import { useStreamWallet } from "./WalletGate";

export type TxPhase = "idle" | "wallet" | "pending" | "done" | "error";

export interface TxState {
  readonly phase: TxPhase;
  readonly hash?: Hex | undefined;
  /** A contract error name, "rejected", or "failed". */
  readonly error?: string | undefined;
}

export interface TxRequest {
  readonly address: Address;
  readonly abi: Abi;
  readonly functionName: string;
  readonly args?: readonly unknown[] | undefined;
  readonly value?: bigint | undefined;
}

/** The contract error name a failed call carries, "rejected" when the wallet refused, else "failed". */
export function errorNameOf(error: unknown): string {
  if (error instanceof BaseError) {
    if (error.walk((cause) => cause instanceof UserRejectedRequestError)) {
      return "rejected";
    }
    const reverted = error.walk((cause) => cause instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      return reverted.data?.errorName ?? reverted.reason ?? "failed";
    }
    if (/user rejected|user denied/i.test(error.message)) return "rejected";
  }
  return "failed";
}

/**
 * Sends one Stream transaction on Sepolia: simulates it first (so a refusal is
 * shown before the wallet opens), waits for the wallet, then for the block,
 * and refreshes every Stream read afterwards.
 */
export function useStreamTx() {
  const { address } = useStreamWallet();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const [state, setState] = useState<TxState>({ phase: "idle" });

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  const send = useCallback(
    async (request: TxRequest): Promise<TransactionReceipt | null> => {
      if (!address) return null;
      const client = getStreamClient();
      setState({ phase: "wallet" });
      try {
        await client.simulateContract({
          account: address,
          address: request.address,
          abi: request.abi,
          functionName: request.functionName,
          args: request.args ?? [],
          value: request.value,
        } as never);
        const hash = await writeContractAsync({
          chainId: STREAM_CHAIN.id,
          address: request.address,
          abi: request.abi,
          functionName: request.functionName,
          args: request.args ?? [],
          value: request.value,
        } as never);
        setState({ phase: "pending", hash });
        const receipt = await client.waitForTransactionReceipt({ hash, timeout: 300_000 });
        if (receipt.status !== "success") {
          setState({ phase: "error", hash, error: "failed" });
          return null;
        }
        setState({ phase: "done", hash });
        await queryClient.invalidateQueries({ queryKey: [QueryKey.STREAM_SEPOLIA] });
        return receipt;
      } catch (error) {
        setState((previous) => ({
          phase: "error",
          hash: previous.hash,
          error: errorNameOf(error),
        }));
        return null;
      }
    },
    [address, queryClient, writeContractAsync]
  );

  return { state, send, reset };
}
