import { motion } from "framer-motion";
import React from "react";

interface UnifiedWavesListLoaderProps {
  readonly loadMoreRef: React.RefObject<HTMLDivElement>;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
}

export const UnifiedWavesListLoader: React.FC<UnifiedWavesListLoaderProps> = ({
  loadMoreRef,
  isFetchingNextPage,
  hasNextPage,
}) => {
  if (!hasNextPage || isFetchingNextPage) {
    return null;
  }

  return (
    <div ref={loadMoreRef}>
      {isFetchingNextPage && (
        <motion.div
          className="tw-flex tw-justify-center tw-items-center tw-gap-1  tw-py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="tw-w-1.5 tw-h-1.5 tw-bg-iron-400 tw-rounded-full tw-animate-pulse"></div>
          <div className="tw-w-1.5 tw-h-1.5 tw-bg-iron-400 tw-rounded-full tw-animate-pulse tw-animation-delay-200"></div>
          <div className="tw-w-1.5 tw-h-1.5 tw-bg-iron-400 tw-rounded-full tw-animate-pulse tw-animation-delay-400"></div>
        </motion.div>
      )}
    </div>
  );
};

