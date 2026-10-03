"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  isMultiCompetitionEnabled,
  isCompetitionPathname,
  getCompetitionRoute,
} from "@/helpers/competition.helpers";
import {
  getImplicitCompetitionRoute,
  shouldResolveDefault,
} from "@/helpers/default-competition.helpers";
import { useDefaultCompetition } from "./useCompetitionQueries";

const commandSelector = '[data-competition-command], [role="dialog"]';
const hasAddedCommand = (records: MutationRecord[]) =>
  records.some((record) =>
    Array.from(record.addedNodes).some(
      (node) =>
        node instanceof Element &&
        (node.matches(commandSelector) ||
          node.querySelector(commandSelector) !== null)
    )
  );

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
  const explicitConfiguration = Boolean(
    enabled &&
    isMultiCompetitionEnabled() &&
    wave &&
    !wave.chat.scope.group?.is_direct_message &&
    !isCompetitionPathname(pathname) &&
    search.get("tab") === "configuration" &&
    search.get("competition") &&
    !["drop", "entry", "serialNo", "curation", "editPost"].some((key) =>
      search.has(key)
    )
  );
  useEffect(() => {
    const competitionId = search.get("competition");
    if (!explicitConfiguration || !wave || !competitionId) return;
    const params = new URLSearchParams(search.toString());
    params.delete("competition");
    params.delete("wave");
    params.delete("default");
    params.set("tab", "rules");
    router.replace(`${getCompetitionRoute(wave.id, competitionId)}?${params}`, {
      scroll: false,
    });
  }, [explicitConfiguration, wave, search, router]);
  useEffect(() => {
    if (!resolve || !isCompetitionPathname(pathname)) return;
    let pinned = false;
    const pinOpenCommand = () => {
      if (pinned || !document.querySelector(commandSelector)) return false;
      pinned = true;
      const params = new URLSearchParams(search.toString());
      params.delete("default");
      const target = params.size ? `${pathname}?${params}` : pathname;
      router.replace(target, { scroll: false });
      return true;
    };
    const observer = new MutationObserver((records) => {
      if (!hasAddedCommand(records)) return;
      if (pinOpenCommand()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    if (pinOpenCommand()) observer.disconnect();
    return () => observer.disconnect();
  }, [resolve, pathname, search, router]);
  useEffect(() => {
    if (!resolve || !wave || selection.isError || !selection.isSuccess) return;
    if (document.querySelector(commandSelector)) return;
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
  return { selection, resolve: resolve || explicitConfiguration };
}
