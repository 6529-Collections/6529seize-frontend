"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { VoteModeControl } from "@/components/voting/VoteModeControl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  type SingleWaveDropVoteMode,
  SingleWaveDropVoteSize,
} from "@/components/waves/drop/SingleWaveDropVote.types";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import { fetchDropCompetitionContext } from "@/services/api/competitions-api";
import { isCompetitionAccessError } from "@/helpers/competition.helpers";
import { CompetitionVoteForm } from "./CompetitionVote";
import CompetitionVoteWithReply from "./CompetitionVoteWithReply";
import { CompetitionState } from "./CompetitionState";

// A later transient error must not restore data whose access was denied.
// Query identity keeps this boundary scoped to the viewer and drop across mounts.
const accessDeniedContexts = new WeakSet<object>();

interface CompetitionAwareDropVoteProps {
  readonly drop: ApiDrop & Pick<ExtendedDrop, "competition_context">;
  readonly fallback: ReactNode;
  readonly size?: SingleWaveDropVoteSize | undefined;
  readonly voteMode?: SingleWaveDropVoteMode | undefined;
  readonly onVoteSuccess?: (() => void) | undefined;
  readonly onVoteRequestStarted?: (() => void) | undefined;
}

function getKnownContext(
  drop: CompetitionAwareDropVoteProps["drop"],
  viewer: string | null
) {
  const known = drop.competition_context;
  if (
    known?.viewer !== viewer ||
    known.waveId !== drop.wave.id ||
    known.dropId !== drop.id
  )
    return undefined;
  const { competition, entry } = known.data;
  if (competition === null && entry === null) return known.data;
  if (
    !competition ||
    !entry ||
    competition.wave_id !== drop.wave.id ||
    entry.wave_id !== drop.wave.id ||
    entry.drop_id !== drop.id ||
    entry.competition_id !== competition.id
  )
    return undefined;
  return known.data;
}

export default function CompetitionAwareDropVote(
  props: CompetitionAwareDropVoteProps
) {
  const viewer = useCompetitionViewer();
  const queryClient = useQueryClient();
  const [localVoteMode, setLocalVoteMode] =
    useState<SingleWaveDropVoteMode>("slider");
  const { drop } = props;
  const knownContext = getKnownContext(drop, viewer);
  const contextQueryKey = [
    QueryKey.COMPETITION_DROP_CONTEXT,
    { wave_id: drop.wave.id, drop_id: drop.id, viewer },
  ] as const;
  const context = useQuery({
    queryKey: contextQueryKey,
    queryFn: async ({ signal, client, queryKey }) => {
      const query = client.getQueryCache().find({ queryKey, exact: true });
      try {
        const result = await fetchDropCompetitionContext(
          drop.wave.id,
          drop.id,
          signal
        );
        if (query) accessDeniedContexts.delete(query);
        return result;
      } catch (error) {
        if (query && isCompetitionAccessError(error)) {
          accessDeniedContexts.add(query);
        }
        throw error;
      }
    },
    enabled: knownContext === undefined,
    retry: false,
    staleTime: 0,
    // A fresh response can restore access even when cached data is unchanged.
    notifyOnChangeProps: ["data", "error", "isFetching"],
  });
  const cachedQuery = queryClient.getQueryCache().find({
    queryKey: contextQueryKey,
    exact: true,
  });
  const contextError = context.error;
  useLayoutEffect(() => {
    // Another observer can own requests for this same cached context.
    if (
      !knownContext &&
      cachedQuery?.state.error === contextError &&
      isCompetitionAccessError(contextError)
    ) {
      accessDeniedContexts.add(cachedQuery);
    }
  }, [cachedQuery, contextError, knownContext]);
  const accessDenied = cachedQuery && accessDeniedContexts.has(cachedQuery);
  if (
    !knownContext &&
    (accessDenied ||
      (context.isError &&
        (!context.data || isCompetitionAccessError(context.error))))
  )
    return (
      <CompetitionState
        error
        retry={() => {
          void context.refetch();
        }}
      />
    );
  const resolvedContext = knownContext ?? context.data;
  if (!resolvedContext) return <CompetitionState />;
  const { competition, entry } = resolvedContext;
  if (!competition || !entry) return props.fallback;
  const canReply =
    drop.wave.authenticated_user_eligible_to_chat === true &&
    drop.parts.at(0)?.part_id !== undefined;
  const VoteForm = canReply ? CompetitionVoteWithReply : CompetitionVoteForm;
  return (
    <VoteForm
      hidden={props.size === SingleWaveDropVoteSize.MINI && !viewer}
      modeControl={
        viewer && props.voteMode === undefined ? (
          <VoteModeControl value={localVoteMode} onChange={setLocalVoteMode} />
        ) : undefined
      }
      key={`${viewer ?? "anonymous"}:${entry.id}`}
      drop={drop}
      competition={competition}
      entryId={entry.id}
      dropId={entry.drop_id}
      disabled={entry.status !== ApiCompetitionEntryStatus.Active}
      voteMode={props.voteMode ?? localVoteMode}
      size={props.size}
      onVoteSuccess={() => {
        props.onVoteSuccess?.();
        props.onVoteRequestStarted?.();
      }}
    />
  );
}
