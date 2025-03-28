import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { DropLocation } from "./Drop";

interface DropContextType {
  drop: ExtendedDrop | null;
  location: DropLocation;
}

const DropContext = createContext<DropContextType | undefined>(undefined);

interface DropProviderProps {
  readonly children: ReactNode;
  readonly drop: ExtendedDrop | null;
  readonly location: DropLocation;
}

export function DropProvider({ children, drop, location }: DropProviderProps) {
  const memoizedValue = useMemo(() => ({ drop, location }), [drop, location]);

  return (
    <DropContext.Provider value={memoizedValue}>
      {children}
    </DropContext.Provider>
  );
}

export function useDropContext() {
  const context = useContext(DropContext);
  if (context === undefined) {
    throw new Error("useDropContext must be used within a DropProvider");
  }
  return context;
}

export default DropContext;
