"use client";

import { createContext, useContext } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { DropLocation } from "./Drop";

interface DropContextType {
  drop: ExtendedDrop | null;
  location: DropLocation;
}

const DropContext = createContext<DropContextType | undefined>(undefined);

export function useDropContext() {
  const context = useContext(DropContext);
  if (context === undefined) {
    throw new Error("useDropContext must be used within a DropProvider");
  }
  return context;
}

export default DropContext;
