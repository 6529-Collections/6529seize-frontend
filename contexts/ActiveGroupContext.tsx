"use client";

import type { FC, ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

interface ActiveGroupContextValue {
  readonly activeGroupId: string | null;
  readonly setActiveGroupId: (groupId: string | null) => void;
}

const ActiveGroupContext = createContext<ActiveGroupContextValue | undefined>(
  undefined
);

export const ActiveGroupProvider: FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ activeGroupId, setActiveGroupId }),
    [activeGroupId]
  );

  return (
    <ActiveGroupContext.Provider value={value}>
      {children}
    </ActiveGroupContext.Provider>
  );
};

export const useActiveGroup = (): ActiveGroupContextValue => {
  const context = useContext(ActiveGroupContext);
  if (context === undefined) {
    throw new Error(
      "useActiveGroup must be used within an ActiveGroupProvider"
    );
  }
  return context;
};
