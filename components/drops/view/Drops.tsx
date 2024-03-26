import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { DropFull } from "../../../entities/IDrop";
import { commonApiFetch } from "../../../services/api/common-api";
import DropsList from "./DropsList";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useRouter } from "next/router";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { useEffect, useRef, useState } from "react";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import { useIntersection } from "react-use";
import React from "react";

const REQUEST_SIZE = 2;

export default function Drops() {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string).toLowerCase();

  const [idLessThan, setIdLessThan] = useState<number | null>(null);

  // const {
  //   isLoading,
  //   isFetching,
  //   data: drops,
  // } = useQuery<DropFull[]>({
  //   queryKey: [
  //     QueryKey.PROFILE_DROPS,
  //     {
  //       handleOrWallet,
  //       limit: REQUEST_SIZE,
  //       idLessThan,
  //     },
  //   ],
  //   queryFn: async () => {
  //     const params: Record<string, string> = {
  //       limit: `${REQUEST_SIZE}`,
  //     };
  //     if (idLessThan) {
  //       params.id_less_than = `${idLessThan}`;
  //     }
  //     return await commonApiFetch<DropFull[]>({
  //       endpoint: `profiles/${handleOrWallet}/drops`,
  //       params,
  //     });
  //   },
  //   placeholderData: keepPreviousData,
  // });

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [QueryKey.PROFILE_DROPS],
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
    if (!bottomIntersection?.isIntersecting) {
      return;
    }
  }, [bottomIntersection]);

  return (
    // <div>
    //   {!!drops?.length && <DropsList drops={drops} />}

    //   {(isLoading || isFetching) && (
    //     <div className="tw-w-full tw-text-center tw-mt-8">
    //       <CircleLoader size={CircleLoaderSize.XXLARGE} />
    //     </div>
    //   )}
    //   <div ref={bottomRef} />
    // </div>
    status === "pending" ? (
      <p>Loading...</p>
    ) : status === "error" ? (
      <p>Error: {error.message}</p>
    ) : (
      <>
        <DropsList drops={data.pages.flat()} />
        <div>
          <button
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
          >
            {isFetchingNextPage
              ? "Loading more..."
              : hasNextPage
              ? "Load More"
              : "Nothing more to load"}
          </button>
        </div>
        <div>{isFetching && !isFetchingNextPage ? "Fetching..." : null}</div>
      </>
    )
  );
}
