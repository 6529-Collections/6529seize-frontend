import { useState } from "react";
import UserPageIdentityAddStatements from "./UserPageIdentityAddStatements";
import CommonAnimationWrapper from "../../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../../utils/animation/CommonAnimationOpacity";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";

export default function UserPageIdentityStatementsAddButton({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const [isAddStatementsOpen, setIsAddStatementsOpen] =
    useState<boolean>(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsAddStatementsOpen(!isAddStatementsOpen)}
        className="tw-inline-flex tw-items-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-rounded-lg tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          className="tw-h-5 tw-w-5 tw-text-white -tw-ml-1 tw-mr-1.5 tw-flex-shrink-0"
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
        <span>Add</span>
      </button>

      <CommonAnimationWrapper mode="sync" initial={true}>
        {isAddStatementsOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <UserPageIdentityAddStatements
              profile={profile}
              onClose={() => setIsAddStatementsOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
