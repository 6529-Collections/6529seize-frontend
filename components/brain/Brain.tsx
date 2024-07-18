import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
import DropListWrapper from "../drops/view/DropListWrapper";
import { Mutable } from "../../helpers/Types";
import { useDebounce } from "react-use";
import { AuthContext } from "../auth/Auth";
import { Drop } from "../../generated/models/Drop";
import { ProfileAvailableDropRateResponse } from "../../entities/IProfile";

interface BrainQuery {
  readonly group_id?: string;
  readonly limit: string;
  readonly storm_id?: string;
  readonly context_profile?: string;
}

const REQUEST_SIZE = 10;
export default function Brain() {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowDrops = () =>
    !!connectedProfile?.profile?.handle &&
    connectedProfile.level >= 0 &&
    !activeProfileProxy;

  const [showDrops, setShowDrops] = useState(getShowDrops());
  useEffect(
    () => setShowDrops(getShowDrops()),
    [connectedProfile, activeProfileProxy]
  );

  const getParams = (): BrainQuery => {
    const query: Mutable<BrainQuery> = {
      limit: `${REQUEST_SIZE}`,
    };
    if (connectedProfile?.profile?.handle) {
      query.context_profile = connectedProfile.profile.handle;
    }
    return query;
  };

  const [params, setParams] = useState(getParams());
  useEffect(() => setParams(getParams()), [connectedProfile]);

  const [debouncedParams, setDebouncedParams] = useState<BrainQuery>(params);
  useDebounce(() => setDebouncedParams(params), 200, [params]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [QueryKey.DROPS, debouncedParams],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        ...debouncedParams,
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

  const { data: availableRateResponse } =
    useQuery<ProfileAvailableDropRateResponse>({
      queryKey: [
        QueryKey.PROFILE_AVAILABLE_DROP_RATE,
        connectedProfile?.profile?.handle,
      ],
      queryFn: async () =>
        await commonApiFetch<ProfileAvailableDropRateResponse>({
          endpoint: `profiles/${connectedProfile?.profile?.handle}/drops/available-credit-for-rating`,
        }),
      enabled: !!connectedProfile?.profile?.handle && !activeProfileProxy,
    });

  if (!showDrops) {
    return null;
  }

  return (
    <div className="tailwind-scope">
      <div className="tw-max-w-2xl tw-mx-auto">
        <h1 className="tw-block tw-float-none">Stream</h1>
        <div className="tw-mt-4 lg:tw-mt-6">
          {!drops.length && !isFetching && (
            <div className="tw-text-sm tw-italic tw-text-iron-500">
              No Drops to show
            </div>
          )}
          <DropListWrapper
            drops={drops}
            loading={isFetching}
            showWaveInfo={true}
            availableCredit={
              availableRateResponse?.available_credit_for_rating ?? null
            }
            onBottomIntersection={onBottomIntersection}
          />
        </div>
      </div>
    </div>
  );
}
