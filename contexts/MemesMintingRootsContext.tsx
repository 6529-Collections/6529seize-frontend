"use client";

import { createContext, useState, type ReactNode } from "react";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import { getMemesMintingRoots } from "@/services/api/memes-minting-claims-api";

interface MemesMintingRootsScope {
  read: (cardId: number) => {
    promise: Promise<MintingClaimsRootItem[]>;
    release: () => void;
  };
}

export const MemesMintingRootsContext =
  createContext<MemesMintingRootsScope | null>(null);

function createMemesMintingRootsScope(): MemesMintingRootsScope {
  const reads = new Map<number, Promise<MintingClaimsRootItem[]>>();

  return {
    read(cardId) {
      let promise = reads.get(cardId);
      if (!promise) {
        const shared = load();
        async function load(): Promise<MintingClaimsRootItem[]> {
          try {
            return await getMemesMintingRoots(cardId);
          } catch (error) {
            if (reads.get(cardId) === shared) reads.delete(cardId);
            throw error;
          }
        }
        reads.set(cardId, shared);
        promise = shared;
      }

      const current = promise;
      return {
        promise: current,
        // Any consumer leaving ends this initial read's lifetime. Later mounts
        // and contract/card changes must be able to fetch fresh roots.
        release() {
          if (reads.get(cardId) === current) reads.delete(cardId);
        },
      };
    },
  };
}

/** Retain initial reads inside this page; cleanup makes later reads fresh. */
export function MemesMintingRootsProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [scope] = useState(createMemesMintingRootsScope);
  return (
    <MemesMintingRootsContext value={scope}>
      {children}
    </MemesMintingRootsContext>
  );
}
