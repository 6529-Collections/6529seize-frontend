"use client";

import { createContext, type ReactNode } from "react";

interface MyStreamActiveCurationContextValue {
  readonly curationId: string;
}

const MyStreamActiveCurationContext =
  createContext<MyStreamActiveCurationContextValue | null>(null);

export function MyStreamActiveCurationProvider({
  curationId,
  children,
}: {
  readonly curationId: string;
  readonly children: ReactNode;
}) {
  return (
    <MyStreamActiveCurationContext.Provider value={{ curationId }}>
      {children}
    </MyStreamActiveCurationContext.Provider>
  );
}
