"use client";
import { useQuery } from "@tanstack/react-query";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionResource } from "@/hooks/competitions/useCompetitionQueries";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { WaveLeaderboardRightSidebarVoter } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoter";
import type { ApiCompetitionVoter } from "@/generated/models/ApiCompetitionVoter";
import type { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { CompetitionLoadMore } from "./CompetitionLoadMore";
import { CompetitionState } from "./CompetitionState";

function Voter({
  voter,
  position,
  creditType,
}: {
  readonly voter: ApiCompetitionVoter;
  readonly position: number;
  readonly creditType: ApiWaveCreditType;
}) {
  const query = useQuery({
    ...getIdentityQueryOptions({ handleOrWallet: voter.profile_id }),
    retry: false,
  });
  if (query.isPending) return <CompetitionState />;
  if (query.isError)
    return <CompetitionState error retry={() => void query.refetch()} />;
  const profile = query.data;
  return (
    <WaveLeaderboardRightSidebarVoter
      position={position}
      creditType={creditType}
      voter={{
        voter: {
          id: voter.profile_id,
          handle: profile.handle,
          pfp: profile.pfp,
          primary_address: profile.primary_wallet,
        },
        absolute_votes_summed: voter.credit_spent,
        positive_votes_summed: (voter.credit_spent + voter.votes) / 2,
        negative_votes_summed: (voter.credit_spent - voter.votes) / 2,
      }}
    />
  );
}
export default function CompetitionVoters() {
  const { competition } = useCompetition();
  const query = useCompetitionResource(
    { waveId: competition.wave_id, competitionId: competition.id },
    "voters"
  );
  if (query.isPending) return <CompetitionState />;
  if (query.isError)
    return <CompetitionState error retry={() => void query.refetch()} />;
  const voters = query.data.pages.flatMap((page) => page.data);
  return (
    <div className="tw-mx-auto tw-w-full tw-max-w-2xl tw-space-y-2">
      {!voters.length && <CompetitionState empty />}
      {voters.map((voter, index) => (
        <Voter
          key={voter.profile_id}
          voter={voter}
          position={index + 1}
          creditType={competition.voting.credit_type as ApiWaveCreditType}
        />
      ))}
      <CompetitionLoadMore query={query} />
    </div>
  );
}
