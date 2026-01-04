"use client";

import type {
  ReactNode,
  RefObject} from "react";
import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";

interface HeaderContextType {
  headerRef: RefObject<HTMLDivElement | null>;
  setHeaderRef: (ref: HTMLDivElement | null) => void;
  refState: HTMLDivElement | null;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const headerRefInternal = useRef<HTMLDivElement | null>(null);
  // We need a state to trigger re-renders in consumers when the ref changes
  const [refState, setRefState] = useState<HTMLDivElement | null>(null);

  const setHeaderRef = useCallback((ref: HTMLDivElement | null) => {
    if (headerRefInternal.current !== ref) {
      headerRefInternal.current = ref;
      setRefState(ref); // Trigger update for consumers
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      // Provide the mutable ref object directly
      headerRef: headerRefInternal,
      // Provide the function to update the ref and trigger state change
      setHeaderRef: setHeaderRef,
      // Provide the state value
      refState: refState,
    }),
    [setHeaderRef, refState]
  );

  return (
    <HeaderContext.Provider value={contextValue}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeaderContext = (): HeaderContextType => {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error("useHeaderContext must be used within a HeaderProvider");
  }
  return context;
};
