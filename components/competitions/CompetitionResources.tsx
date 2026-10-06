"use client";
import { skipToken, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { competitionSubmissionReceiptKey } from "@/helpers/competition-submission.helpers";
import SubmissionConfirmation from "@/components/waves/leaderboard/SubmissionConfirmation";
import CompetitionMySubmissions from "./CompetitionMySubmissions";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useCompetitionDropNavigation } from "@/hooks/competitions/useCompetitionDropNavigation";
import { useSearchParams } from "next/navigation";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import {
  competitionEndpoint,
  competitionScope,
} from "@/services/api/competitions-api";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiCompetitionEntry } from "@/generated/models/ApiCompetitionEntry";
import type { CompetitionTab } from "@/helpers/competition.helpers";
import { CompetitionState } from "./CompetitionState";
import CompetitionEntryCard from "./CompetitionEntryCard";
import CompetitionLeaderboard from "./CompetitionLeaderboard";
import CompetitionMyVotes from "./CompetitionMyVotes";
import CompetitionWinners from "./CompetitionWinners";
import CompetitionOutcomes from "./CompetitionOutcomes";
import CompetitionVoters from "./CompetitionVoters";
import CompetitionRules from "./CompetitionRules";

const useIdentity = () => {
  const { competition } = useCompetition();
  return { waveId: competition.wave_id, competitionId: competition.id };
};

function EntryFocus({ entryId }: { readonly entryId: string }) {
  const { competition } = useCompetition();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const identity = useIdentity();
  const viewer = useCompetitionViewer();
  const navigateDrop = useCompetitionDropNavigation();
  const locale = useBrowserLocale();
  const receipt = useQuery<ApiCompetitionEntry>({
    queryKey: competitionSubmissionReceiptKey(identity, viewer, entryId),
    queryFn: skipToken,
    enabled: false,
  });
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
  const saved = entry.data ?? receipt.data;
  const isOwnEntry =
    !activeProfileProxy &&
    saved?.id === entryId &&
    saved.wave_id === identity.waveId &&
    saved.competition_id === identity.competitionId &&
    saved.submitter.id === connectedProfile?.id;
  const isAccepted =
    saved?.status === ApiCompetitionEntryStatus.Active ||
    saved?.status === ApiCompetitionEntryStatus.Winner;
  const confirmation = isOwnEntry && isAccepted && (
    <SubmissionConfirmation
      competitionName={competition.title}
      confirmed={!entry.isError && !entry.isPending}
      checking={entry.isFetching}
      onViewEntry={() => {
        navigateDrop({ id: saved.drop_id });
      }}
      onCheckAgain={() => {
        void entry.refetch();
      }}
    />
  );
  let content;
  if (entry.isPending) content = <CompetitionState />;
  else if (
    entry.isError ||
    entry.data.competition_id !== identity.competitionId ||
    entry.data.wave_id !== identity.waveId
  )
    content = (
      <CompetitionState
        error
        retry={() => {
          void entry.refetch();
        }}
      />
    );
  else
    content = (
      <CompetitionEntryCard
        entryId={entry.data.id}
        dropId={entry.data.drop_id}
      />
    );
  return (
    <div className="tw-space-y-4">
      <div className="tw-flex tw-flex-wrap tw-justify-end">
        <CompetitionMySubmissions />
      </div>
      {confirmation}
      {isOwnEntry && !isAccepted && (
        <output className="tw-block tw-text-sm tw-text-iron-300">
          {t(locale, `waves.submissions.entryStatus.${saved.status}`)}
        </output>
      )}
      {content}
    </div>
  );
}

export default function CompetitionResources({
  tab,
  onCreateDrop,
}: {
  readonly onCreateDrop?: (() => void) | undefined;
  readonly tab: CompetitionTab;
}) {
  const search = useSearchParams();
  const entryId = search.get("entry");
  if (entryId) return <EntryFocus key={entryId} entryId={entryId} />;
  switch (tab) {
    case "leaderboard":
      return <CompetitionLeaderboard onCreateDrop={onCreateDrop} />;
    case "votes":
      return <CompetitionMyVotes />;
    case "decisions":
      return <CompetitionWinners />;
    case "outcomes":
      return <CompetitionOutcomes />;
    case "voters":
      return <CompetitionVoters />;
    case "rules":
      return <CompetitionRules />;
  }
}
