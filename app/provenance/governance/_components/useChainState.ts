"use client";

import { useEffect, useState } from "react";
import type { Address, PublicClient } from "viem";
import { provenanceRegistryAbi } from "@/lib/provenance-core/abi/provenanceRegistry";
import type { RegistryPin } from "@/lib/provenance-core/config/registries";
import { readSafe, type SafeInfo } from "@/lib/provenance-core/safeInfo";
import { errorText } from "@/lib/provenance-governance/checks";

export interface ChainState {
  owner: Address;
  pendingOwner: Address;
  safe: SafeInfo;
}

export type ChainLoad =
  | { status: "loading" }
  | { status: "error"; reason: string }
  | { status: "ready"; state: ChainState };

type Settled = { key: string; load: Exclude<ChainLoad, { status: "loading" }> };

async function readChainState(
  client: PublicClient,
  pin: RegistryPin
): Promise<ChainState> {
  const [owner, pendingOwner, safe] = await Promise.all([
    client.readContract({
      address: pin.registry,
      abi: provenanceRegistryAbi,
      functionName: "owner",
    }),
    client.readContract({
      address: pin.registry,
      abi: provenanceRegistryAbi,
      functionName: "pendingOwner",
    }),
    readSafe(client, pin.safe),
  ]);
  if (safe === undefined)
    throw new Error("the pinned Safe could not be read as a Safe");
  return { owner, pendingOwner, safe };
}

/**
 * The registry's owner and pending owner, and the pinned Safe's owners, threshold and nonce. A
 * result belongs to the pin and attempt it was read for, so a change of registry shows "loading"
 * until the new read settles.
 */
export function useChainState(
  client: PublicClient,
  pin: RegistryPin,
  attempt: number
): ChainLoad {
  const key = `${pin.registry}:${attempt}`;
  const [settled, setSettled] = useState<Settled>();

  useEffect(() => {
    const request = { current: true };
    readChainState(client, pin)
      .then((state) => {
        if (request.current)
          setSettled({ key, load: { status: "ready", state } });
      })
      .catch((e: unknown) => {
        if (request.current)
          setSettled({ key, load: { status: "error", reason: errorText(e) } });
      });
    return () => {
      request.current = false;
    };
  }, [client, pin, key]);

  return settled?.key === key ? settled.load : { status: "loading" };
}
