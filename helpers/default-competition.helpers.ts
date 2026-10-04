import {
  COMPETITION_TABS,
  getCompetitionRoute,
  getCompetitionIdFromPathname,
  isCompetitionPathname,
} from "@/helpers/competition.helpers";
import { getWavePathRoute } from "@/helpers/navigation.helpers";
import { MyStreamWaveTab } from "@/types/waves.types";

export const waveCompetitionTabs: Partial<Record<MyStreamWaveTab, string>> = {
  [MyStreamWaveTab.LEADERBOARD]: "leaderboard",
  [MyStreamWaveTab.SUBMISSIONS]: "leaderboard",
  [MyStreamWaveTab.WINNERS]: "decisions",
  [MyStreamWaveTab.OUTCOME]: "outcomes",
  [MyStreamWaveTab.MY_VOTES]: "votes",
  [MyStreamWaveTab.CONFIGURATION]: "rules",
};
const competitionTabNames: readonly string[] = COMPETITION_TABS;

export function getLegacyCompetitionTab(
  tab: string | null
): MyStreamWaveTab | undefined {
  return Object.entries(waveCompetitionTabs).find(
    ([, value]) => value === tab
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
  const competitionTab =
    waveTab === undefined ? undefined : waveCompetitionTabs[waveTab];
  if (competitionTab) params.set("tab", competitionTab);
  if (competitionId === null) {
    params.set("default", "1");
    params.set("tab", "chat");
    return `${getWavePathRoute(waveId)}?${params}`;
  }
  params.set("default", "1");
  return `${getCompetitionRoute(waveId, competitionId)}?${params}`;
}
