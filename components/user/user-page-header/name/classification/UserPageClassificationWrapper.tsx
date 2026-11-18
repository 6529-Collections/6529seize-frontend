"use client";

import PencilIcon, {
  PencilIconSize,
} from "@/components/utils/icons/PencilIcon";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useState } from "react";
import IconButton from "@/components/utils/button/IconButton";
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
      <IconButton
        type="button"
        layout="edit-profile-classification"
        onClick={() => setIsEditOpen(true)}
        aria-label={getUserProfileHeaderMessage(
          "user.profileHeader.classification.edit",
          { name: profileLabel }
        )}
      >
        <span
          aria-hidden="true"
          className="tw-absolute -tw-left-5 tw-top-1/2 tw-hidden tw-size-4 -tw-translate-y-1/2 tw-items-center tw-justify-center group-focus-within:tw-flex desktop-hover:group-hover:tw-flex touch-only:tw-flex"
        >
          <PencilIcon size={PencilIconSize.SMALL} />
        </span>
      </IconButton>
      {isEditOpen && (
        <UserPageHeaderEditClassification
          profile={profile}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
}
