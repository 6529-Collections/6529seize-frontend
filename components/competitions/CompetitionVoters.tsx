"use client";
import { useQuery } from "@tanstack/react-query";
import { useInView } from "@/hooks/useInView";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  WAVE_VOTING_LABELS,
  WAVE_VOTE_STATS_LABELS,
} from "@/helpers/waves/waves.constants";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionResource } from "@/hooks/competitions/useCompetitionQueries";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { WaveLeaderboardRightSidebarVoter } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoter";
import type { ApiCompetitionVoter } from "@/generated/models/ApiCompetitionVoter";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { CompetitionLoadMore } from "./CompetitionLoadMore";
import { CompetitionState } from "./CompetitionState";
import {
  CompetitionVoterSkeleton,
  CompetitionVotesSkeleton,
} from "./CompetitionVotesSkeleton";

type VoterIdentity = Pick<ApiProfileMin, "handle" | "pfp" | "primary_address">;

function toSidebarVoter(voter: ApiCompetitionVoter, identity: VoterIdentity) {
  return {
    voter: {
      id: voter.profile_id,
      handle: identity.handle,
      pfp: identity.pfp,
      primary_address: identity.primary_address,
    },
    absolute_votes_summed: voter.credit_spent,
    positive_votes_summed: (voter.credit_spent + voter.votes) / 2,
    negative_votes_summed: (voter.credit_spent - voter.votes) / 2,
  };
}

function Voter({
  voter,
  position,
  creditType,
}: {
  readonly voter: ApiCompetitionVoter;
  readonly position: number;
  readonly creditType: ApiWaveCreditType;
}) {
  const locale = useBrowserLocale();
  const [ref, isVisible] = useInView<HTMLDivElement>({
    rootMargin: "200px 0px",
  });
  const query = useQuery({
    ...getIdentityQueryOptions({ handleOrWallet: voter.profile_id }),
    // Avoid fetching an entire page of profiles at once and exhausting the API limit.
    enabled: isVisible,
    staleTime: 60_000,
    retry: false,
  });
  const profile = query.data;
  let content;
  if (profile)
    content = (
      <WaveLeaderboardRightSidebarVoter
        position={position}
        creditType={creditType}
        voter={toSidebarVoter(voter, {
          handle: profile.handle,
          pfp: profile.pfp,
          primary_address: profile.primary_wallet,
        })}
      />
    );
  else if (query.isError)
    content = (
      <div
        role="alert"
        className="tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-900 tw-py-3"
      >
        <span className="tw-w-5 tw-shrink-0 tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-400">
          {position}
        </span>
        <div className="tw-flex tw-min-h-11 tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1">
          <span className="tw-text-xs tw-text-iron-400">
            {t(locale, "competitions.voterProfileUnavailable")}
          </span>
          <button
            type="button"
            aria-label={t(locale, "competitions.retryVoterProfile", {
              rank: position,
            })}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            className="tw-inline-flex tw-min-h-8 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-iron-900 tw-px-2.5 tw-text-xs tw-font-semibold tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 enabled:hover:tw-bg-iron-800 disabled:tw-opacity-50"
          >
            {t(locale, "competitions.retry")}
          </button>
        </div>
        <div className="tw-flex tw-max-w-[45%] tw-shrink-0 tw-flex-wrap tw-items-baseline tw-justify-end tw-gap-x-1.5 tw-text-right">
          <span className="tw-break-all tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-100">
            {formatNumberWithCommas(voter.credit_spent)}
          </span>
          <span className="tw-text-xs tw-leading-5 tw-text-iron-400">
            {WAVE_VOTING_LABELS[creditType]} {WAVE_VOTE_STATS_LABELS.TOTAL}
          </span>
        </div>
      </div>
    );
  else content = <CompetitionVoterSkeleton />;
  return <div ref={ref}>{content}</div>;
}
export default function CompetitionVoters() {
  const { competition } = useCompetition();
  const query = useCompetitionResource(
    { waveId: competition.wave_id, competitionId: competition.id },
    "voters"
  );
  if (query.isPending) return <CompetitionVotesSkeleton variant="voters" />;
  if (query.isError)
    return <CompetitionState error retry={() => void query.refetch()} />;
  const voters = query.data.pages.flatMap((page) => page.data);
  const creditType = competition.voting.credit_type as ApiWaveCreditType;
  return (
    <div className="tw-w-full tw-max-w-6xl">
      {!voters.length && <CompetitionState empty />}
      {voters.map((voter, index) =>
        // Newer APIs embed the voter profile in the page; older responses
        // only carry profile_id, so those rows look the identity up.
        voter.voter ? (
          <WaveLeaderboardRightSidebarVoter
            key={voter.profile_id}
            position={index + 1}
            creditType={creditType}
            voter={toSidebarVoter(voter, voter.voter)}
          />
        ) : (
          <Voter
            key={voter.profile_id}
            voter={voter}
            position={index + 1}
            creditType={creditType}
          />
        )
      )}
      <div className="tw-pt-4">
        <CompetitionLoadMore query={query} />
      </div>
    </div>
  );
}
