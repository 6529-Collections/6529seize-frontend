import { useState } from "react";
import UserPageIdentityAddStatements from "./UserPageIdentityAddStatements";
import CommonAnimationWrapper from "../../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../../utils/animation/CommonAnimationOpacity";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import PrimaryButton from "../../../../utils/button/PrimaryButton";

export default function UserPageIdentityStatementsAddButton({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const [isAddStatementsOpen, setIsAddStatementsOpen] =
    useState<boolean>(false);

  return (
    <div>
      <PrimaryButton
        loading={false}
        disabled={false}
        onClicked={() => setIsAddStatementsOpen(!isAddStatementsOpen)}
      >
        <svg
          className="tw-h-5 tw-w-5 -tw-ml-1"
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
      </PrimaryButton>

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
