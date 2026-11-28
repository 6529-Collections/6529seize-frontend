"use client";

import { useSyncExternalStore } from "react";
import type { Hex } from "viem";

/**
 * Result lines of transactions whose button has left the page. Most Stream
 * actions change the screen they were pressed on (a finished sale has no
 * "Finish the sale" button), so TxAction hands its result line here when it
 * unmounts, and TxResultBar keeps showing it with its Etherscan link.
 */
interface TxResult {
  readonly id: number;
  readonly text: string | undefined;
  readonly hash: Hex;
}

let results: readonly TxResult[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit(next: readonly TxResult[]) {
  results = next;
  for (const listener of listeners) listener();
}

/** Keeps a result whose button is gone. At most the three newest are kept. */
export function keepTxResult(text: string | undefined, hash: Hex): void {
  emit([...results, { id: nextId++, text, hash }].slice(-3));
}

export function dismissTxResult(id: number): void {
  emit(results.filter((result) => result.id !== id));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const EMPTY: readonly TxResult[] = [];

export function useKeptTxResults(): readonly TxResult[] {
  return useSyncExternalStore(subscribe, () => results, () => EMPTY);
}
