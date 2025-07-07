"use client";

import { createContext, useContext, useMemo, useRef } from "react";

interface ScrollPositionContextValue {
  getPosition: (key: string) => number;
  setPosition: (key: string, value: number) => void;
}

const ScrollPositionContext = createContext<
  ScrollPositionContextValue | undefined
>(undefined);

export const ScrollPositionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const positionsRef = useRef<Record<string, number>>({});

  const getPosition = (key: string) => positionsRef.current[key] ?? 0;
  const setPosition = (key: string, value: number) => {
    positionsRef.current[key] = value;
  };

  const value = useMemo(
    () => ({ getPosition, setPosition }),
    [getPosition, setPosition]
  );

  return (
    <ScrollPositionContext.Provider value={value}>
      {children}
    </ScrollPositionContext.Provider>
  );
};

export const useScrollPositionContext = () => {
  const ctx = useContext(ScrollPositionContext);
  if (!ctx) throw new Error("useScrollPositionContext must be within provider");
  return ctx;
};
