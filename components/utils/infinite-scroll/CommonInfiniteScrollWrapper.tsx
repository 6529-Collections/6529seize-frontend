import type { ReactNode } from "react";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import InfiniteScrollTrigger from "./InfiniteScrollTrigger";

export default function CommonInfiniteScrollWrapper({
  loading,
  onBottomIntersection,
  children,
}: {
  readonly loading: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-overflow-hidden tw-relative">
      {children}
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8 tw-absolute tw-bottom-0">
          <CircleLoader size={CircleLoaderSize.MEDIUM} />
        </div>
      )}
      <InfiniteScrollTrigger onIntersection={onBottomIntersection} />
    </div>
  );
}
