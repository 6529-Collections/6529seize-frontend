import { useRef, useState } from "react";
import UserPageIdentityAddStatements from "../UserPageIdentityAddStatements";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";

export default function UserPageIdentityStatementsAddButton() {
  const [isAddStatementsOpen, setIsAddStatementsOpen] =
    useState<boolean>(false);

  return (
    <>
      <div>
        <button
          onClick={() => setIsAddStatementsOpen(!isAddStatementsOpen)}
          type="button"
          className="tw-cursor-pointer tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-neutral-700 tw-rounded-lg hover:tw-bg-neutral-700 hover:tw-border-neutral-700 active:tw-scale-95 tw-transition tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-h-5 tw-w-5 tw-text-white -tw-ml-1 tw-mr-2 tw-flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
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
          Add
        </button>
        <CommonAnimationWrapper mode="sync" initial={true}>
          {isAddStatementsOpen && (
            <CommonAnimationOpacity
              key="modal"
              elementClasses="tw-relative tw-z-10"
              elementRole="dialog"
              onClicked={(e) => e.stopPropagation()}
            >
              <UserPageIdentityAddStatements
                onClose={() => setIsAddStatementsOpen(false)}
              />
            </CommonAnimationOpacity>
          )}
        </CommonAnimationWrapper>
      </div>
    </>
  );
}
