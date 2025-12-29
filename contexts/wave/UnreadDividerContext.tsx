"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type SetUnreadDividerSerialNo = (
  serialNo: number | null | ((current: number | null) => number | null)
) => void;

interface UnreadDividerContextValue {
  unreadDividerSerialNo: number | null;
  setUnreadDividerSerialNo: SetUnreadDividerSerialNo;
}

const UnreadDividerContext = createContext<UnreadDividerContextValue | null>(
  null
);

interface UnreadDividerProviderProps {
  readonly initialSerialNo: number | null;
  readonly children: ReactNode;
}

export function UnreadDividerProvider({
  initialSerialNo,
  children,
}: UnreadDividerProviderProps) {
  const [unreadDividerSerialNo, setUnreadDividerSerialNo] = useState<
    number | null
  >(initialSerialNo);

  const value = useMemo(
    () => ({
      unreadDividerSerialNo,
      setUnreadDividerSerialNo,
    }),
    [unreadDividerSerialNo, setUnreadDividerSerialNo]
  );

  return (
    <UnreadDividerContext.Provider value={value}>
      {children}
    </UnreadDividerContext.Provider>
  );
}

export function useUnreadDivider() {
  const context = useContext(UnreadDividerContext);
  if (!context) {
    throw new Error(
      "useUnreadDivider must be used within an UnreadDividerProvider"
    );
  }
  return context;
}

export function useUnreadDividerOptional() {
  return useContext(UnreadDividerContext);
}
