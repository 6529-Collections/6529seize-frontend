"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode, RefObject } from "react";

export interface HeaderWaveDropAction {
  readonly waveId: string;
  readonly canOpen: boolean;
  readonly label: string;
  readonly compactLabel: string;
  readonly restrictionMessage: string | null;
  readonly restrictionKind?: "memes-nomination" | undefined;
  readonly onOpen: () => void;
}

interface HeaderContextType {
  headerRef: RefObject<HTMLDivElement | null>;
  setHeaderRef: (ref: HTMLDivElement | null) => void;
  refState: HTMLDivElement | null;
  waveDropAction: HeaderWaveDropAction | null;
  setWaveDropAction: (action: HeaderWaveDropAction | null) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const headerRefInternal = useRef<HTMLDivElement | null>(null);
  // We need a state to trigger re-renders in consumers when the ref changes
  const [refState, setRefState] = useState<HTMLDivElement | null>(null);
  const [waveDropAction, setWaveDropAction] =
    useState<HeaderWaveDropAction | null>(null);

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
      waveDropAction,
      setWaveDropAction,
    }),
    [setHeaderRef, refState, waveDropAction]
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
