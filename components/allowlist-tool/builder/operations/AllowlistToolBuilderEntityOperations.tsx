import { useContext, useEffect } from "react";
import {
  AllowlistToolBuilderContext,
  AllowlistToolBuilderContextActiveHistory,
} from "../AllowlistToolBuilderContextWrapper";
import AllowlistToolBuilderOperationsList from "./AllowlistToolBuilderOperationsList";
import AllowlistToolAnimationWrapper from "../../common/animation/AllowlistToolAnimationWrapper";
import AllowlistToolAnimationOpacity from "../../common/animation/AllowlistToolAnimationOpacity";
import AllowlistToolBuilderOperationsEmpty from "./AllowlistToolBuilderOperationsEmpty";

export default function AllowlistToolBuilderEntityOperations({
  activeHistory,
}: {
  activeHistory: AllowlistToolBuilderContextActiveHistory;
}) {
  const { setActiveHistory, isGlobalLoading } = useContext(
    AllowlistToolBuilderContext
  );

  useEffect(() => {
    if (isGlobalLoading) {
      setActiveHistory(null);
    }
  }, [isGlobalLoading, setActiveHistory]);

  return (
    <div className="tw-fixed tw-right-0 tw-z-0 tw-inset-y-0 tw-top-[150px] tw-overflow-y-auto tw-w-80 tw-bg-neutral-900 tw-ring-1 tw-ring-white/5">
      <div className="tw-pt-8 tw-pb-4 tw-flex tw-flex-col tw-gap-y-5 tw-bg-neutral-900 tw-px-5">
        <div>
          <div className="tw-w-full tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-lg tw-font-medium tw-text-white">
              {activeHistory.title}
            </span>

            <button
              onClick={(e) => {
                e.preventDefault();
                setActiveHistory(null);
              }}
            >
              Close
            </button>
          </div>
          {activeHistory.subTitle && (
            <div className="tw-text-sm tw-text-neutral-300 tw-mt-1">
              {activeHistory.subTitle}
            </div>
          )}
        </div>
        <AllowlistToolAnimationWrapper mode="wait" initial={true}>
          {activeHistory.operations.length ? (
            <AllowlistToolAnimationOpacity key="table">
              <AllowlistToolBuilderOperationsList
                operations={activeHistory.operations}
                uniqueKey="entity-operations"
              />
            </AllowlistToolAnimationOpacity>
          ) : (
            <AllowlistToolAnimationOpacity key="empty">
              <AllowlistToolBuilderOperationsEmpty />
            </AllowlistToolAnimationOpacity>
          )}
        </AllowlistToolAnimationWrapper>
      </div>
    </div>
  );
}
