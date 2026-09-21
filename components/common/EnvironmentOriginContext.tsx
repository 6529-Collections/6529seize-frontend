"use client";

import { createContext, useContext, type ReactNode } from "react";
import { PRODUCTION_APP_ORIGIN } from "@/config/appEnvironment";

const EnvironmentOriginContext = createContext(PRODUCTION_APP_ORIGIN);

export function useInitialEnvironmentOrigin() {
  return useContext(EnvironmentOriginContext);
}

export default function EnvironmentOriginProvider({
  origin,
  children,
}: {
  readonly origin: string;
  readonly children: ReactNode;
}) {
  return (
    <EnvironmentOriginContext.Provider value={origin}>
      {children}
    </EnvironmentOriginContext.Provider>
  );
}
