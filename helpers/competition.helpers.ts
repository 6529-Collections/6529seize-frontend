import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import { publicEnv } from "@/config/env";

export const isMultiCompetitionEnabled = () =>
  publicEnv.NEXT_PUBLIC_FEATURE_MULTI_COMPETITION === "true";

export const getCompetitionsRoute = (waveId: string) =>
  `/waves/${encodeURIComponent(waveId)}/competitions`;

export const getCompetitionRoute = (waveId: string, competitionId: string) =>
  `${getCompetitionsRoute(waveId)}/${encodeURIComponent(competitionId)}`;

export const isCompetitionPathname = (pathname: string | null) => {
  const segments = (pathname ?? "").split("/").filter(Boolean);
  return (
    (segments.length === 3 || segments.length === 4) &&
    segments[0] === "waves" &&
    segments[2] === "competitions"
  );
};

export const COMPETITION_TABS = [
  "leaderboard",
  "decisions",
  "outcomes",
  "votes",
  "voters",
  "rules",
] as const;
export type CompetitionTab = (typeof COMPETITION_TABS)[number];
export const getCompetitionTab = (tab: string | null): CompetitionTab =>
  COMPETITION_TABS.find((candidate) => candidate === tab) ?? "leaderboard";

export const newCompetitionRequestKey = () => globalThis.crypto.randomUUID();

export function isRejectedCompetitionCommand(error: unknown) {
  const status = getStructuredApiErrorStatus(error);
  return (
    status !== undefined &&
    status >= 400 &&
    status < 500 &&
    status !== 408 &&
    status !== 429
  );
}
