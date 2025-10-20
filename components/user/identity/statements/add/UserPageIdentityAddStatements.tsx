"use client";

import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import UserPageIdentityAddStatementsViews from "./UserPageIdentityAddStatementsViews";

export enum STATEMENT_ADD_VIEW {
  SELECT = "SELECT",
  CONTACT = "CONTACT",
  NFT_ACCOUNT = "NFT_ACCOUNT",
  SOCIAL_MEDIA_ACCOUNT = "SOCIAL_MEDIA_ACCOUNT",
  SOCIAL_MEDIA_VERIFICATION_POST = "SOCIAL_MEDIA_VERIFICATION_POST",
}

export default function UserPageIdentityAddStatements({
  profile,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const [activeView, setActiveView] = useState<STATEMENT_ADD_VIEW>(
    STATEMENT_ADD_VIEW.SELECT
  );

  const VIEW_W_CLASS: Record<STATEMENT_ADD_VIEW, string> = {
    [STATEMENT_ADD_VIEW.SELECT]: "sm:tw-max-w-[74rem]",
    [STATEMENT_ADD_VIEW.CONTACT]: "sm:tw-max-w-[26.25rem]",
    [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT]: "sm:tw-max-w-[26.25rem]",
    [STATEMENT_ADD_VIEW.NFT_ACCOUNT]: "sm:tw-max-w-[26.25rem]",
    [STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST]: "sm:tw-max-w-lg",
  };

  return (
    <div className="tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-text-center sm:tw-items-center tw-p-2 lg:tw-p-0">
          <div
            ref={modalRef}
            className={`${VIEW_W_CLASS[activeView]} tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6 lg:tw-p-8`}>
            <UserPageIdentityAddStatementsViews
              profile={profile}
              activeView={activeView}
              setActiveView={setActiveView}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
