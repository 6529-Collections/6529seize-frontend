"use client";

import { useSyncExternalStore } from "react";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  PROFILE_SWITCHED_EVENT,
  WALLET_ACCOUNTS_UPDATED_EVENT,
} from "@/services/auth/auth.utils";
import { getCurrentProfileQueryViewer } from "@/services/auth/profile-query-viewer";

const events = [
  AUTH_TOKEN_CHANGED_EVENT,
  PROFILE_SWITCHED_EVENT,
  WALLET_ACCOUNTS_UPDATED_EVENT,
  "storage",
];

function subscribe(onChange: () => void) {
  for (const event of events) window.addEventListener(event, onChange);
  return () => {
    for (const event of events) window.removeEventListener(event, onChange);
  };
}

// A hard navigation can carry a cookie that differs from the browser's
// active account. Wait for the browser to identify which key may be consumed.
export const PENDING_PROFILE_QUERY_VIEWER = "pending";

const getServerSnapshot = () => PENDING_PROFILE_QUERY_VIEWER;

export function useProfileQueryViewer(): string | null {
  return useSyncExternalStore(
    subscribe,
    getCurrentProfileQueryViewer,
    getServerSnapshot
  );
}
