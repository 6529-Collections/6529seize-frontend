import { getStructuredApiErrorStatus } from "@/services/api/common-api";

/** Users call competitions "decisions"; their routes use that name. */
const DECISIONS_PATH_SEGMENT = "decisions";
/**
 * The former route segment. `next.config` redirects it permanently, but a page
 * that was already open, or a history entry, can still carry it.
 */
const LEGACY_COMPETITIONS_PATH_SEGMENT = "competitions";

/** True for the decisions collection segment, in its current or legacy form. */
export const isCompetitionCollectionSegment = (segment: string | undefined) =>
  segment === DECISIONS_PATH_SEGMENT ||
  segment === LEGACY_COMPETITIONS_PATH_SEGMENT;

export const getCompetitionsRoute = (waveId: string) =>
  `/waves/${encodeURIComponent(waveId)}/${DECISIONS_PATH_SEGMENT}`;

export const getCompetitionRoute = (waveId: string, competitionId: string) =>
  `${getCompetitionsRoute(waveId)}/${encodeURIComponent(competitionId)}`;

export const getCompetitionDropRoute = (
  waveId: string,
  competitionId: string,
  dropId: string
) =>
  `${getCompetitionRoute(waveId, competitionId)}?drop=${encodeURIComponent(dropId)}`;

export const isCompetitionPathname = (pathname: string | null) => {
  const segments = (pathname ?? "").split("/").filter(Boolean);
  return (
    (segments.length === 3 || segments.length === 4) &&
    segments[0] === "waves" &&
    isCompetitionCollectionSegment(segments[2])
  );
};

export function getCompetitionIdFromPathname(
  pathname: string | null
): string | null {
  if (!isCompetitionPathname(pathname)) return null;
  const segments = (pathname ?? "").split("/").filter(Boolean);
  const competitionId = segments[3];
  return competitionId && competitionId !== "new" ? competitionId : null;
}

export const COMPETITION_TABS = [
  "leaderboard",
  "decisions",
  "outcomes",
  "votes",
  "rules",
] as const;
export type CompetitionTab = (typeof COMPETITION_TABS)[number];
export const getCompetitionTab = (tab: string | null): CompetitionTab => {
  if (tab === "voters") return "votes";
  if (tab === "settings") return "rules";
  return (
    COMPETITION_TABS.find((candidate) => candidate === tab) ?? "leaderboard"
  );
};

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

export function isCompetitionAccessError(error: unknown) {
  const status = getStructuredApiErrorStatus(error);
  return status === 401 || status === 403 || status === 404;
}
