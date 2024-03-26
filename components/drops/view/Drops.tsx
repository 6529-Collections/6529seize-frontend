import { useInfiniteQuery } from "@tanstack/react-query";
import { DropFull } from "../../../entities/IDrop";
import { commonApiFetch } from "../../../services/api/common-api";
import DropsList from "./DropsList";
import { useRouter } from "next/router";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { useEffect, useRef } from "react";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import { useIntersection } from "react-use";

const REQUEST_SIZE = 2;

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

  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomIntersection = useIntersection(bottomRef, {
    root: null,
    rootMargin: "0px",
    threshold: 1,
  });

  useEffect(() => {
    if (status === "pending") {
      return;
    }
    if (!bottomIntersection?.isIntersecting) {
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
  }, [bottomIntersection, isFetching, status, hasNextPage, isFetchingNextPage]);

  return (
    <div>
      <DropsList drops={data?.pages.flat() ?? []} />
      {isFetching && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
