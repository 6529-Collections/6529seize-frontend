import type { ApiCompetitionEntryContext } from "@/generated/models/ApiCompetitionEntryContext";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { CompetitionIdentity } from "@/services/api/competitions-api";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { competitionAward } from "@/helpers/competition-presentation.helpers";
import { applyCompetitionDropSummary } from "@/hooks/competitions/useCompetitionDrop";

type CompetitionEntryDrop = ApiCompetitionEntryContext & {
  competition: ApiCompetition;
  original: ApiDrop;
};

export function presentCompetitionEntryDrop(
  result: CompetitionEntryDrop | null,
  identity: CompetitionIdentity,
  viewer: string | null,
  entryId: string,
  dropId: string
) {
  if (!result) return null;
  const {
    original,
    entry,
    competition: currentCompetition,
    vote_summary,
    awards,
  } = result;
  const context = {
    entry,
    competition: currentCompetition,
    vote_summary,
  };
  if (
    ![
      ApiCompetitionEntryStatus.Active,
      ApiCompetitionEntryStatus.Winner,
    ].includes(entry.status)
  )
    return null;
  const drop = applyCompetitionDropSummary(
    {
      ...original,
      // Card refreshes may reuse cached content; entry identity is authoritative.
      author:
        entry.submitter.is_anonymous || original.author.is_anonymous
          ? entry.submitter
          : original.author,
      type: DropSize.FULL,
      stableKey: `${identity.competitionId}:${entryId}`,
      stableHash: `${identity.competitionId}:${entryId}`,
      competition_context: {
        viewer,
        waveId: identity.waveId,
        dropId,
        data: context,
      },
    },
    context
  );
  drop.wave = {
    ...drop.wave,
    authenticated_user_eligible_to_vote: context.competition.permissions.vote,
    forbid_negative_votes: context.competition.voting.forbid_negative_votes,
  };
  if (context.entry.status === ApiCompetitionEntryStatus.Winner) {
    drop.drop_type = ApiDropType.Winner;
    drop.winning_context = {
      place: context.entry.rank ?? 1,
      decision_time: context.entry.won_at ?? context.entry.submitted_at,
      awards: awards
        .filter(
          (award) =>
            award.entry_id === context.entry.id &&
            award.decision_id === context.entry.decision_id
        )
        .map(competitionAward),
    };
  }
  return { entry: context.entry, drop, awards };
}
