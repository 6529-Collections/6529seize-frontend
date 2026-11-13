import {
  COMPETITION_TABS,
  getCompetitionRoute,
  getCompetitionIdFromPathname,
  isCompetitionPathname,
} from "@/helpers/competition.helpers";
import {
  getWavePathRoute,
  getWaveIdFromPathname,
} from "@/helpers/navigation.helpers";
import { MyStreamWaveTab } from "@/types/waves.types";

export function getSharedWaveTabRoute(pathname: string, tab: MyStreamWaveTab) {
  const waveId = getWaveIdFromPathname(pathname);
  if (!waveId) return null;
  const params = new URLSearchParams({ tab: tab.toLowerCase() });
  const competitionId = getCompetitionIdFromPathname(pathname);
  if (competitionId) params.set("competition", competitionId);
  return `${getWavePathRoute(waveId)}?${params}`;
}

export const waveCompetitionTabs: Partial<Record<MyStreamWaveTab, string>> = {
  [MyStreamWaveTab.LEADERBOARD]: "leaderboard",
  [MyStreamWaveTab.SUBMISSIONS]: "leaderboard",
  [MyStreamWaveTab.WINNERS]: "decisions",
  [MyStreamWaveTab.MY_VOTES]: "votes",
  [MyStreamWaveTab.CONFIGURATION]: "rules",
};
const competitionTabNames: readonly string[] = COMPETITION_TABS;

export function getLegacyCompetitionTab(
  tab: string | null
): MyStreamWaveTab | undefined {
  let normalized = tab;
  if (tab === "voters") normalized = "votes";
  if (tab === "settings" || tab === "outcomes" || tab === "outcome")
    normalized = "rules";
  if (normalized === "rules") return MyStreamWaveTab.CONFIGURATION;
  return Object.entries(waveCompetitionTabs).find(
    ([, value]) => value === normalized
  )?.[0] as MyStreamWaveTab | undefined;
}

export function shouldResolveDefault(
  pathname: string,
  search: URLSearchParams
) {
  if (
    [
      "drop",
      "entry",
      "serialNo",
      "editPost",
      "curation",
      "competition",
      "edit",
    ].some((key) => search.has(key))
  )
    return false;
  if (isCompetitionPathname(pathname))
    return (
      getCompetitionIdFromPathname(pathname) !== null &&
      search.get("default") === "1"
    );
  // Resolving the competition supplies competition views, never the entry view.
  const tab = search.get("tab");
  return (
    tab !== null &&
    (competitionTabNames.includes(tab) ||
      tab === "voters" ||
      tab === "settings" ||
      tab === "outcomes" ||
      tab === "outcome" ||
      Object.keys(waveCompetitionTabs).some((key) => key.toLowerCase() === tab))
  );
}

export function getImplicitCompetitionRoute(
  waveId: string,
  competitionId: string | null,
  search: URLSearchParams
) {
  const params = new URLSearchParams(search);
  params.delete("wave");
  const waveTab = Object.values(MyStreamWaveTab).find(
    (tab) => tab.toLowerCase() === params.get("tab")
  );
  let competitionTab =
    waveTab === undefined ? undefined : waveCompetitionTabs[waveTab];
  if (waveTab === MyStreamWaveTab.OUTCOME || params.get("tab") === "outcomes")
    competitionTab = "rules";
  if (competitionTab) params.set("tab", competitionTab);
  if (competitionId === null) {
    params.set("default", "1");
    params.set("tab", "chat");
    return `${getWavePathRoute(waveId)}?${params}`;
  }
  params.set("default", "1");
  return `${getCompetitionRoute(waveId, competitionId)}?${params}`;
}
