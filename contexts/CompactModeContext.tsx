"use client";

import { createContext, useContext, ReactNode, FC } from "react";

const CompactModeContext = createContext<boolean>(false);

interface CompactModeProviderProps {
  readonly children: ReactNode;
  readonly compact: boolean;
}

export const CompactModeProvider: FC<CompactModeProviderProps> = ({
  children,
  compact,
}) => {
  return (
    <CompactModeContext.Provider value={compact}>
      {children}
    </CompactModeContext.Provider>
  );
};

export const useCompactMode = (): boolean => {
  return useContext(CompactModeContext);
};
