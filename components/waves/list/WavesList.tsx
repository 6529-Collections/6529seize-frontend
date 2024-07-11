import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { Wave } from "../../../generated/models/Wave";
import WavesListWrapper from "./WavesListWrapper";
import { useContext, useEffect, useState } from "react";
import { ProfileAvailableDropRateResponse } from "../../../entities/IProfile";
import { AuthContext } from "../../auth/Auth";

const REQUEST_SIZE = 10;
export default function WavesList({
  showCreateNewWaveButton,
  onCreateNewWave,
}: {
  readonly showCreateNewWaveButton?: boolean;
  readonly onCreateNewWave: () => void;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: [QueryKey.WAVES, { limit: REQUEST_SIZE }],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Record<string, string> = {
        limit: `${REQUEST_SIZE}`,
      };

      if (pageParam) {
        params.serial_no_less_than = `${pageParam}`;
      }

      return await commonApiFetch<Wave[]>({
        endpoint: `waves/`,
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.serial_no ?? null,
  });

  const [waves, setWaves] = useState<Wave[]>([]);

  useEffect(() => setWaves(data?.pages.flat() ?? []), [data]);

  const onBottomIntersection = (state: boolean) => {
    if (waves.length < REQUEST_SIZE) {
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

  return (
    <div className="tailwind-scope">
      <div className="tw-max-w-2xl tw-mx-auto tw-py-8">
        <div className="tw-w-full tw-flex tw-items-center tw-justify-between">
          <h1>Waves</h1>
          {showCreateNewWaveButton && (
            <button
              onClick={onCreateNewWave}
              type="button"
              className="tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-size-5 tw-mr-1.5 -tw-ml-1 tw-flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Create New</span>
            </button>
          )}
        </div>
        <div className="tw-mt-6">
          {!waves.length && !isFetching && (
            <div className="tw-text-sm tw-italic tw-text-iron-500">
              No Waves to show
            </div>
          )}
          <WavesListWrapper
            waves={waves}
            loading={isFetching}
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
