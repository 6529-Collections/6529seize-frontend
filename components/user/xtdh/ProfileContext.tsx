"use client";

import { createContext, useContext } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

const XtdhProfileContext = createContext<ApiIdentity | null>(null);

export function XtdhProfileProvider({
  profile,
  children,
}: {
  readonly profile: ApiIdentity;
  readonly children: React.ReactNode;
}) {
  return <XtdhProfileContext.Provider value={profile}>{children}</XtdhProfileContext.Provider>;
}

export function useXtdhProfile(): ApiIdentity {
  const value = useContext(XtdhProfileContext);
  if (!value) throw new Error("XtdhProfileProvider is missing");
  return value;
}

