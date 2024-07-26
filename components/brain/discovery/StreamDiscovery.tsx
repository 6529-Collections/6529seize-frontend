import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { WavesOverviewParams } from "../../../types/waves.types";
import { WavesOverviewType } from "../../../generated/models/WavesOverviewType";
import { useInfiniteQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { Wave } from "../../../generated/models/Wave";
import { getScaledImageUri, ImageScale } from "../../../helpers/image.helpers";
import Link from "next/link";

export default function StreamDiscovery() {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const getUsePublicWaves = () =>
    !connectedProfile?.profile?.handle || !!activeProfileProxy;
  const [usePublicWaves, setUsePublicWaves] = useState(getUsePublicWaves());

  useEffect(
    () => setUsePublicWaves(getUsePublicWaves()),
    [connectedProfile, activeProfileProxy]
  );

  const getParams = (): Omit<WavesOverviewParams, "offset"> => {
    return {
      limit: 10,
      type: WavesOverviewType.Latest,
    };
  };

  const params = getParams();

  const { data: wavesAuth } = useInfiniteQuery({
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

  const { data: wavesPublic } = useInfiniteQuery({
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

  return (
    <div className="tw-mt-4">
      <div className="tw-bg-iron-950 tw-py-5 tw-px-5 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-shadow-lg">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-inline-flex tw-items-center tw-gap-x-3">
            <svg
              className="tw-inline tw-h-6 tw-w-6 tw-text-indigo-300 tw-mr-1 tw-ml-1"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M46.5 40.5C46.5 41.328 45.828 42 45 42C43.083 42 41.835 42.624 40.392 43.347C38.844 44.1225 37.0905 45 34.5 45C31.896 45 30.135 44.1195 28.581 43.3425C27.141 42.6225 25.8975 42 24 42C22.1025 42 20.859 42.6225 19.419 43.3425C17.865 44.1195 16.104 45 13.5 45C10.9095 45 9.156 44.1225 7.608 43.347C6.165 42.624 4.917 42 3 42C2.172 42 1.5 41.328 1.5 40.5C1.5 39.672 2.172 39 3 39C5.6265 39 7.3935 39.885 8.952 40.665C10.383 41.3805 11.619 42 13.5 42C15.396 42 16.638 41.3775 18.078 40.659C19.632 39.8805 21.3945 39 24 39C26.6055 39 28.368 39.8805 29.922 40.659C31.362 41.3775 32.604 42 34.5 42C36.381 42 37.617 41.3805 39.048 40.665C40.6065 39.885 42.3735 39 45 39C45.828 39 46.5 39.672 46.5 40.5Z"
                fill="currentColor"
              />
              <path
                d="M46.5 33C46.5 33.828 45.828 34.5 45 34.5C43.083 34.5 41.835 35.124 40.392 35.847C38.844 36.6225 37.0905 37.5 34.5 37.5C31.896 37.5 30.135 36.6195 28.581 35.8425C27.141 35.1225 25.8975 34.5 24 34.5C22.1025 34.5 20.859 35.1225 19.419 35.8425C17.865 36.6195 16.104 37.5 13.5 37.5C10.9095 37.5 9.156 36.6225 7.608 35.847C6.165 35.124 4.917 34.5 3 34.5C2.172 34.5 1.5 33.828 1.5 33C1.5 32.172 2.172 31.5 3 31.5C5.6265 31.5 7.3935 32.385 8.952 33.165C10.383 33.8805 11.619 34.5 13.5 34.5C15.396 34.5 16.638 33.8775 18.078 33.159C19.632 32.3805 21.3945 31.5 24 31.5C26.6055 31.5 28.368 32.3805 29.922 33.159C31.362 33.8775 32.604 34.5 34.5 34.5C36.381 34.5 37.617 33.8805 39.048 33.165C40.6065 32.385 42.3735 31.5 45 31.5C45.828 31.5 46.5 32.172 46.5 33Z"
                fill="currentColor"
              />
              <path
                d="M1.5 25.5C1.5 24.672 2.172 24 3 24C8.382 24 10.41 20.1975 12.9765 15.3825C15.918 9.8655 19.578 3 30 3C35.13 3 39 6.2235 39 10.5C39 13.923 36.27 16.5 34.5 16.5C33.672 16.5 33 15.828 33 15C33 14.574 32.9025 13.971 32.058 13.656C30.936 13.239 29.352 13.617 28.6035 14.481C26.865 16.4895 26.526 19.8075 27.78 22.5495C29.067 25.3665 31.722 26.9835 35.064 26.9835C36.6945 26.9835 37.8405 26.388 39.1665 25.698C40.695 24.903 42.4305 24 45 24C45.828 24 46.5 24.672 46.5 25.5C46.5 26.328 45.828 27 45 27C43.1625 27 41.952 27.63 40.5495 28.359C39.0855 29.121 37.4265 29.9835 35.0625 29.9835C30.4965 29.9835 26.847 27.729 25.05 23.796C23.298 19.962 23.814 15.429 26.334 12.5175C27.9 10.71 30.813 9.9915 33.105 10.845C34.0665 11.2035 34.8225 11.808 35.3205 12.585C35.6865 12.0765 36 11.373 36 10.5C36 7.935 33.42 6 30 6C21.378 6 18.5835 11.2425 15.624 16.794C12.9495 21.8115 10.1835 27 3 27C2.172 27 1.5 26.328 1.5 25.5Z"
                fill="currentColor"
              />
            </svg>
            <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
              Latest Waves
            </p>
          </div>
        </div>
        <div className="tw-mt-4 tw-flex tw-flex-col tw-space-y-4">
          {waves.map((wave) => (
            <Link
              key={wave.id}
              href={`/waves/${wave.id}`}
              className="tw-no-underline tw-flex tw-items-center tw-gap-x-3 tw-text-white tw-font-semibold tw-text-sm hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
            >
              {wave.picture ? (
                <img
                  src={getScaledImageUri(wave.picture, ImageScale.W_100_H_AUTO)}
                  alt="#"
                  className="tw-flex-shrink-0 tw-object-contain tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/20"
                />
              ) : (
                <div className="tw-flex-shrink-0 tw-object-contain tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/20" />
              )}
              <span>{wave.name}</span>
            </Link>
          ))}
        </div>
        <Link
          href="/waves"
          className="tw-no-underline tw-inline-flex tw-w-full tw-justify-end tw-pt-2 tw-bg-transparent tw-border-none tw-text-iron-400 hover:tw-text-iron-50 tw-text-sm tw-font-semibold tw-cursor-pointer tw-transition tw-duration-300 tw-ease-out tw-items-center"
        >
          Show more
        </Link>
      </div>
    </div>
  );
}
