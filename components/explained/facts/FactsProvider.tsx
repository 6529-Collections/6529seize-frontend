"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  factFromSnapshot,
  type Fact,
  type FactId,
  type FactSnapshot,
  type FactValue,
} from "@/lib/explained/facts";

/**
 * Hands a page's facts, resolved on the server, to its client components:
 * models, live pills and How-we-know actions read numbers through
 * `useFact`, never from props typed by hand (EXPLAINED.md §6.1).
 */
const FactsContext = createContext<FactSnapshot | null>(null);

export default function FactsProvider({
  snapshot,
  children,
}: {
  readonly snapshot: FactSnapshot;
  readonly children: ReactNode;
}) {
  return (
    <FactsContext.Provider value={snapshot}>{children}</FactsContext.Provider>
  );
}

/** The page's facts snapshot; throws outside a FactsProvider. */
export function useFactSnapshot(): FactSnapshot {
  const snapshot = useContext(FactsContext);
  if (!snapshot) {
    throw new Error("useFact needs a FactsProvider above it.");
  }
  return snapshot;
}

/**
 * A fact by id, or null when its source could not be read. An id the
 * registry does not know throws, and so does one the server did not resolve.
 */
export function useFact<T extends FactValue = FactValue>(
  id: FactId
): Fact<T> | null {
  return factFromSnapshot<T>(useFactSnapshot(), id);
}
