"use client";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCompetition } from "@/contexts/CompetitionContext";
import {
  useCompetitionResource,
  useCompetitionViewer,
} from "@/hooks/competitions/useCompetitionQueries";
import {
  competitionEndpoint,
  competitionScope,
  fetchCompetitionDistribution,
  fetchCompetitionCredits,
  fetchCompetitionEntryVotes,
} from "@/services/api/competitions-api";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiCompetitionEntry } from "@/generated/models/ApiCompetitionEntry";
import type { ApiCompetitionOutcome } from "@/generated/models/ApiCompetitionOutcome";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatDate, formatInteger } from "@/i18n/format";
import type { CompetitionTab } from "@/helpers/competition.helpers";
import { CompetitionState, COMPETITION_BUTTON } from "./CompetitionState";
import CompetitionEntryCard from "./CompetitionEntryCard";
import CompetitionCredits from "./CompetitionCredits";
import CompetitionRules from "./CompetitionRules";

const useIdentity = () => {
  const { competition } = useCompetition();
  return { waveId: competition.wave_id, competitionId: competition.id };
};

function LoadMore({
  query,
}: {
  readonly query: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => unknown;
  };
}) {
  const locale = useBrowserLocale();
  return query.hasNextPage ? (
    <button
      type="button"
      className={COMPETITION_BUTTON}
      disabled={query.isFetchingNextPage}
      onClick={() => {
        void query.fetchNextPage();
      }}
    >
      {t(locale, "competitions.more")}
    </button>
  ) : null;
}

function EntryFocus({ entryId }: { readonly entryId: string }) {
  const identity = useIdentity();
  const viewer = useCompetitionViewer();
  const entry = useQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      "entry",
      entryId,
    ],
    queryFn: ({ signal }) =>
      commonApiFetch<ApiCompetitionEntry>({
        endpoint: `${competitionEndpoint(identity)}/entries/${encodeURIComponent(entryId)}`,
        signal,
        errorMode: "structured",
      }),
    retry: false,
  });
  if (entry.isPending) return <CompetitionState />;
  if (
    entry.isError ||
    entry.data.competition_id !== identity.competitionId ||
    entry.data.wave_id !== identity.waveId
  )
    return (
      <CompetitionState
        error
        retry={() => {
          void entry.refetch();
        }}
      />
    );
  return (
    <>
      <CompetitionEntryCard
        entryId={entry.data.id}
        dropId={entry.data.drop_id}
        entry={entry.data}
        rank={entry.data.rank}
        selected
      />
      <EntryVotes entryId={entryId} />
    </>
  );
}

function EntryVotes({ entryId }: { readonly entryId: string }) {
  const identity = useIdentity();
  const viewer = useCompetitionViewer();
  const locale = useBrowserLocale();
  const query = useInfiniteQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      "entry-votes",
      entryId,
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchCompetitionEntryVotes(identity, entryId, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => (page.has_more ? page.next_cursor : undefined),
    retry: false,
  });
  if (query.isPending) return <CompetitionState />;
  if (query.isError)
    return (
      <CompetitionState
        error
        retry={() => {
          void query.refetch();
        }}
      />
    );
  return (
    <section className="tw-mt-4 tw-space-y-3">
      <h3 className="tw-text-base tw-font-semibold tw-text-iron-100">
        {t(locale, "competitions.voters")}
      </h3>
      <ul className="tw-space-y-2 tw-break-all tw-text-sm tw-text-iron-300">
        {query.data.pages
          .flatMap((page) => page.data)
          .map((vote) => (
            <li key={vote.id}>
              {vote.voter_profile_id} ·{" "}
              {t(locale, "competitions.total", {
                value: formatInteger(locale, vote.value),
              })}
            </li>
          ))}
      </ul>
      <LoadMore query={query} />
    </section>
  );
}

function Entries() {
  const identity = useIdentity();
  const query = useCompetitionResource(identity, "entries");
  if (query.isPending) return <CompetitionState />;
  if (query.isError)
    return (
      <CompetitionState
        error
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const entries = query.data.pages.flatMap((page) => page.data);
  return (
    <div className="tw-space-y-4">
      {entries.length === 0 && <CompetitionState empty />}
      {entries.map((entry) => (
        <CompetitionEntryCard
          key={entry.id}
          entryId={entry.id}
          dropId={entry.drop_id}
          entry={entry}
          rank={entry.rank}
        />
      ))}
      <LoadMore query={query} />
    </div>
  );
}

function Leaderboard() {
  const identity = useIdentity();
  const query = useCompetitionResource(identity, "leaderboard");
  if (query.isPending) return <CompetitionState />;
  if (query.isError)
    return (
      <CompetitionState
        error
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const entries = query.data.pages.flatMap((page) => page.data);
  return (
    <div className="tw-space-y-4">
      {entries.length === 0 && <CompetitionState empty />}
      {entries.map((entry) => (
        <CompetitionEntryCard
          key={entry.entry_id}
          entryId={entry.entry_id}
          dropId={entry.drop_id}
          rating={entry.rating}
          rank={entry.rank}
        />
      ))}
      <LoadMore query={query} />
    </div>
  );
}

function MyVotes() {
  const identity = useIdentity();
  const viewer = useCompetitionViewer();
  const locale = useBrowserLocale();
  const query = useCompetitionResource(
    identity,
    "votes/me",
    {},
    Boolean(viewer)
  );
  const credits = useQuery({
    queryKey: [
      QueryKey.COMPETITION_CREDITS,
      { ...competitionScope(identity), viewer },
    ],
    queryFn: ({ signal }) =>
      fetchCompetitionCredits(identity, undefined, signal),
    enabled: Boolean(viewer),
    retry: false,
  });
  if (!viewer)
    return (
      <p className="tw-text-iron-400">{t(locale, "competitions.signIn")}</p>
    );
  if (query.isPending || credits.isPending) return <CompetitionState />;
  if (query.isError || credits.isError)
    return (
      <CompetitionState
        error
        retry={() => {
          void query.refetch();
          void credits.refetch();
        }}
      />
    );
  const votes = query.data.pages.flatMap((page) => page.data);
  return (
    <div className="tw-space-y-4">
      <CompetitionCredits budget={credits.data} />
      {votes.length === 0 && <CompetitionState empty />}
      {votes.map((vote) => (
        <CompetitionEntryCard
          key={vote.entry_id}
          entryId={vote.entry_id}
          dropId={vote.drop_id}
          rating={vote.value}
          disabled={vote.entry_status !== ApiCompetitionEntryStatus.Active}
          selected
        />
      ))}
      <LoadMore query={query} />
    </div>
  );
}

function Winners() {
  const identity = useIdentity();
  const locale = useBrowserLocale();
  const winners = useCompetitionResource(identity, "winners");
  const decisions = useCompetitionResource(identity, "decisions");
  if (winners.isPending || decisions.isPending) return <CompetitionState />;
  if (winners.isError || decisions.isError)
    return (
      <CompetitionState
        error
        retry={() => {
          void winners.refetch();
          void decisions.refetch();
        }}
      />
    );
  const entries = winners.data.pages.flatMap((page) => page.data);
  return (
    <div className="tw-space-y-4">
      {entries.length === 0 && <CompetitionState empty />}
      {entries.map((entry) => (
        <CompetitionEntryCard
          key={entry.id}
          entryId={entry.id}
          dropId={entry.drop_id}
          entry={entry}
          rank={entry.rank}
          disabled
        />
      ))}
      <LoadMore query={winners} />
      <ol className="tw-space-y-2 tw-text-sm tw-text-iron-300">
        {decisions.data.pages
          .flatMap((page) => page.data)
          .map((decision) => (
            <li key={decision.id}>
              {formatDate(locale, decision.scheduled_at, {
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              · {t(locale, `competitions.decisionStatus.${decision.status}`)} ·{" "}
              {formatInteger(locale, decision.winners.length)}
            </li>
          ))}
      </ol>
      <LoadMore query={decisions} />
    </div>
  );
}

function Outcome({ outcome }: { readonly outcome: ApiCompetitionOutcome }) {
  const identity = useIdentity();
  const locale = useBrowserLocale();
  const viewer = useCompetitionViewer();
  const query = useInfiniteQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      "distribution",
      outcome.id,
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchCompetitionDistribution(identity, outcome.id, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => (page.has_more ? page.next_cursor : undefined),
  });
  let distribution = <CompetitionState />;
  if (query.isError)
    distribution = (
      <CompetitionState
        error
        retry={() => {
          void query.refetch();
        }}
      />
    );
  else if (query.data)
    distribution = (
      <ol className="tw-text-sm tw-text-iron-400">
        {query.data.pages
          .flatMap((page) => page.data)
          .map((item) => (
            <li key={item.id}>
              {item.description}{" "}
              {item.amount === null ? null : formatInteger(locale, item.amount)}
            </li>
          ))}
      </ol>
    );
  return (
    <section className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4">
      <h3 className="tw-text-base tw-text-iron-100">{outcome.description}</h3>
      <p className="tw-text-sm tw-text-iron-300">
        {outcome.type} {outcome.credit} {outcome.rep_category}{" "}
        {outcome.amount === null ? null : formatInteger(locale, outcome.amount)}
      </p>
      {distribution}
      <LoadMore query={query} />
    </section>
  );
}

function Outcomes() {
  const identity = useIdentity();
  const query = useCompetitionResource(identity, "outcomes");
  const awards = useCompetitionResource(identity, "awards");
  const locale = useBrowserLocale();
  if (query.isPending) return <CompetitionState />;
  if (query.isError)
    return (
      <CompetitionState
        error
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const outcomes = query.data.pages.flatMap((page) => page.data);
  return (
    <div className="tw-space-y-4">
      {outcomes.length === 0 && <CompetitionState empty />}
      {outcomes.map((outcome) => (
        <Outcome key={outcome.id} outcome={outcome} />
      ))}
      <LoadMore query={query} />
      {awards.isError ? (
        <CompetitionState
          error
          retry={() => {
            void awards.refetch();
          }}
        />
      ) : (
        awards.data?.pages
          .flatMap((page) => page.data)
          .map((award) => (
            <p className="tw-text-sm tw-text-iron-300" key={award.id}>
              {award.description} {award.credit}{" "}
              {award.amount === null ? "" : formatInteger(locale, award.amount)}
            </p>
          ))
      )}
      <LoadMore query={awards} />
    </div>
  );
}

function Voters() {
  const identity = useIdentity();
  const locale = useBrowserLocale();
  const query = useCompetitionResource(identity, "voters");
  if (query.isPending) return <CompetitionState />;
  if (query.isError)
    return (
      <CompetitionState
        error
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const voters = query.data.pages.flatMap((page) => page.data);
  return (
    <div className="tw-space-y-4">
      {voters.length === 0 ? (
        <CompetitionState empty />
      ) : (
        <ul className="tw-space-y-3 tw-pl-4 tw-text-sm tw-text-iron-300">
          {voters.map((voter) => (
            <li key={voter.profile_id}>
              {voter.profile_id} ·{" "}
              {t(locale, "competitions.total", {
                value: formatInteger(locale, voter.votes),
              })}{" "}
              · {t(locale, "competitions.spent")}:{" "}
              {formatInteger(locale, voter.credit_spent)}
            </li>
          ))}
        </ul>
      )}
      <LoadMore query={query} />
    </div>
  );
}

export default function CompetitionResources({
  tab,
}: {
  readonly tab: CompetitionTab;
}) {
  const search = useSearchParams();
  const entryId = search.get("entry");
  if (entryId) return <EntryFocus key={entryId} entryId={entryId} />;
  switch (tab) {
    case "entries":
      return <Entries />;
    case "leaderboard":
      return <Leaderboard />;
    case "votes":
      return <MyVotes />;
    case "decisions":
      return <Winners />;
    case "outcomes":
      return <Outcomes />;
    case "voters":
      return <Voters />;
    case "rules":
      return <CompetitionRules />;
  }
}
