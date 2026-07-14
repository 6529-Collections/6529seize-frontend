"use client";

import React, { useEffect, useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import PencilIcon from "@/components/utils/icons/PencilIcon";
import { createPortal } from "react-dom";
import UserPageHeaderEditPfp from "./UserPageHeaderEditPfp";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

export default function UserPageHeaderPfpWrapper({
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
  const [isEditPfpOpen, setIsEditPfpOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isEditPfpOpen || typeof document === "undefined") {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarGap =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isEditPfpOpen]);

  if (!canEdit) {
    return <div className="tw-inline-flex tw-w-fit">{children}</div>;
  }

  return (
    <div className="tw-inline-flex tw-w-fit">
      <button
        type="button"
        onClick={() => setIsEditPfpOpen(true)}
        className="tw-group tw-relative tw-inline-flex tw-w-fit tw-rounded-xl tw-border-none tw-bg-transparent tw-p-0"
        aria-label={getUserProfileHeaderMessage("user.profileHeader.pfp.edit", {
          name: profileLabel,
        })}
      >
        {children}

        <div
          aria-hidden="true"
          className="tw-absolute tw-inset-0 tw-z-20 tw-rounded-xl tw-bg-black tw-bg-black/50 tw-bg-opacity-50 tw-opacity-0 tw-transition-opacity tw-duration-300 tw-ease-out hover:tw-opacity-100"
        >
          <div className="tw-absolute tw-bottom-2 tw-right-2">
            <PencilIcon />
          </div>
        </div>
      </button>
      {isEditPfpOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <UserPageHeaderEditPfp
            profile={profile}
            onClose={() => setIsEditPfpOpen(false)}
          />,
          document.body
        )}
    </div>
  );
}
