"use client";

import { use, type ReactNode } from "react";
import { getPendingRouteLocaleLoad } from "@/i18n/localeDictionaries";

/**
 * Pages opened with `?locale=` are server-rendered in that locale. In the
 * browser its dictionary loads on demand, so wait for it before hydrating:
 * the server markup stays on screen and the client renders the same copy.
 * Server rendering never waits here.
 */
export default function LocaleMessagesGate({
  children,
}: {
  readonly children: ReactNode;
}) {
  const pendingRouteLocaleLoad = getPendingRouteLocaleLoad();
  if (pendingRouteLocaleLoad) {
    use(pendingRouteLocaleLoad);
  }

  return children;
}
