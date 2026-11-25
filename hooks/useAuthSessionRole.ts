"use client";

import { getAuthSessionRole } from "@/components/auth/auth-session-scope";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  PROFILE_SWITCHED_EVENT,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";
import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  const events = [
    "storage",
    AUTH_TOKEN_CHANGED_EVENT,
    WALLET_ACCOUNTS_UPDATED_EVENT,
    PROFILE_SWITCHED_EVENT,
  ];
  for (const event of events) globalThis.addEventListener(event, onChange);
  return () => {
    for (const event of events) globalThis.removeEventListener(event, onChange);
  };
};
const getServerSnapshot = () => undefined;

/** External token changes must invalidate role-dependent UI, including with React Compiler. */
export function useAuthSessionRole() {
  return useSyncExternalStore(subscribe, getAuthSessionRole, getServerSnapshot);
}
