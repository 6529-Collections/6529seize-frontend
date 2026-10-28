"use client";

import { useState, type ReactNode } from "react";
import { VoteModeControl } from "@/components/voting/VoteModeControl";
import { useQuery } from "@tanstack/react-query";
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
import { CompetitionVoteForm } from "./CompetitionVote";
import CompetitionVoteWithReply from "./CompetitionVoteWithReply";
import { CompetitionState } from "./CompetitionState";

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
  const [localVoteMode, setLocalVoteMode] =
    useState<SingleWaveDropVoteMode>("slider");
  const { drop } = props;
  const knownContext = getKnownContext(drop, viewer);
  const context = useQuery({
    queryKey: [
      QueryKey.COMPETITION_DROP_CONTEXT,
      { wave_id: drop.wave.id, drop_id: drop.id, viewer },
    ],
    queryFn: ({ signal }) =>
      fetchDropCompetitionContext(drop.wave.id, drop.id, signal),
    enabled: knownContext === undefined,
    retry: false,
    staleTime: 0,
  });
  if (!knownContext && context.isError)
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
    <div
      hidden={props.size === SingleWaveDropVoteSize.MINI && !viewer}
      className={
        props.size === SingleWaveDropVoteSize.MINI
          ? "is-mini is-vote-panel tw-group/inline-vote tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-grid-rows-[auto_minmax(56px,auto)] tw-items-center tw-gap-x-3 tw-gap-y-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-@container/vote [&>fieldset>button]:tw-inline-flex [&>fieldset>button]:tw-min-h-6 [&>fieldset>button]:tw-items-center [&>fieldset>button]:tw-justify-center [&>fieldset>button]:tw-rounded-md [&>fieldset>button]:tw-text-xs [&>fieldset>button]:touch-only:tw-min-h-11 [&>fieldset]:tw-col-start-2 [&>fieldset]:tw-row-start-1 [&>fieldset]:tw-items-center [&>fieldset]:tw-self-center [&>fieldset]:tw-rounded-lg [&>fieldset]:tw-p-0.5 [&[hidden]]:tw-hidden"
          : "is-vote-panel tw-group/inline-vote tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-grid-rows-[auto_minmax(80px,auto)] tw-items-center tw-gap-x-3 tw-gap-y-2 tw-@container/vote group-has-[.is-vote-panel]/voting-dialog:tw-grid-cols-[minmax(0,1fr)_9rem] group-has-[.is-vote-panel]/voting-dialog:tw-grid-rows-[minmax(50px,auto)_minmax(80px,auto)] [&>fieldset]:tw-col-start-2 [&>fieldset]:tw-row-start-1 [&>fieldset]:tw-self-center"
      }
    >
      {viewer && props.voteMode === undefined && (
        <VoteModeControl value={localVoteMode} onChange={setLocalVoteMode} />
      )}
      <VoteForm
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
    </div>
  );
}
