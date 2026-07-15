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
        className="tw-group tw-relative tw-inline-flex tw-w-fit tw-rounded-xl tw-border-none tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        aria-label={getUserProfileHeaderMessage("user.profileHeader.pfp.edit", {
          name: profileLabel,
        })}
      >
        {children}

        <div
          aria-hidden="true"
          className="tw-absolute tw-inset-1 tw-z-20 tw-rounded-lg tw-bg-black/20 tw-opacity-0 tw-transition-opacity tw-duration-200 tw-ease-out group-focus-visible:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100 touch-only:tw-opacity-100 motion-reduce:tw-transition-none"
        >
          <div className="tw-absolute tw-bottom-2 tw-right-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-black/75 tw-p-1.5 tw-text-white tw-shadow-lg">
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
