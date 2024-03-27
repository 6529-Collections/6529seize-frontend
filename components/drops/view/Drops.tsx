import { useInfiniteQuery } from "@tanstack/react-query";
import { DropFull } from "../../../entities/IDrop";
import { commonApiFetch } from "../../../services/api/common-api";
import { useRouter } from "next/router";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { useEffect, useState } from "react";
import DropListWrapper from "./DropListWrapper";

const REQUEST_SIZE = 10;

export default function Drops() {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string).toLowerCase();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [QueryKey.PROFILE_DROPS, { handleOrWallet }],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        limit: `${REQUEST_SIZE}`,
      };
      if (pageParam) {
        params.id_less_than = `${pageParam}`;
      }
      return await commonApiFetch<DropFull[]>({
        endpoint: `profiles/${handleOrWallet}/drops`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.id ?? null,
  });

  const onBottomIntersection = (state: boolean) => {
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

  const [drops, setDrops] = useState<DropFull[]>([]);

  useEffect(() => setDrops(data?.pages.flat() ?? []), [data]);

  return (
    <DropListWrapper
      drops={drops}
      loading={isFetching}
      onBottomIntersection={onBottomIntersection}
    />
  );
}
