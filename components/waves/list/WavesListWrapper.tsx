import { useContext, useEffect, useState } from "react";
import { Wave } from "../../../generated/models/Wave";
import { WavesOverviewType } from "../../../generated/models/WavesOverviewType";
import WaveItem from "./WaveItem";
import { AuthContext } from "../../auth/Auth";
import { WavesOverviewParams } from "../../../types/waves.types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";

const LABELS: Record<WavesOverviewType, string> = {
  [WavesOverviewType.Latest]: "Latest",
  [WavesOverviewType.MostSubscribed]: "Most Followed",
  [WavesOverviewType.HighLevelAuthor]: "High Level Authors",
  [WavesOverviewType.AuthorYouHaveRepped]: "Waves from Authors You Have Repped",
};

const SHOW_ALL_REQUEST_SIZE = 12;
const NORMAL_REQUEST_SIZE = 3;

export default function WavesListWrapper({
  overviewType,
  showAllType,
  setShowAllType,
}: {
  readonly overviewType: WavesOverviewType;
  readonly showAllType: WavesOverviewType | null;
  readonly setShowAllType: (type: WavesOverviewType | null) => void;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const isShowAll = showAllType === overviewType;

  const getUsePublicWaves = () =>
    !connectedProfile?.profile?.handle || !!activeProfileProxy;
  const [usePublicWaves, setUsePublicWaves] = useState(getUsePublicWaves());

  useEffect(
    () => setUsePublicWaves(getUsePublicWaves()),
    [connectedProfile, activeProfileProxy]
  );

  const getParams = (): Omit<WavesOverviewParams, "offset"> => {
    return {
      limit: isShowAll ? SHOW_ALL_REQUEST_SIZE : NORMAL_REQUEST_SIZE,
      type: overviewType,
    };
  };

  const [params, setParams] = useState<Omit<WavesOverviewParams, "offset">>(
    getParams()
  );
  useEffect(() => setParams(getParams()), [overviewType, isShowAll]);

  const {
    data: wavesAuth,
    fetchNextPage: fetchNextPageAuth,
    hasNextPage: hasNextPageAuth,
    isFetching: isFetchingAuth,
    isFetchingNextPage: isFetchingNextPageAuth,
    status: statusAuth,
  } = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_OVERVIEW, params],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const queryParams: Record<string, string> = {
        limit: `${params.limit}`,
        offset: `${pageParam}`,
        type: params.type,
      };
      return await commonApiFetch<Wave[]>({
        endpoint: `waves-overview`,
        params: queryParams,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (_, allPages) => allPages.flat().length,
    enabled: !usePublicWaves,
  });

  const {
    data: wavesPublic,
    fetchNextPage: fetchNextPagePublic,
    hasNextPage: hasNextPagePublic,
    isFetching: isFetchingPublic,
    isFetchingNextPage: isFetchingNextPagePublic,
    status: statusPublic,
  } = useInfiniteQuery({
    queryKey: [QueryKey.WAVES_OVERVIEW_PUBLIC, params],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const queryParams: Record<string, string> = {
        limit: `${params.limit}`,
        offset: `${pageParam}`,
        type: params.type,
      };
      return await commonApiFetch<Wave[]>({
        endpoint: `public/waves-overview`,
        params: queryParams,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (_, allPages) => allPages.flat().length,
    enabled: usePublicWaves,
  });

  const getWaves = (): Wave[] => {
    if (usePublicWaves) {
      return wavesPublic?.pages.flat() ?? [];
    }
    return wavesAuth?.pages.flat() ?? [];
  };

  const [waves, setWaves] = useState<Wave[]>(getWaves());
  useEffect(
    () => setWaves(getWaves()),
    [wavesAuth, wavesPublic, usePublicWaves]
  );

  const onShowAll = () => {
    if (showAllType === overviewType) {
      setShowAllType(null);
      return;
    }
    setShowAllType(overviewType);
  };

  const onBottomIntersection = (state: boolean) => {
    if (waves.length < SHOW_ALL_REQUEST_SIZE) {
      return;
    }
    if (!state) {
      return;
    }
    if (usePublicWaves) {
      if (statusPublic === "pending") {
        return;
      }
      if (isFetchingPublic) {
        return;
      }
      if (isFetchingNextPagePublic) {
        return;
      }
      if (!hasNextPagePublic) {
        return;
      }
      fetchNextPagePublic();
      return;
    }
    if (statusAuth === "pending") {
      return;
    }
    if (isFetchingAuth) {
      return;
    }
    if (isFetchingNextPageAuth) {
      return;
    }
    if (!hasNextPageAuth) {
      return;
    }
    fetchNextPageAuth();
  };

  if (!waves.length) {
    return null;
  }

  return (
    <div>
      <div className="tw-inline-flex tw-w-full tw-items-center tw-justify-between">
        <span className="tw-tracking-tight tw-text-xl tw-font-semibold tw-text-iron-50">
          {LABELS[overviewType]}
        </span>
        {waves.length >= NORMAL_REQUEST_SIZE && (
          <button
            onClick={onShowAll}
            className="tw-whitespace-nowrap tw-bg-transparent tw-border-none tw-text-iron-400 hover:tw-text-iron-50 tw-text-sm tw-font-semibold tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center"
          >
            <span> {isShowAll ? "Show less" : "Show all"}</span>
            <svg
              className="tw-ml-2 tw-flex-shrink-0 tw-h-5 tw-w-5 tw-transform tw-transition-transform tw-duration-300 tw-ease-out"
              style={{ display: isShowAll ? "inline-block" : "none" }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}{" "}
      </div>
      <div className="tw-overflow-hidden">
        <div className="tw-mt-3 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-4">
          {waves.map((wave) => (
            <WaveItem key={`${overviewType}-${wave.id}`} wave={wave} />
          ))}
        </div>
        {isShowAll && (
          <>
            {(isFetchingAuth || isFetchingPublic) && (
              <div className="tw-w-full tw-text-center tw-mt-8">
                <CircleLoader size={CircleLoaderSize.XXLARGE} />
              </div>
            )}
            <CommonIntersectionElement onIntersection={onBottomIntersection} />
          </>
        )}
      </div>
    </div>
  );
}
