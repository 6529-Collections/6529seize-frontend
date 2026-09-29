import type { ApiDropCompetitionContext } from "@/generated/models/ApiDropCompetitionContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { ApiCompetitionComputedPhase } from "@/generated/models/ApiCompetitionComputedPhase";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiCompetitionPage } from "@/generated/models/ApiCompetitionPage";
import type { ApiCompetitionEntryPage } from "@/generated/models/ApiCompetitionEntryPage";
import type { ApiCompetitionLeaderboardPage } from "@/generated/models/ApiCompetitionLeaderboardPage";
import type { ApiCompetitionDecisionPage } from "@/generated/models/ApiCompetitionDecisionPage";
import type { ApiCompetitionOutcomePage } from "@/generated/models/ApiCompetitionOutcomePage";
import type { ApiCompetitionVoterPage } from "@/generated/models/ApiCompetitionVoterPage";
import type { ApiCompetitionPausePage } from "@/generated/models/ApiCompetitionPausePage";
import type { ApiCompetitionDistributionItemPage } from "@/generated/models/ApiCompetitionDistributionItemPage";
import type { ApiCompetitionConfigVersionPage } from "@/generated/models/ApiCompetitionConfigVersionPage";
import type { ApiWaveV3 } from "@/generated/models/ApiWaveV3";
import type { ApiCompetitionMyVotePage } from "@/generated/models/ApiCompetitionMyVotePage";
import type { ApiCompetitionAwardPage } from "@/generated/models/ApiCompetitionAwardPage";
import type { ApiCompetitionCreditBudget } from "@/generated/models/ApiCompetitionCreditBudget";
import type { ApiCompetitionEntry } from "@/generated/models/ApiCompetitionEntry";
import type { ApiCreateCompetitionRequest } from "@/generated/models/ApiCreateCompetitionRequest";
import type { ApiUpdateCompetitionRequest } from "@/generated/models/ApiUpdateCompetitionRequest";
import type { ApiCompetitionActionRequest } from "@/generated/models/ApiCompetitionActionRequest";
import type { ApiCreateCompetitionEntryRequest } from "@/generated/models/ApiCreateCompetitionEntryRequest";
import type { ApiSetCompetitionVoteRequest } from "@/generated/models/ApiSetCompetitionVoteRequest";
import {
  commonApiFetch,
  commonApiPatch,
  commonApiPost,
  commonApiPut,
} from "@/services/api/common-api";
import type { QueryClient } from "@tanstack/react-query";

export interface CompetitionIdentity {
  readonly waveId: string;
  readonly competitionId: string;
}
export const competitionEndpoint = ({
  waveId,
  competitionId,
}: CompetitionIdentity) =>
  `v3/waves/${encodeURIComponent(waveId)}/competitions/${encodeURIComponent(competitionId)}`;
export const competitionScope = ({
  waveId,
  competitionId,
}: CompetitionIdentity) => ({ wave_id: waveId, competition_id: competitionId });
export const competitionQueryKey = (
  identity: CompetitionIdentity,
  viewer: string | null
) => [QueryKey.COMPETITION, { ...competitionScope(identity), viewer }] as const;

export async function fetchDropCompetitionContext(
  waveId: string,
  dropId: string,
  signal?: AbortSignal
) {
  const context = await commonApiFetch<ApiDropCompetitionContext>({
    endpoint: `v3/waves/${encodeURIComponent(waveId)}/drops/${encodeURIComponent(dropId)}/competition-context`,
    signal,
    errorMode: "structured",
  });
  if (context.competition === null && context.entry === null) return context;
  if (
    !context.competition ||
    !context.entry ||
    context.competition.wave_id !== waveId ||
    context.entry.wave_id !== waveId ||
    context.entry.drop_id !== dropId ||
    context.entry.competition_id !== context.competition.id
  ) {
    throw new Error("Invalid drop competition context");
  }
  return context;
}

export async function fetchCompetitionHub(
  waveId: string,
  signal?: AbortSignal
) {
  const hub = await commonApiFetch<ApiWaveV3>({
    endpoint: `v3/waves/${encodeURIComponent(waveId)}`,
    signal,
    errorMode: "structured",
  });
  if (hub.id !== waveId) throw new Error("Invalid competition parent");
  return hub;
}

export async function fetchCompetition(
  identity: CompetitionIdentity,
  signal?: AbortSignal
) {
  const competition = await commonApiFetch<ApiCompetition>({
    endpoint: competitionEndpoint(identity),
    signal,
    errorMode: "structured",
  });
  if (
    competition.wave_id !== identity.waveId ||
    competition.id !== identity.competitionId
  ) {
    throw new Error("Invalid competition parent");
  }
  return competition;
}

export type CompetitionCollectionFilter =
  | "active"
  | "history"
  | "drafts"
  | "all";
const collectionPhases: Record<
  CompetitionCollectionFilter,
  ApiCompetitionComputedPhase[]
> = {
  active: [
    ApiCompetitionComputedPhase.Upcoming,
    ApiCompetitionComputedPhase.ParticipationOpen,
    ApiCompetitionComputedPhase.VotingOpen,
    ApiCompetitionComputedPhase.Deciding,
  ],
  history: [
    ApiCompetitionComputedPhase.Completed,
    ApiCompetitionComputedPhase.Cancelled,
    ApiCompetitionComputedPhase.Archived,
  ],
  drafts: [ApiCompetitionComputedPhase.Draft],
  all: [],
};
export async function fetchCompetitions(
  waveId: string,
  cursor: string | null,
  signal?: AbortSignal,
  filter: CompetitionCollectionFilter = "all"
) {
  // This endpoint uses repeated OpenAPI array parameters; commonApiFetch's
  // scalar params serializer cannot encode them.
  const query = new URLSearchParams({ limit: "50" });
  if (cursor) query.set("cursor", cursor);
  for (const phase of collectionPhases[filter]) query.append("phase", phase);
  const page = await commonApiFetch<ApiCompetitionPage>({
    endpoint: `v3/waves/${encodeURIComponent(waveId)}/competitions?${query.toString()}`,
    signal,
    errorMode: "structured",
  });
  if (page.data.some((competition) => competition.wave_id !== waveId))
    throw new Error("Invalid competition parent");
  return page;
}

export interface CompetitionResourcePages {
  entries: ApiCompetitionEntryPage;
  leaderboard: ApiCompetitionLeaderboardPage;
  winners: ApiCompetitionEntryPage;
  decisions: ApiCompetitionDecisionPage;
  outcomes: ApiCompetitionOutcomePage;
  voters: ApiCompetitionVoterPage;
  pauses: ApiCompetitionPausePage;
  versions: ApiCompetitionConfigVersionPage;
  "votes/me": ApiCompetitionMyVotePage;
  awards: ApiCompetitionAwardPage;
}
export const fetchCompetitionResource = <
  K extends keyof CompetitionResourcePages,
>(
  identity: CompetitionIdentity,
  resource: K,
  params: Record<string, string>,
  signal?: AbortSignal
) =>
  commonApiFetch<CompetitionResourcePages[K]>({
    endpoint: `${competitionEndpoint(identity)}/${resource}`,
    params,
    signal,
    errorMode: "structured",
  });

/** Resolve an active pause independently of the visible history page. */
export async function fetchCompetitionPauseState(
  identity: CompetitionIdentity,
  signal?: AbortSignal
) {
  const now = Date.now();
  const seen = new Set<string>();
  let cursor: string | null = null;
  for (let pageNo = 0; pageNo < 100; pageNo++) {
    const page: ApiCompetitionPausePage = await fetchCompetitionResource(
      identity,
      "pauses",
      {
        limit: "100",
        direction: "DESC",
        ...(cursor ? { cursor } : {}),
      },
      signal
    );
    if (
      page.data.some(
        (pause) =>
          pause.start_time <= now &&
          (pause.end_time === null || pause.end_time >= now)
      )
    )
      return true;
    if (!page.has_more) return false;
    if (!page.next_cursor || seen.has(page.next_cursor))
      throw new Error("Invalid pause history cursor");
    cursor = page.next_cursor;
    seen.add(cursor);
  }
  throw new Error("Pause history could not be resolved");
}

export const fetchCompetitionDistribution = (
  identity: CompetitionIdentity,
  outcomeId: string,
  cursor: string | null,
  signal?: AbortSignal
) =>
  commonApiFetch<ApiCompetitionDistributionItemPage>({
    endpoint: `${competitionEndpoint(identity)}/outcomes/${encodeURIComponent(outcomeId)}/distribution`,
    params: { limit: "50", ...(cursor ? { cursor } : {}) },
    signal,
    errorMode: "structured",
  });

export const fetchCompetitionCredits = (
  identity: CompetitionIdentity,
  entryId?: string,
  signal?: AbortSignal
) =>
  commonApiFetch<ApiCompetitionCreditBudget>({
    endpoint: `${competitionEndpoint(identity)}/credits/me`,
    params: entryId ? { entry_id: entryId } : {},
    signal,
    errorMode: "structured",
  });
export const createCompetition = (
  waveId: string,
  body: ApiCreateCompetitionRequest
) =>
  commonApiPost<ApiCreateCompetitionRequest, ApiCompetition>({
    endpoint: `v3/waves/${encodeURIComponent(waveId)}/competitions`,
    body,
    errorMode: "structured",
  });
export const updateCompetition = (
  identity: CompetitionIdentity,
  body: ApiUpdateCompetitionRequest
) =>
  commonApiPatch<ApiUpdateCompetitionRequest, ApiCompetition>({
    endpoint: competitionEndpoint(identity),
    body,
    errorMode: "structured",
  });
export type CompetitionAction =
  | "publish"
  | "pause"
  | "resume"
  | "archive"
  | "clone";
export const performCompetitionAction = (
  identity: CompetitionIdentity,
  action: CompetitionAction,
  body: ApiCompetitionActionRequest
) =>
  commonApiPost<ApiCompetitionActionRequest, ApiCompetition>({
    endpoint: `${competitionEndpoint(identity)}/actions/${action}`,
    body,
    errorMode: "structured",
  });
export const createCompetitionEntry = (
  identity: CompetitionIdentity,
  body: ApiCreateCompetitionEntryRequest
) =>
  commonApiPost<ApiCreateCompetitionEntryRequest, ApiCompetitionEntry>({
    endpoint: `${competitionEndpoint(identity)}/entries`,
    body,
    errorMode: "structured",
  });
export const setCompetitionVote = (
  identity: CompetitionIdentity,
  entryId: string,
  body: ApiSetCompetitionVoteRequest
) =>
  commonApiPut<ApiSetCompetitionVoteRequest, ApiCompetitionCreditBudget>({
    endpoint: `${competitionEndpoint(identity)}/entries/${encodeURIComponent(entryId)}/votes/me`,
    body,
    errorMode: "structured",
  });
export async function invalidateCompetition(
  client: QueryClient,
  identity: CompetitionIdentity
) {
  await invalidateCompetitionScope(
    client,
    identity.waveId,
    competitionScope(identity)
  );
}

export async function invalidateCompetitionWave(
  client: QueryClient,
  waveId: string
) {
  await invalidateCompetitionScope(client, waveId, { wave_id: waveId });
}

async function invalidateCompetitionScope(
  client: QueryClient,
  waveId: string,
  scope: { wave_id: string; competition_id?: string }
) {
  await Promise.all([
    client.invalidateQueries({
      queryKey: [QueryKey.COMPETITION_DROP_CONTEXT, { wave_id: waveId }],
    }),
    client.invalidateQueries({
      queryKey: [QueryKey.COMPETITION, scope],
    }),
    client.invalidateQueries({
      queryKey: [QueryKey.COMPETITION_RESOURCE, scope],
    }),
    client.invalidateQueries({
      queryKey: [QueryKey.COMPETITION_CREDITS, scope],
    }),
    client.invalidateQueries({ queryKey: [QueryKey.DROP_VOTERS] }),
    client.invalidateQueries({ queryKey: [QueryKey.DROP_VOTE_LOGS] }),
    client.invalidateQueries({
      queryKey: [QueryKey.COMPETITIONS, { wave_id: waveId }],
    }),
    client.invalidateQueries({
      queryKey: [QueryKey.COMPETITION_HUB, { wave_id: waveId }],
    }),
  ]);
}
