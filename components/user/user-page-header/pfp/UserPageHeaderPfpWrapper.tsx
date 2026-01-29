"use client";

import React, { useEffect, useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import PencilIcon from "@/components/utils/icons/PencilIcon";
import { createPortal } from "react-dom";
import UserPageHeaderEditPfp from "./UserPageHeaderEditPfp";

export default function UserPageHeaderPfpWrapper({
  profile,
  canEdit,
  children,
}: {
  readonly profile: ApiIdentity;
  readonly canEdit: boolean;
  readonly children: React.ReactNode;
}) {
  const [isEditPfpOpen, setIsEditPfpOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  return (
    <div>
      <button
        onClick={() => setIsEditPfpOpen(true)}
        disabled={!canEdit}
        className="tw-group tw-bg-transparent tw-border-none tw-relative tw-p-0 tw-rounded-2xl"
        aria-label={canEdit ? "Edit profile picture" : "Profile picture"}>
        {children}

        {canEdit && (
          <div className="edit-profile tw-bg-black/50 tw-absolute tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-transition tw-duration-300 tw-ease-out tw-rounded-2xl">
            <div className="tw-absolute tw-bottom-2 tw-right-2">
              <PencilIcon />
            </div>
          </div>
        )}
      </button>
      {isMounted && isEditPfpOpen &&
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
