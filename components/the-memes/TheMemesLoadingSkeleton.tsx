import PrimaryRouteLoadingStatus from "@/components/navigation/PrimaryRouteLoadingStatus";
import {
  THE_MEMES_CONTAINER_CLASS_NAME,
  THE_MEMES_GRID_CLASS_NAME,
  THE_MEMES_PAGE_CLASS_NAME,
} from "./theMemesLayout";

const CARD_SKELETON_IDS = Array.from({ length: 12 }, (_, index) => index);

function SkeletonBlock({ className }: { readonly className: string }) {
  return <div className={`tw-rounded-md tw-bg-iron-900 ${className}`} />;
}

export default function TheMemesLoadingSkeleton() {
  return (
    <>
      <PrimaryRouteLoadingStatus messageKey="navigation.primary.loading.collections" />
      <div
        aria-hidden="true"
        data-testid="the-memes-loading-skeleton"
        className={THE_MEMES_PAGE_CLASS_NAME}
      >
        <div className={THE_MEMES_CONTAINER_CLASS_NAME}>
          <div className="tw-animate-pulse motion-reduce:tw-animate-none">
            <div className="tw-mb-5 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4 tw-pb-5">
              <SkeletonBlock className="tw-h-9 tw-w-52 tw-max-w-full" />
              <div className="tw-flex tw-w-full tw-max-w-[232px] tw-gap-2">
                <SkeletonBlock className="tw-h-10 tw-min-w-0 tw-flex-1" />
                <SkeletonBlock className="tw-h-10 tw-min-w-0 tw-flex-1" />
              </div>
            </div>
            <div className="tw-mb-5 tw-flex tw-gap-4 tw-overflow-hidden tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/80 tw-pb-4">
              <SkeletonBlock className="tw-h-7 tw-w-28 tw-shrink-0" />
              <SkeletonBlock className="tw-h-7 tw-w-full" />
            </div>
            <div className={`${THE_MEMES_GRID_CLASS_NAME} sm:tw-pt-2`}>
              {CARD_SKELETON_IDS.map((id) => (
                <div
                  key={id}
                  className="tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 max-sm:tw-border-white/5"
                >
                  <SkeletonBlock className="tw-aspect-square tw-w-full tw-rounded-none sm:tw-aspect-auto sm:tw-h-[300px]" />
                  <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-px-2 tw-py-4 max-sm:tw-items-start max-sm:tw-gap-2 max-sm:tw-p-2.5 md:tw-px-4">
                    <SkeletonBlock className="tw-h-5 tw-w-3/4" />
                    <SkeletonBlock className="tw-h-4 tw-w-1/2" />
                    <SkeletonBlock className="tw-h-4 tw-w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
