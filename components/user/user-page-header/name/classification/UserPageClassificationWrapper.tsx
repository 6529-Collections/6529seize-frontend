"use client";

import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useState } from "react";
import UserPageHeaderEditClassification from "./UserPageHeaderEditClassification";
import { getUserProfileHeaderMessage } from "../../user-page-header.messages";

export default function UserPageClassificationWrapper({
  profile,
  canEdit,
  profileLabel,
  children,
}: {
  readonly profile: ApiIdentity;
  readonly canEdit: boolean;
  readonly profileLabel: string;
  readonly children: React.ReactNode;
}) {
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  if (!canEdit) {
    return <div className="tw-inline-flex tw-items-center">{children}</div>;
  }

  return (
    <div className="tw-group tw-relative tw-inline-flex tw-items-center">
      {children}
      <button
        type="button"
        onClick={() => setIsEditOpen(true)}
        aria-label={getUserProfileHeaderMessage(
          "user.profileHeader.classification.edit",
          { name: profileLabel }
        )}
        className="tw-absolute tw-inset-x-0 tw-top-1/2 tw-m-0 tw-hidden tw-h-6 -tw-translate-y-1/2 tw-border-none tw-bg-transparent tw-p-0 tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none sm:tw-block"
      >
        <span
          aria-hidden="true"
          className="tw-absolute -tw-left-5 tw-top-1/2 tw-hidden tw-size-4 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-text-iron-400 group-focus-within:tw-flex desktop-hover:group-hover:tw-flex touch-only:tw-flex"
        >
          <PencilIcon size={PencilIconSize.SMALL} />
        </span>
      </button>
      {isEditOpen && (
        <UserPageHeaderEditClassification
          profile={profile}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
}
