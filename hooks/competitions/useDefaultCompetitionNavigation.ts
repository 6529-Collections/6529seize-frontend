"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  isMultiCompetitionEnabled,
  isCompetitionPathname,
} from "@/helpers/competition.helpers";
import {
  getImplicitCompetitionRoute,
  shouldResolveDefault,
} from "@/helpers/default-competition.helpers";
import { useDefaultCompetition } from "./useCompetitionQueries";

export function useDefaultCompetitionNavigation(
  wave: ApiWave | null | undefined,
  enabled: boolean
) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const resolve =
    enabled &&
    isMultiCompetitionEnabled() &&
    Boolean(wave) &&
    !wave?.chat.scope.group?.is_direct_message &&
    shouldResolveDefault(pathname, new URLSearchParams(search.toString()));
  const selection = useDefaultCompetition(wave?.id ?? "", resolve);
  useEffect(() => {
    if (!resolve || !isCompetitionPathname(pathname)) return;
    let pinned = false;
    const pinOpenCommand = () => {
      if (pinned) return;
      if (
        !document.querySelector('[data-competition-command], [role="dialog"]')
      )
        return;
      pinned = true;
      const params = new URLSearchParams(search.toString());
      params.delete("default");
      const target = params.size ? `${pathname}?${params}` : pathname;
      router.replace(target, { scroll: false });
    };
    const observer = new MutationObserver(pinOpenCommand);
    observer.observe(document.body, { childList: true, subtree: true });
    pinOpenCommand();
    return () => observer.disconnect();
  }, [resolve, pathname, search, router]);
  useEffect(() => {
    if (!resolve || !wave || !selection.isSuccess || selection.isError) return;
    if (document.querySelector('[data-competition-command], [role="dialog"]'))
      return;
    // A zero-competition wave remains implicitly selected so publication can refresh it.
    if (
      selection.data.competition_id === null &&
      !isCompetitionPathname(pathname)
    )
      return;
    const target = getImplicitCompetitionRoute(
      wave.id,
      selection.data.competition_id,
      new URLSearchParams(search.toString())
    );
    const current = search.toString() ? `${pathname}?${search}` : pathname;
    if (target !== current) router.replace(target, { scroll: false });
  }, [
    resolve,
    wave,
    selection.data,
    selection.isSuccess,
    selection.isError,
    pathname,
    search,
    router,
  ]);
  return { selection, resolve };
}
