import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { commonApiFetch } from "../../../services/api/common-api";
import { useRouter } from "next/router";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { AuthContext } from "../../auth/Auth";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import DropsList from "./DropsList";
import { DropSize, ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";

const REQUEST_SIZE = 10;

export default function Drops() {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string).toLowerCase();
  const { connectedProfile } = useContext(AuthContext);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        context_profile: connectedProfile?.handle ?? null,
      },
    ],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        limit: `${REQUEST_SIZE}`,
        author: handleOrWallet,
        include_replies: "true",
      };
      if (pageParam) {
        params.serial_no_less_than = `${pageParam}`;
      }
      if (connectedProfile?.handle) {
        params.context_profile = connectedProfile.handle;
      }
      return await commonApiFetch<ApiDrop[]>({
        endpoint: `/drops`,
        params,
      });
    },
    initialPageParam: null,
    placeholderData: keepPreviousData,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
  });

  const [drops, setDrops] = useState<ExtendedDrop[]>([]);

  useEffect(
    () =>
      setDrops(
        data?.pages.flat().map((drop) => ({
          ...drop,
          type: DropSize.FULL,
          stableKey: drop.id,
          stableHash: drop.id,
        })) ?? []
      ),
    [data]
  );

  const onBottomIntersection = useCallback(() => {
    if (drops.length < REQUEST_SIZE) {
      return;
    }

    if (status === "pending" || isFetching || isFetchingNextPage || !hasNextPage) {
      return;
    }

    fetchNextPage();
  }, [drops.length, status, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onBottomIntersection();
      }
    }, options);

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onBottomIntersection]);

  useEffect(() => {
    if (bottomRef.current && observerRef.current) {
      observerRef.current.observe(bottomRef.current);
    }

    return () => {
      if (bottomRef.current && observerRef.current) {
        observerRef.current.unobserve(bottomRef.current);
      }
    };
  }, [drops]);

  const onQuoteClick = (drop: ApiDrop) => {
    router.push(`/my-stream?wave=${drop.wave.id}&serialNo=${drop.serial_no}`);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!drops.length && !isFetching) {
    return (
      <div className="tw-text-sm tw-italic tw-text-iron-500">
        No Drops to show
      </div>
    );
  }

  return (
    <div className="tw-overflow-hidden" ref={scrollContainerRef}>
      <DropsList
        scrollContainerRef={scrollContainerRef}
        drops={drops}
        showWaveInfo={true}
        onReply={() => {}}
        onQuote={() => {}}
        onReplyClick={() => {}}
        serialNo={null}
        targetDropRef={null}
        showReplyAndQuote={false}
        activeDrop={null}
        onQuoteClick={onQuoteClick}
        dropViewDropId={null}
      />
      <div ref={bottomRef} style={{ height: "1px" }} />
    </div>
  );
}
