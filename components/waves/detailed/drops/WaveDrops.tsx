import { useInfiniteQuery } from "@tanstack/react-query";
import { Wave } from "../../../../generated/models/Wave";
import DropListWrapper from "../../../drops/view/DropListWrapper";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { commonApiFetch } from "../../../../services/api/common-api";
import { Drop } from "../../../../generated/models/Drop";

const REQUEST_SIZE = 10;

interface Query {
  readonly limit: string;
  readonly context_profile?: string;
  readonly wave_id: string;
  readonly serial_no_less_than?: string;
  readonly include_replies: string;
}

export default function WaveDrops({
  wave,
  availableCredit,
}: {
  readonly wave: Wave;
  readonly availableCredit: number | null;
}) {
  const { connectedProfile } = useContext(AuthContext);

  const query: Query = {
    limit: `${REQUEST_SIZE}`,
    context_profile: connectedProfile?.profile?.handle,
    wave_id: wave.id,
    include_replies: "true",
  };

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
        ...query,
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        ...query,
      };
      if (pageParam) {
        params.serial_no_less_than = `${pageParam}`;
      }
      return await commonApiFetch<Drop[]>({
        endpoint: `drops/`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
    enabled: !!connectedProfile?.profile?.handle,
  });

  const [drops, setDrops] = useState<Drop[]>([]);
  useEffect(
    () =>
      setDrops(
        data?.pages.flat().filter((d) => d.id !== d.wave.description_drop_id) ??
          []
      ),
    [data]
  );

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
      showWaveInfo={true}
      availableCredit={availableCredit}
      onBottomIntersection={onBottomIntersection}
    />
  );
}
