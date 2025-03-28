import React, { createContext, useContext, ReactNode } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { DropLocation } from "./Drop";

interface DropContextType {
  drop: ExtendedDrop | null;
  location: DropLocation;
}

const DropContext = createContext<DropContextType | undefined>(undefined);

interface DropProviderProps {
  children: ReactNode;
  drop: ExtendedDrop | null;
  location: DropLocation;
}

export function DropProvider({
  children,
  drop,
  location,
}: DropProviderProps) {
  const value = {
    drop,
    location,
  };

  return <DropContext.Provider value={value}>{children}</DropContext.Provider>;
}

export function useDropContext() {
  const context = useContext(DropContext);
  if (context === undefined) {
    throw new Error("useDropContext must be used within a DropProvider");
  }
  return context;
}

export default DropContext;