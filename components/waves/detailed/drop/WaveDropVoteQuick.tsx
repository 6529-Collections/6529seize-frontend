import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { ApiDropsLeaderboardPage } from "../../../../generated/models/ApiDropsLeaderboardPage";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useEffect, useState } from "react";
import { WaveDropVoteQuickButton } from "./WaveDropVoteQuickButton";
import { ApiDrop } from "../../../../generated/models/ApiDrop";

interface WaveDropVoteQuickProps {
  readonly drop: ApiDrop;
  readonly setValue: (value: number) => void;
}

interface Result {
  readonly rank: number;
  readonly value: number;
}

export default function WaveDropVoteQuick({
  drop,
  setValue,
}: WaveDropVoteQuickProps) {
  const availableCredit = Math.abs(
    (drop.context_profile_context?.max_rating ?? 0) -
      (drop.context_profile_context?.rating ?? 0)
  );

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
      value: d.rating - drop.rating + 1,
    }));
    setResults(targetsWithValues);
  }, [data]);

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      {results.map((result) => (
        <WaveDropVoteQuickButton
          key={`${result.rank}-${result.value}`}
          value={result.value}
          rank={result.rank}
          availableCredit={availableCredit}
          setValue={setValue}
        />
      ))}
    </div>
  );
}
