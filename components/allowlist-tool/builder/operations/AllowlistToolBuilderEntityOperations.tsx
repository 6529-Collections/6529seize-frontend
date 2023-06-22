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
    <div className="tw-pt-8 tw-pb-4 tw-flex tw-flex-col tw-bg-neutral-900 tw-px-5">
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
            type="button"
            className="tw-p-2.5 -tw-mr-3 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-neutral-900 tw-border-0 tw-text-neutral-400 hover:tw-text-neutral-50 focus:tw-outline-none tw-transition tw-duration-300 tw-ease-out"
          >
            <span className="sr-only tw-text-sm">Close</span>
            <svg
              className="tw-h-6 tw-w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
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
  );
}
