"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getVoteRationaleReplyMarkdown } from "@/helpers/waves/vote-rationale.helpers";
import { useSingleWaveDropVoteRationale } from "@/components/waves/drop/useSingleWaveDropVoteRationale";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { VoteRationaleControl } from "@/components/voting/VoteRationaleControl";
import { SingleWaveDropVoteSize } from "@/components/waves/drop/SingleWaveDropVote.types";
import {
  CompetitionVoteForm,
  useCompetitionVoteBudget,
} from "./CompetitionVote";

export default function CompetitionVoteWithReply({
  drop,
  ...props
}: ComponentProps<typeof CompetitionVoteForm> & { readonly drop: ApiDrop }) {
  const locale = useBrowserLocale();
  const credit = useCompetitionVoteBudget(props.competition, props.entryId);
  const [draft, setDraft] = useState<string | null>(null);
  const previous = credit.data?.current_vote ?? 0;
  const value = draft ?? String(previous);
  const numeric = Number(value);
  const total = Number.isSafeInteger(numeric) ? numeric : previous;
  const rationale = useSingleWaveDropVoteRationale({
    drop,
    voteTotal: total,
    voteChange: total - previous,
  });
  const invalid =
    rationale.shouldPostRationale && !rationale.rationaleText.trim();
  const renderContent = (action: ReactNode) => (
    <VoteRationaleControl
      checked={rationale.shouldPostRationale}
      onCheckedChange={rationale.handlePostRationaleChange}
      value={rationale.isUsingGeneratedRationale ? "" : rationale.rationaleText}
      placeholder={getVoteRationaleReplyMarkdown({
        voteTotal: total,
        voteChange: total - previous,
        locale,
      }).trimEnd()}
      onChange={rationale.handleRationaleTextChange}
      generated={rationale.isUsingGeneratedRationale}
      invalid={invalid}
      variant={
        props.size === SingleWaveDropVoteSize.MINI ? "compact" : "default"
      }
      resizeWithContainer
      action={action}
    />
  );
  return (
    <CompetitionVoteForm
      {...props}
      controlledDraft={{ value, onChange: setDraft }}
      reply={{
        renderContent,
        isValid: !invalid,
        onVoteApplied: () => rationale.submitRationaleReply(drop),
      }}
    />
  );
}
