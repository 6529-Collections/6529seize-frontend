import type { QueryClient } from "@tanstack/react-query";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { isPublicWave } from "./authProfileUtils";

export function navigateAfterProfileSwitch({
  pathname,
  queryClient,
  router,
}: {
  readonly pathname: string;
  readonly queryClient: QueryClient;
  readonly router: AppRouterInstance;
}) {
  if (typeof globalThis.location === "undefined") {
    return;
  }

  const activeWaveId = getActiveWaveIdFromUrl({
    pathname,
    searchParams: new URLSearchParams(globalThis.location.search),
  });
  if (!activeWaveId) {
    return;
  }

  const cachedWave = queryClient.getQueryData<ApiWave>([
    QueryKey.WAVE,
    { wave_id: activeWaveId },
  ]);
  if (cachedWave && isPublicWave(cachedWave)) {
    return;
  }

  const isMessagesRoute =
    pathname === "/messages" || pathname.startsWith("/messages/");
  if (isMessagesRoute) {
    router.replace("/messages");
    return;
  }

  const isWavesRoute = pathname === "/waves" || pathname.startsWith("/waves/");
  if (isWavesRoute || pathname === "/") {
    router.replace("/waves");
  }
}
