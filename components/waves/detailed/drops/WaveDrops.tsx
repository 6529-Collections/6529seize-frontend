import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { Wave } from "../../../../generated/models/Wave";
import DropListWrapper from "../../../drops/view/DropListWrapper";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { commonApiFetch } from "../../../../services/api/common-api";
import { Drop } from "../../../../generated/models/Drop";
import { ActiveDropState } from "../WaveDetailedContent";
import { WaveDropsFeed } from "../../../../generated/models/WaveDropsFeed";

const REQUEST_SIZE = 20;

interface WaveDropsProps {
  readonly wave: Wave;
  readonly onReply: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly onQuote: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
}

export default function WaveDrops({
  wave,
  onReply,
  onQuote,
  activeDrop,
  rootDropId,
}: WaveDropsProps) {
  const { connectedProfile } = useContext(AuthContext);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [
      QueryKey.DROPS,
      {
        waveId: wave.id,
        limit: REQUEST_SIZE,
        dropId: rootDropId,
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        limit: REQUEST_SIZE.toString(),
      };
      if (rootDropId) {
        params.drop_id = rootDropId;
      }
      if (pageParam) {
        params.serial_no_less_than = `${pageParam}`;
      }
      return await commonApiFetch<WaveDropsFeed>({
        endpoint: `waves/${wave.id}/drops`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.drops.at(-1)?.serial_no ?? null,
    placeholderData: keepPreviousData,
    enabled: !!connectedProfile?.profile?.handle,
  });

  const [drops, setDrops] = useState<Drop[]>([]);
  useEffect(() => {
    setDrops(
      data?.pages.flatMap((page) =>
        page.drops.map((drop) => ({
          ...drop,
          wave: page.wave,
        }))
      ) ?? []
    );
  }, [data]);

  const onBottomIntersection = (state: boolean) => {
    if (drops.length < REQUEST_SIZE) {
      return;
    }
    if (!state) {
      return;
    }
    if (status === "pending") {
      return;
    }
    if (isFetching) {
      return;
    }
    if (isFetchingNextPage) {
      return;
    }
    if (!hasNextPage) {
      return;
    }
    fetchNextPage();
  };

  return (
    <DropListWrapper
      drops={drops}
      loading={isFetching}
      showWaveInfo={false}
      rootDropId={rootDropId}
      onBottomIntersection={onBottomIntersection}
      onReply={onReply}
      onQuote={onQuote}
      activeDrop={activeDrop}
    />
  );
}
