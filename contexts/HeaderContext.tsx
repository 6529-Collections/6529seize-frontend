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
import type { ApiWave } from "@/generated/models/ApiWave";

export interface HeaderWaveDropAction {
  readonly waveId: string;
  readonly canOpen: boolean;
  readonly label: string;
  readonly compactLabel: string;
  readonly restrictionMessage: string | null;
  readonly accessWave?: ApiWave | undefined;
  readonly onViewRules?: (() => void) | undefined;
  readonly restrictionKind?: "memes-nomination" | undefined;
  readonly onOpen: () => void;
}

interface HeaderContextType {
  headerRef: RefObject<HTMLDivElement | null>;
  setHeaderRef: (ref: HTMLDivElement | null) => void;
  refState: HTMLDivElement | null;
  waveDropAction: HeaderWaveDropAction | null;
  setWaveDropAction: (action: HeaderWaveDropAction | null) => void;
  requestSubmissionRulesFocus: (waveId: string) => void;
  consumeSubmissionRulesFocus: (waveId: string) => boolean;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

/** Share header actions and preserve their focus intent across route changes. */
export const HeaderProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const headerRefInternal = useRef<HTMLDivElement | null>(null);
  // We need a state to trigger re-renders in consumers when the ref changes
  const [refState, setRefState] = useState<HTMLDivElement | null>(null);
  const [waveDropAction, setWaveDropAction] =
    useState<HeaderWaveDropAction | null>(null);
  const submissionRulesFocusWaveIdRef = useRef<string | null>(null);

  /** Keep a rules focus request across a Wave-to-competition route change. */
  const requestSubmissionRulesFocus = useCallback((waveId: string) => {
    submissionRulesFocusWaveIdRef.current = waveId;
  }, []);

  /** Consume the request only when that Wave's Configuration tab is mounted. */
  const consumeSubmissionRulesFocus = useCallback((waveId: string): boolean => {
    if (submissionRulesFocusWaveIdRef.current !== waveId) return false;
    submissionRulesFocusWaveIdRef.current = null;
    return true;
  }, []);

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
      requestSubmissionRulesFocus,
      consumeSubmissionRulesFocus,
    }),
    [
      setHeaderRef,
      refState,
      waveDropAction,
      requestSubmissionRulesFocus,
      consumeSubmissionRulesFocus,
    ]
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

export const useOptionalHeaderContext = (): HeaderContextType | undefined =>
  useContext(HeaderContext);
