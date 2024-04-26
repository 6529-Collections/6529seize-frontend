import { useInfiniteQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../../../services/api/common-api";
import { useRouter } from "next/router";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { useContext, useEffect, useState } from "react";
import DropListWrapper from "./DropListWrapper";
import { AuthContext } from "../../auth/Auth";
import { Drop } from "../../../generated/models/Drop";

const REQUEST_SIZE = 10;

export default function Drops() {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string).toLowerCase();
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
      QueryKey.PROFILE_DROPS,
      {
        handleOrWallet,
        context_profile: connectedProfile?.profile?.handle ?? null,
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        limit: `${REQUEST_SIZE}`,
      };
      if (pageParam) {
        params.serial_no_less_than = `${pageParam}`;
      }
      if (connectedProfile?.profile?.handle) {
        params.context_profile = connectedProfile.profile.handle;
      }
      return await commonApiFetch<Drop[]>({
        endpoint: `profiles/${handleOrWallet}/drops`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
  });

  const [drops, setDrops] = useState<Drop[]>([]);

  useEffect(() => setDrops(data?.pages.flat() ?? []), [data]);

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
      onBottomIntersection={onBottomIntersection}
    />
  );
}
