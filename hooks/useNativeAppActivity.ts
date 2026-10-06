"use client";

import {
  getNativeAppActivity,
  subscribeNativeAppActivity,
} from "@/services/app-activity/native-app-activity";
import { useSyncExternalStore } from "react";

const getServerSnapshot = () => true;

/** Native lifecycle gate; browser behavior is unchanged. */
export function useNativeAppActivity(): boolean {
  return useSyncExternalStore(
    subscribeNativeAppActivity,
    getNativeAppActivity,
    getServerSnapshot
  );
}
