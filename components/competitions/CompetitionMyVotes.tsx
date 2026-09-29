"use client";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";

import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";

import { useRef, useState } from "react";
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
  isMultiCompetitionEnabled,
  isRejectedCompetitionCommand,
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
import { CompetitionState } from "./CompetitionState";
import { CompetitionLoadMore } from "./CompetitionLoadMore";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
export default function CompetitionMyVotes() {
  const { competition } = useCompetition();
  const viewer = useCompetitionViewer();
  const locale = useBrowserLocale();
  const query = useCompetitionResource(
    { waveId: competition.wave_id, competitionId: competition.id },
    "votes/me",
    {},
    !!viewer
  );
  const votes = query.data?.pages.flatMap((page) => page.data) ?? [];
  const drops = useCompetitionEntryDrops(
    votes.map((vote) => ({ entryId: vote.entry_id, dropId: vote.drop_id }))
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
      !isMultiCompetitionEnabled() ||
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
      <p className="tw-p-4 tw-text-sm tw-text-iron-400">
        {t(locale, "competitions.signIn")}
      </p>
    );
  if (query.isPending) return <CompetitionState />;
  if (query.isError)
    return <CompetitionState error retry={() => void query.refetch()} />;
  return (
    <div>
      <MyStreamWaveMyVotesReset
        waveId={competition.wave_id}
        haveDrops={selectable.length > 0}
        selected={selected}
        allItemsSelected={allSelected}
        availableVotes={credits.data?.remaining ?? null}
        isVotingClosed={
          !isMultiCompetitionEnabled() || !competition.permissions.vote
        }
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
        <p className="tw-py-10 tw-text-center tw-text-sm tw-text-iron-500">
          {t(locale, "waves.myVotes.empty")}
        </p>
      )}
      {drops.map((result, index) => {
        const vote = votes[index]!;
        if (result.isPending) return <CompetitionState key={vote.entry_id} />;
        if (result.isError)
          return (
            <CompetitionState
              key={vote.entry_id}
              error
              retry={() => void result.refetch()}
            />
          );
        if (!result.data) return null;
        const isClosed =
          !isMultiCompetitionEnabled() ||
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
                <CompetitionVoteForm
                  competition={competition}
                  entryId={vote.entry_id}
                  dropId={vote.drop_id}
                  disabled={isClosed || resetting}
                  compact
                />
              }
            />
          </div>
        );
      })}
      <CompetitionLoadMore query={query} />
    </div>
  );
}
