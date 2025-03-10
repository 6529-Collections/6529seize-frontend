import React from "react";
import { AnimatedAccordionContent } from "../../common/AnimatedAccordionContent";

interface WaveRollingWinnersLoadingItemProps {
  readonly index: number;
  readonly isExpanded: boolean;
}

export const WaveRollingWinnersLoadingItem: React.FC<WaveRollingWinnersLoadingItemProps> = ({
  index,
  isExpanded,
}) => {
  return (
    <div className="tw-rounded-lg tw-bg-iron-900 tw-border tw-border-iron-800 tw-animate-pulse">
      <div className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-flex-shrink-0 tw-size-6 tw-rounded-md tw-bg-iron-800/50"></div>
          <div className="tw-flex tw-items-center">
            <div className="tw-h-4 tw-w-40 tw-bg-iron-800/50 tw-rounded"></div>
            
            <div className="tw-flex tw-items-center tw-gap-1.5 tw-ml-2">
              <div className="tw-h-3 tw-w-32 tw-bg-iron-800/50 tw-rounded"></div>
              <div className="tw-size-1 tw-rounded-full tw-bg-iron-700/50"></div>
              <div className="tw-h-3 tw-w-16 tw-bg-iron-800/50 tw-rounded"></div>
            </div>
            
            <div className="tw-h-4 tw-w-16 tw-bg-iron-800/50 tw-rounded-md tw-ml-2"></div>
          </div>
        </div>
        <div className="tw-flex tw-items-center">
          <div className="tw-h-7 tw-w-7 tw-rounded-full tw-bg-iron-800/50"></div>
        </div>
      </div>

      <AnimatedAccordionContent isVisible={isExpanded}>
        <div className="tw-space-y-4 tw-bg-black tw-rounded-b-xl tw-border-t tw-border-iron-800 tw-p-4">
          {/* Podium skeleton */}
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3">
            <div className="tw-flex tw-items-end tw-gap-4 tw-justify-center tw-w-full tw-px-4">
              {/* Second place */}
              <div className="tw-flex tw-flex-col tw-items-center">
                <div className="tw-h-20 tw-w-20 tw-rounded-full tw-bg-iron-800/50"></div>
                <div className="tw-h-16 tw-w-24 tw-bg-iron-800/40 tw-rounded-t-lg tw-mt-2"></div>
              </div>
              
              {/* First place */}
              <div className="tw-flex tw-flex-col tw-items-center">
                <div className="tw-h-24 tw-w-24 tw-rounded-full tw-bg-iron-800/50"></div>
                <div className="tw-h-20 tw-w-28 tw-bg-iron-800/40 tw-rounded-t-lg tw-mt-2"></div>
              </div>
              
              {/* Third place */}
              <div className="tw-flex tw-flex-col tw-items-center">
                <div className="tw-h-16 tw-w-16 tw-rounded-full tw-bg-iron-800/50"></div>
                <div className="tw-h-12 tw-w-20 tw-bg-iron-800/40 tw-rounded-t-lg tw-mt-2"></div>
              </div>
            </div>
          </div>
          
          {/* Drops list skeleton */}
          <div className="tw-space-y-3">
            {Array.from({ length: 3 }).map((_, dropIndex) => (
              <div 
                key={`drop-skeleton-${dropIndex}`}
                className="tw-rounded-xl tw-bg-iron-900/50 tw-p-4"
              >
                <div className="tw-flex tw-justify-between tw-items-start">
                  <div className="tw-flex tw-gap-3">
                    <div className="tw-h-10 tw-w-10 tw-rounded-full tw-bg-iron-800/50"></div>
                    <div className="tw-space-y-2">
                      <div className="tw-h-4 tw-w-32 tw-bg-iron-800/50 tw-rounded"></div>
                      <div className="tw-h-3 tw-w-48 tw-bg-iron-800/50 tw-rounded"></div>
                    </div>
                  </div>
                  <div className="tw-h-8 tw-w-16 tw-bg-iron-800/50 tw-rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedAccordionContent>
    </div>
  );
};