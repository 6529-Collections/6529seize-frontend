"use client";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";

import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";

import PrivilegedDropCreator, {
  DropMode,
} from "@/components/waves/PrivilegedDropCreator";
import { ActiveDropAction } from "@/types/dropInteractionTypes";
import { getVoteRationaleReplyMarkdown } from "@/helpers/waves/vote-rationale.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useCompetitionSignatureFor } from "@/hooks/competitions/useCompetitionSignature";
import {
  competitionScope,
  fetchCompetitionCredits,
  setCompetitionVote,
  invalidateCompetition,
} from "@/services/api/competitions-api";
import {
  isRejectedCompetitionCommand,
  isCompetitionAccessError,
  newCompetitionRequestKey,
} from "@/helpers/competition.helpers";
import type { ApiSetCompetitionVoteRequest } from "@/generated/models/ApiSetCompetitionVoteRequest";
import MyStreamWaveMyVotesReset from "@/components/brain/my-stream/votes/MyStreamWaveMyVotesReset";
import { useCompetition } from "@/contexts/CompetitionContext";
import {
  useCompetitionResource,
  useCompetitionViewer,
} from "@/hooks/competitions/useCompetitionQueries";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";
import { useCompetitionDropNavigation } from "@/hooks/competitions/useCompetitionDropNavigation";
import MyStreamWaveMyVote from "@/components/brain/my-stream/votes/MyStreamWaveMyVote";
import { CompetitionVoteForm } from "./CompetitionVote";
import { CompetitionState, COMPETITION_BUTTON } from "./CompetitionState";
import { CompetitionLoadMore } from "./CompetitionLoadMore";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useInView } from "@/hooks/useInView";
import { formatInteger } from "@/i18n/format";
import type { ApiCompetitionMyVote } from "@/generated/models/ApiCompetitionMyVote";

function VisibleVoteInput(props: ComponentProps<typeof CompetitionVoteForm>) {
  const [ref, visible] = useInView<HTMLDivElement>({ rootMargin: "200px 0px" });
  return (
    <CompetitionVoteForm
      {...props}
      budgetEnabled={visible}
      budgetVisibilityRef={ref}
    />
  );
}

function UnavailableVote({
  vote,
  retry,
  disabled,
}: {
  readonly vote: ApiCompetitionMyVote;
  readonly retry: () => void;
  readonly disabled: boolean;
}) {
  const { competition } = useCompetition();
  const locale = useBrowserLocale();
  const [ref, visible] = useInView<HTMLElement>({ rootMargin: "200px 0px" });
  return (
    <article
      ref={ref}
      aria-label={`${t(locale, "competitions.voteValue")}: ${formatInteger(locale, vote.value)}`}
      className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-p-4"
    >
      <p className="tw-text-sm tw-text-iron-400">
        {t(locale, "drop.media.previewUnavailable")}
      </p>
      <p className="tw-text-sm tw-text-iron-200">
        {t(locale, "competitions.voteValue")}:{" "}
        {formatInteger(locale, vote.value)}
      </p>
      <button
        type="button"
        className={`${COMPETITION_BUTTON} tw-mb-3`}
        onClick={retry}
      >
        {t(locale, "competitions.retry")}
      </button>
      <CompetitionVoteForm
        competition={competition}
        entryId={vote.entry_id}
        dropId={vote.drop_id}
        disabled={disabled}
        budgetEnabled={visible}
      />
    </article>
  );
}

function MyVotesLoadMore({
  query,
  paused,
}: {
  readonly query: ReturnType<typeof useCompetitionResource<"votes/me">>;
  readonly paused: boolean;
}) {
  const [ref, visible] = useInView<HTMLDivElement>({
    freezeOnceVisible: false,
    rootMargin: "200px 0px",
  });
  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } =
    query;
  useEffect(() => {
    if (
      visible &&
      hasNextPage &&
      !isFetching &&
      !isFetchNextPageError &&
      !paused
    )
      void fetchNextPage({ cancelRefetch: false });
  }, [
    visible,
    hasNextPage,
    isFetching,
    isFetchNextPageError,
    fetchNextPage,
    paused,
  ]);
  return (
    <div ref={ref}>
      <CompetitionLoadMore
        query={{
          hasNextPage,
          isFetchingNextPage: isFetching,
          fetchNextPage: () => fetchNextPage({ cancelRefetch: false }),
        }}
      />
    </div>
  );
}

export default function CompetitionMyVotes() {
  const { competition, wave } = useCompetition();
  const viewer = useCompetitionViewer();
  const locale = useBrowserLocale();
  const [rationale, setRationale] = useState<{
    drop: ExtendedDrop;
    partId: number;
    markdown: string;
    key: number;
  } | null>(null);
  const rationaleSequence = useRef(0);
  const rationaleTrigger = useRef<HTMLElement | null>(null);
  const closeRationale = () => {
    setRationale(null);
    rationaleTrigger.current?.focus();
  };
  const explainVote = (drop: ExtendedDrop, total: number, change: number) => {
    const partId = drop.parts.at(0)?.part_id;
    if (partId === undefined) return;
    rationaleTrigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    rationaleSequence.current += 1;
    setRationale({
      drop,
      partId,
      markdown: getVoteRationaleReplyMarkdown({
        voteTotal: total,
        voteChange: change,
        locale,
      }),
      key: rationaleSequence.current,
    });
  };
  const query = useCompetitionResource(
    { waveId: competition.wave_id, competitionId: competition.id },
    "votes/me",
    { include: "cards" },
    !!viewer
  );
  const votes = useMemo(
    () =>
      (query.data?.pages.flatMap((page) => page.data) ?? []).filter(
        (vote) => vote.entry_status === ApiCompetitionEntryStatus.Active
      ),
    [query.data]
  );
  const cards = useMemo(
    () => ({
      contexts: query.data?.pages.flatMap((page) => page.cards ?? []) ?? [],
      updatedAt: query.dataUpdatedAt,
    }),
    [query.data, query.dataUpdatedAt]
  );
  const drops = useCompetitionEntryDrops(
    votes.map((vote) => ({ entryId: vote.entry_id, dropId: vote.drop_id })),
    cards
  );
  const onDropClick = useCompetitionDropNavigation();
  const identity = {
    waveId: competition.wave_id,
    competitionId: competition.id,
  };
  const credits = useQuery({
    queryKey: [
      QueryKey.COMPETITION_CREDITS,
      { ...competitionScope(identity), viewer },
    ],
    queryFn: ({ signal }) =>
      fetchCompetitionCredits(identity, undefined, signal),
    enabled: !!viewer,
    retry: false,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [resetting, setResetting] = useState(false);
  const client = useQueryClient();
  const { requestAuth } = useAuth();
  const sign = useCompetitionSignatureFor(competition);
  const pendingResets = useRef(new Map<string, ApiSetCompetitionVoteRequest>());
  const selectable = votes.filter(
    (vote) => vote.entry_status === ApiCompetitionEntryStatus.Active
  );
  const allSelected =
    selectable.length > 0 &&
    selectable.every((vote) => selected.has(vote.drop_id));
  const resetVote = async (dropId: string) => {
    const vote = votes.find((item) => item.drop_id === dropId);
    if (
      vote?.entry_status !== ApiCompetitionEntryStatus.Active ||
      !competition.permissions.vote
    )
      throw new Error("Vote cannot be reset");
    if (!viewer || !(await requestAuth()).success)
      throw new Error("Authentication required");
    const key = `${viewer}:${competition.config_version}:${vote.entry_id}`;
    let body = pendingResets.current.get(key);
    if (!body) {
      body = {
        idempotency_key: newCompetitionRequestKey(),
        config_version: competition.config_version,
        value: 0,
      };
      if (competition.voting.signature_required)
        body.signature = await sign(
          "VOTE_SET",
          { value: 0 },
          vote.entry_id,
          dropId
        );
      pendingResets.current.set(key, body);
    }
    try {
      await setCompetitionVote(identity, vote.entry_id, body);
      pendingResets.current.delete(key);
      await invalidateCompetition(client, identity);
    } catch (error) {
      if (isRejectedCompetitionCommand(error))
        pendingResets.current.delete(key);
      throw error;
    }
  };

  if (!viewer)
    return (
      <p className="tw-p-4 tw-text-sm tw-italic tw-text-iron-500">
        {t(locale, "competitions.signIn")}
      </p>
    );
  if (query.isPending) return <CompetitionState />;
  if (query.isError && (!query.data || isCompetitionAccessError(query.error)))
    return <CompetitionState error retry={() => void query.refetch()} />;
  const loadingDrops = drops.some(
    (result) => result.isPending && result.isFetching
  );
  return (
    <div>
      <MyStreamWaveMyVotesReset
        waveId={competition.wave_id}
        haveDrops={selectable.length > 0}
        selected={selected}
        allItemsSelected={allSelected}
        availableVotes={
          competition.voting.credit_scope === "WAVE"
            ? (credits.data?.remaining ?? null)
            : null
        }
        isVotingClosed={!competition.permissions.vote}
        resetVote={resetVote}
        onResettingChange={setResetting}
        onToggleSelectAll={() =>
          setSelected(
            allSelected
              ? new Set()
              : new Set(selectable.map((vote) => vote.drop_id))
          )
        }
        removeSelected={(dropId) =>
          setSelected((current) => {
            const next = new Set(current);
            next.delete(dropId);
            return next;
          })
        }
      />
      {!votes.length && (
        <p className="tw-px-2 tw-py-10 tw-text-left tw-text-sm tw-italic tw-text-iron-500 sm:tw-px-4">
          {t(locale, "waves.myVotes.empty")}
        </p>
      )}
      {drops.map((result, index) => {
        const vote = votes[index]!;
        if (result.isPending && result.isFetching) return null;
        if (
          !result.data ||
          (result.isError && isCompetitionAccessError(result.error))
        )
          return (
            <UnavailableVote
              key={vote.entry_id}
              vote={vote}
              disabled={!competition.permissions.vote || resetting}
              retry={() => {
                void result.refetch();
                void query.refetch();
              }}
            />
          );
        const entryDrop = result.data.drop;
        const isClosed =
          !competition.permissions.vote ||
          result.data.entry.status !== ApiCompetitionEntryStatus.Active;
        return (
          <div
            key={vote.entry_id}
            className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800"
          >
            <MyStreamWaveMyVote
              drop={result.data.drop}
              isResetting={resetting}
              isChecked={selected.has(vote.drop_id)}
              onToggleCheck={(dropId) =>
                setSelected((current) => {
                  const next = new Set(current);
                  if (next.has(dropId)) next.delete(dropId);
                  else next.add(dropId);
                  return next;
                })
              }
              onDropClick={onDropClick}
              isVotingClosed={isClosed}
              winningThreshold={
                competition.type === ApiCompetitionType.Approve
                  ? competition.winners.winning_min_threshold
                  : null
              }
              voteInput={
                <VisibleVoteInput
                  competition={competition}
                  entryId={vote.entry_id}
                  dropId={vote.drop_id}
                  disabled={isClosed || resetting}
                  compact
                  onExplainVote={
                    entryDrop.parts.at(0)?.part_id === undefined
                      ? undefined
                      : (total, change) => explainVote(entryDrop, total, change)
                  }
                />
              }
            />
            {rationale?.drop.id === vote.drop_id && (
              <div className="tw-mx-2 tw-mb-6 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/30 tw-bg-iron-950 tw-px-4 tw-py-3 sm:tw-mx-4">
                <PrivilegedDropCreator
                  activeDrop={{
                    action: ActiveDropAction.REPLY,
                    drop: rationale.drop,
                    partId: rationale.partId,
                  }}
                  onCancelReplyQuote={closeRationale}
                  onDropAddedToQueue={closeRationale}
                  wave={wave}
                  dropId={null}
                  fixedDropMode={DropMode.CHAT}
                  focusOnInitialActiveDrop
                  initialMarkdown={rationale.markdown}
                  initialMarkdownKey={`${rationale.drop.id}:${rationale.key}`}
                />
              </div>
            )}
          </div>
        );
      })}
      {loadingDrops && <CompetitionState />}
      <MyVotesLoadMore query={query} paused={resetting} />
    </div>
  );
}
