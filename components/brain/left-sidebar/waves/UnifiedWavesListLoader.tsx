import React from "react";

interface UnifiedWavesListLoaderProps {
  readonly isFetching?: boolean | undefined;
  readonly isFetchingNextPage: boolean;
}

export const UnifiedWavesListLoader: React.FC<UnifiedWavesListLoaderProps> = ({
  isFetching = false,
  isFetchingNextPage,
}) => {
  if (!isFetching && !isFetchingNextPage) {
    return null;
  }

  return (
    <div
      data-testid="loader"
      className="tw-flex tw-justify-center tw-items-center tw-gap-1 tw-py-4 motion-safe:tw-animate-fadeIn"
    >
      <div className="tw-w-1.5 tw-h-1.5 tw-bg-iron-400 tw-rounded-full tw-animate-pulse"></div>
      <div className="tw-w-1.5 tw-h-1.5 tw-bg-iron-400 tw-rounded-full tw-animate-pulse tw-animation-delay-200"></div>
      <div className="tw-w-1.5 tw-h-1.5 tw-bg-iron-400 tw-rounded-full tw-animate-pulse tw-animation-delay-400"></div>
    </div>
  );
};

