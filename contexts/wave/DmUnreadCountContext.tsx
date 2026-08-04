"use client";

import { createContext, useContext, type ReactNode } from "react";

const DmUnreadCountContext = createContext<number | null>(null);

export function DmUnreadCountProvider({
  children,
  unreadCount,
}: {
  readonly children: ReactNode;
  readonly unreadCount: number;
}) {
  return (
    <DmUnreadCountContext.Provider value={unreadCount}>
      {children}
    </DmUnreadCountContext.Provider>
  );
}

export const useDmUnreadCountOptional = (): number | null =>
  useContext(DmUnreadCountContext);
