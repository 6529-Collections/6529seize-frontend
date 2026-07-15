"use client";

import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import PencilIcon from "@/components/utils/icons/PencilIcon";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import React, { useState } from "react";
import UserPageHeaderEditName from "./UserPageHeaderEditName";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

export default function UserPageHeaderNameWrapper({
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
  const [isEditNameOpen, setIsEditNameOpen] = useState<boolean>(false);

  return (
    <div className="tw-min-w-0">
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
        <div className="tw-min-w-0">{children}</div>
        {canEdit ? (
          <button
            type="button"
            onClick={() => setIsEditNameOpen(true)}
            aria-label={getUserProfileHeaderMessage(
              "user.profileHeader.name.edit",
              { name: profileLabel }
            )}
            className="tw-inline-flex tw-size-11 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-p-0 tw-text-iron-400 tw-transition tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/[0.08] desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none"
          >
            <span aria-hidden="true">
              <PencilIcon />
            </span>
          </button>
        ) : null}
      </div>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isEditNameOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <UserPageHeaderEditName
              profile={profile}
              onClose={() => setIsEditNameOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
