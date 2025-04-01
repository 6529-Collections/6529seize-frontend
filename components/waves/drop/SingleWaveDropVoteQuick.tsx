import { useQuery } from "@tanstack/react-query";
import { ApiDropsLeaderboardPage } from "../../../generated/models/ApiDropsLeaderboardPage";
import { commonApiFetch } from "../../../services/api/common-api";
import { useEffect, useState } from "react";
import { SingleWaveDropVoteQuickButton } from "./SingleWaveDropVoteQuickButton";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";

interface SingleWaveDropVoteQuickProps {
  readonly drop: ApiDrop;
  readonly setValue: (value: number) => void;
}

interface Result {
  readonly rank: number;
  readonly value: number;
  readonly disabled: boolean;
}

export default function SingleWaveDropVoteQuick({
  drop,
  setValue,
}: SingleWaveDropVoteQuickProps) {
  const maxVotes = drop.context_profile_context?.max_rating ?? 0;
  const minVotes = drop.context_profile_context?.min_rating ?? 0;

  const currentRank = drop.rank ?? 0;
  const pageSize = 2;
  const page =
    currentRank > 0 ? Math.max(1, Math.ceil((currentRank - 2) / pageSize)) : 1;

  const [results, setResults] = useState<Result[]>([]);
  const { data } = useQuery({
    queryKey: [
      QueryKey.DROPS_LEADERBOARD,
      {
        waveId: drop.wave.id,
        type: "quick_vote",
        page_size: pageSize.toString(),
        page: page.toString(),
        sort: "RANK",
        sort_direction: "ASC",
      },
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        page_size: pageSize.toString(),
        sort: "RANK",
        sort_direction: "ASC",
        page: page.toString(),
      };
      return await commonApiFetch<ApiDropsLeaderboardPage>({
        endpoint: `waves/${drop.wave.id}/leaderboard`,
        params,
      });
    },
  });

  useEffect(() => {
    if (!data) {
      setResults([]);
      return;
    }
    const targets = data.drops.filter(
      (d): d is typeof d & { rank: number } =>
        d.rank !== null && d.rank !== drop.rank
    );
    const targetsWithValues = targets.map((d) => ({
      rank: d.rank,
      value: d.rating + 1,
      disabled: d.rating + 1 > maxVotes || d.rating + 1 < minVotes,
    }));
    setResults(targetsWithValues);
  }, [data]);

  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      {results.map((result) => (
        <SingleWaveDropVoteQuickButton
          key={`${result.rank}-${result.value}`}
          value={result.value}
          creditType={drop.wave.voting_credit_type}
          rank={result.rank}
          disabled={result.disabled}
          setValue={setValue}
        />
      ))}
    </div>
  );
} 
