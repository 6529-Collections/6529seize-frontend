import { useRef } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import UserPageIdentityAddStatementsViews from "./UserPageIdentityAddStatementsViews";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";

export default function UserPageIdentityAddStatements({
  profile,
  onClose,
}: {
  profile: IProfileAndConsolidations;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  return (
    <div className="tw-relative tw-z-10" role="dialog">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
          <div
            ref={modalRef}
            className="tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-neutral-900 tw-text-left tw-shadow-xl tw-transition-all sm:tw-w-full tw-p-6 sm:tw-max-w-4xl"
          >
            <UserPageIdentityAddStatementsViews
              profile={profile}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
