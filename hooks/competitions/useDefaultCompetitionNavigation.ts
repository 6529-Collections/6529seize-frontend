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
  waveCompetitionTabs,
  getImplicitCompetitionRoute,
  shouldResolveDefault,
} from "@/helpers/default-competition.helpers";
import { useContentTab } from "@/components/brain/ContentTabContext";
import {
  hasWaveDestination,
  getHistoryWaveTab,
  getRememberedTab,
  rememberHistoryWaveTab,
  useWaveTabPreference,
} from "@/hooks/useWaveTabPreference";
import { MyStreamWaveTab } from "@/types/waves.types";
import {
  useCompetitionHub,
  useDefaultCompetition,
} from "./useCompetitionQueries";

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
  const { tabs } = useWaveTabPreference();
  const { availableTabs } = useContentTab();
  const remembered =
    getHistoryWaveTab(wave?.id) ?? (wave ? tabs[wave.id] : undefined);
  const savedTab = getRememberedTab(remembered);
  const ordinaryEntry =
    !isCompetitionPathname(pathname) && !hasWaveDestination(search);
  const restore = Boolean(
    enabled &&
    isMultiCompetitionEnabled() &&
    wave &&
    !wave.chat.scope.group?.is_direct_message &&
    ordinaryEntry &&
    savedTab !== undefined &&
    waveCompetitionTabs[savedTab] !== undefined
  );
  const selection = useDefaultCompetition(wave?.id ?? "", resolve || restore);
  // Old preferences had no competition identity. They can only name the
  // immutable legacy primary; new preferences always pin their selected ID.
  const legacyHub = useCompetitionHub(
    wave?.id ?? "",
    restore && typeof remembered === "string"
  );
  useEffect(() => {
    if (
      !restore ||
      !wave ||
      savedTab === undefined ||
      selection.isError ||
      !selection.isSuccess
    )
      return;
    if (typeof remembered === "string" && !legacyHub.isSuccess) return;
    const selectedId = selection.data.competition_id;
    const rememberedId =
      typeof remembered === "object"
        ? remembered.competitionId
        : legacyHub.data?.legacy_primary_competition_id;
    if (rememberedId === null || rememberedId === undefined) return;
    if (!selectedId || selectedId !== rememberedId) {
      rememberHistoryWaveTab(wave.id, MyStreamWaveTab.CHAT);
      return;
    }
    if (
      !(
        availableTabs.includes(savedTab) ||
        (savedTab === MyStreamWaveTab.LEADERBOARD &&
          availableTabs.includes(MyStreamWaveTab.SUBMISSIONS))
      ) ||
      document.querySelector(commandSelector)
    )
      return;
    const params = new URLSearchParams(search.toString());
    params.delete("wave");
    params.delete("default");
    params.set("tab", waveCompetitionTabs[savedTab]!);
    // Keep a command opened during a pending route transition in its original
    // visit. Once the destination commits this effect's observer is removed.
    const current = search.toString() ? `${pathname}?${search}` : pathname;
    const observer = new MutationObserver((records) => {
      if (!hasAddedCommand(records)) return;
      // The browser URL commits before passive-effect cleanup. Commands from
      // the committed destination must not cancel its legitimate navigation.
      if (
        window.location.pathname !== pathname ||
        new URLSearchParams(window.location.search).toString() !==
          search.toString()
      ) {
        observer.disconnect();
        return;
      }
      rememberHistoryWaveTab(wave.id, MyStreamWaveTab.CHAT);
      router.replace(current, { scroll: false });
      observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    router.replace(`${getCompetitionRoute(wave.id, selectedId)}?${params}`, {
      scroll: false,
    });
    return () => observer.disconnect();
  }, [
    restore,
    wave,
    savedTab,
    selection.isSuccess,
    selection.isError,
    selection.data,
    remembered,
    legacyHub.isSuccess,
    legacyHub.data,
    availableTabs,
    pathname,
    search,
    router,
  ]);
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
