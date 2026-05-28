"use client";

import { AuthContext } from "@/components/auth/Auth";
import SpinnerLoader from "@/components/common/SpinnerLoader";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { DropLocation } from "@/components/waves/drops/Drop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWaveById } from "@/hooks/useWaveById";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import DropsList from "./DropsList";

const REQUEST_SIZE = 10;

type DropAuthorWithBadges = ApiDrop["author"] & {
  readonly badges?: {
    readonly profile_wave_id?: string | null;
    readonly profile_wave_name?: string | null;
    readonly profile_wave_pfp?: string | null;
  } | null;
};

type ProfileWaveBadgeFallback = Pick<ApiWaveMin, "id" | "name" | "picture">;

const getTrimmedText = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed !== undefined && trimmed.length > 0 ? trimmed : null;
};

const getAuthorProfileWaveId = (author: DropAuthorWithBadges): string | null =>
  getTrimmedText(author.profile_wave_id) ??
  getTrimmedText(author.badges?.profile_wave_id);

const withProfileWaveBadgeFallback = (
  drop: ApiDrop,
  profileWave: ProfileWaveBadgeFallback | null
): ApiDrop => {
  if (profileWave === null) {
    return drop;
  }

  const author = drop.author as DropAuthorWithBadges;
  const authorProfileWaveId = getAuthorProfileWaveId(author);

  if (authorProfileWaveId !== profileWave.id) {
    return drop;
  }

  const badges = author.badges ?? {};

  return {
    ...drop,
    author: {
      ...drop.author,
      badges: {
        ...badges,
        profile_wave_id:
          getTrimmedText(badges.profile_wave_id) ?? profileWave.id,
        profile_wave_name:
          getTrimmedText(badges.profile_wave_name) ?? profileWave.name,
        profile_wave_pfp:
          getTrimmedText(badges.profile_wave_pfp) ?? profileWave.picture,
      },
    } as ApiDrop["author"],
  };
};

export default function Drops({
  profileWaveId = null,
}: {
  readonly profileWaveId?: string | null | undefined;
}) {
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const params = useParams();
  const handleOrWallet = (params?.["user"] as string)?.toLowerCase();
  const { connectedProfile } = useContext(AuthContext);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { wave } = useWaveById(profileWaveId, {
    enabled: Boolean(profileWaveId),
  });
  const profileWave = wave?.id === profileWaveId ? wave : null;

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
        params["serial_no_less_than"] = `${pageParam}`;
      }
      if (connectedProfile?.handle) {
        params["context_profile"] = connectedProfile.handle;
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
          ...withProfileWaveBadgeFallback(drop, profileWave),
          type: DropSize.FULL,
          stableKey: drop.id,
          stableHash: drop.id,
        })) ?? []
      ),
    [data, profileWave]
  );

  const onBottomIntersection = useCallback(() => {
    if (drops.length < REQUEST_SIZE) {
      return;
    }

    if (
      status === "pending" ||
      isFetching ||
      isFetchingNextPage ||
      !hasNextPage
    ) {
      return;
    }

    fetchNextPage();
  }, [
    drops.length,
    status,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  ]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
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

  const navigateToDropWave = (drop: Pick<ApiDrop, "wave" | "serial_no">) => {
    const waveInfo = drop.wave as any;
    const isDirectMessage =
      waveInfo?.chat?.scope?.group?.is_direct_message ?? false;
    router.push(
      getWaveRoute({
        waveId: drop.wave.id,
        serialNo: drop.serial_no,
        isDirectMessage,
        isApp,
      })
    );
  };

  const onQuoteClick = (drop: ApiDrop) => {
    navigateToDropWave(drop);
  };

  const onDropContentClick = (drop: ExtendedDrop) => {
    navigateToDropWave(drop);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (status === "pending") {
    return <SpinnerLoader text="Loading drops..." />;
  }

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
        onReplyClick={() => {}}
        serialNo={null}
        targetDropRef={null}
        showReplyAndQuote={false}
        activeDrop={null}
        onQuoteClick={onQuoteClick}
        onDropContentClick={onDropContentClick}
        dropViewDropId={null}
        location={DropLocation.PROFILE}
      />
      <div ref={bottomRef} style={{ height: "1px" }} />
      {isFetchingNextPage && <SpinnerLoader text="Loading more drops..." />}
    </div>
  );
}
