"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { TransactionReceipt } from "viem";
import { useWriteContract } from "wagmi";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";

import { errorNameOf, sendStreamTx, StreamTxError, type TxRequest, type TxState } from "./sendStreamTx";
import { useStreamWallet } from "./WalletGate";

export type { TxRequest, TxState } from "./sendStreamTx";

/** One Stream transaction with its state, refreshing every Stream read afterwards. */
export function useStreamTx() {
  const { address } = useStreamWallet();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const [state, setState] = useState<TxState>({ phase: "idle" });

  const send = useCallback(
    async (request: TxRequest): Promise<TransactionReceipt | null> => {
      if (!address) return null;
      try {
        const receipt = await sendStreamTx({
          account: address,
          request,
          writeContractAsync: writeContractAsync as never,
          onState: setState,
        });
        await queryClient.invalidateQueries({ queryKey: [QueryKey.STREAM_SEPOLIA] });
        return receipt;
      } catch (error) {
        setState((previous) => ({
          phase: "error",
          hash: error instanceof StreamTxError ? error.hash : previous.hash,
          error: errorNameOf(error),
        }));
        return null;
      }
    },
    [address, queryClient, writeContractAsync]
  );

  return { state, send };
}
