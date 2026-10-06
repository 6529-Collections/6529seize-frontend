"use client";

import { useSyncExternalStore } from "react";
import {
  getMobileAppActivity,
  getMobileBatterySavings,
  subscribeMobileAppActivity,
} from "@/services/app-activity/mobile-app-activity";

const getServerActivity = () => true;
const getServerMobile = () => false;

/** Pause unnecessary work in hidden mobile browser tabs or inactive native apps. */
export function useMobileAppActivity(): boolean {
  return useSyncExternalStore(
    subscribeMobileAppActivity,
    getMobileAppActivity,
    getServerActivity
  );
}

export function useMobileBatterySavings(): boolean {
  return useSyncExternalStore(
    subscribeMobileAppActivity,
    getMobileBatterySavings,
    getServerMobile
  );
}
