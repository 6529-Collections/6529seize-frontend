"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import useCapacitor from "@/hooks/useCapacitor";
import {
  ChevronRightIcon,
  DocumentTextIcon,
  IdentificationIcon,
  PencilSquareIcon,
  PhotoIcon,
  TagIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import UserPageHeaderAboutEdit from "./about/UserPageHeaderAboutEdit";
import UserPageHeaderEditBanner from "./banner/UserPageHeaderEditBanner";
import UserPageHeaderEditName from "./name/UserPageHeaderEditName";
import UserPageHeaderEditClassification from "./name/classification/UserPageHeaderEditClassification";
import UserPageHeaderEditPfp from "./pfp/UserPageHeaderEditPfp";
import { getUserProfileHeaderMessage } from "./user-page-header.messages";

type EditTarget = "banner" | "pfp" | "name" | "classification" | "about";

export default function UserPageHeaderEditProfile({
  profile,
  statement,
  defaultBanner1,
  defaultBanner2,
}: Readonly<{
  profile: ApiIdentity;
  statement: CicStatement | null;
  defaultBanner1: string;
  defaultBanner2: string;
}>) {
  const { isCapacitor } = useCapacitor();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<EditTarget | null>(null);
  const [activeTarget, setActiveTarget] = useState<EditTarget | null>(null);

  const options = [
    {
      target: "banner" as const,
      label: getUserProfileHeaderMessage("user.profileHeader.edit.banner"),
      Icon: PhotoIcon,
    },
    {
      target: "pfp" as const,
      label: getUserProfileHeaderMessage("user.profileHeader.edit.pfp"),
      Icon: UserCircleIcon,
    },
    {
      target: "name" as const,
      label: getUserProfileHeaderMessage("user.profileHeader.edit.name"),
      Icon: IdentificationIcon,
    },
    {
      target: "classification" as const,
      label: getUserProfileHeaderMessage(
        "user.profileHeader.edit.classification"
      ),
      Icon: TagIcon,
    },
    {
      target: "about" as const,
      label: getUserProfileHeaderMessage("user.profileHeader.edit.about"),
      Icon: DocumentTextIcon,
    },
  ];

  const closeMenu = () => {
    setPendingTarget(null);
    setIsMenuOpen(false);
  };

  const selectTarget = (target: EditTarget) => {
    setPendingTarget(target);
    setIsMenuOpen(false);
  };

  const openPendingEditor = () => {
    if (!pendingTarget) {
      return;
    }
    setActiveTarget(pendingTarget);
    setPendingTarget(null);
  };

  const closeEditor = () => {
    setActiveTarget(null);
    globalThis.requestAnimationFrame?.(() => triggerRef.current?.focus());
  };

  return (
    <>
      <Button
        ref={triggerRef}
        variant="tertiary"
        size="sm"
        onClick={() => setIsMenuOpen(true)}
      >
        <PencilSquareIcon className="tw-size-5" aria-hidden="true" />
        <span className="max-[359px]:tw-sr-only">
          {getUserProfileHeaderMessage("user.profileHeader.edit.open")}
        </span>
      </Button>

      <MobileWrapperDialog
        title={getUserProfileHeaderMessage("user.profileHeader.edit.title")}
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onAfterLeave={openPendingEditor}
        showHeaderCloseButton
        showDragHandle={isCapacitor}
        enableDragToClose={isCapacitor}
        headerClassName={isCapacitor ? undefined : "-tw-mt-2 md:tw-mt-0"}
      >
        <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-px-4 sm:tw-px-6">
          {options.map(({ target, label, Icon }) => (
            <li key={target}>
              <button
                type="button"
                onClick={() => selectTarget(target)}
                className="tw-flex tw-min-h-12 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-4 tw-py-3 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/[0.07] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
              >
                <Icon
                  className="tw-size-5 tw-flex-none tw-text-iron-400"
                  aria-hidden="true"
                />
                <span className="tw-min-w-0 tw-flex-1">{label}</span>
                <ChevronRightIcon
                  className="tw-size-4 tw-flex-none tw-text-iron-500"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      </MobileWrapperDialog>

      {activeTarget === "banner" && (
        <UserPageHeaderEditBanner
          profile={profile}
          defaultBanner1={defaultBanner1}
          defaultBanner2={defaultBanner2}
          onClose={closeEditor}
        />
      )}
      {activeTarget === "pfp" && (
        <UserPageHeaderEditPfp profile={profile} onClose={closeEditor} />
      )}
      {activeTarget === "name" && (
        <UserPageHeaderEditName profile={profile} onClose={closeEditor} />
      )}
      {activeTarget === "classification" && (
        <UserPageHeaderEditClassification
          profile={profile}
          onClose={closeEditor}
        />
      )}
      <MobileWrapperDialog
        title={getUserProfileHeaderMessage(
          "user.profileHeader.edit.aboutTitle"
        )}
        isOpen={activeTarget === "about"}
        onClose={closeEditor}
        tabletModal
        showHeaderCloseButton
        headerClassName="-tw-mt-2 md:tw-mt-0"
      >
        <div className="tw-px-4 sm:tw-px-6">
          <UserPageHeaderAboutEdit
            profile={profile}
            statement={statement}
            onClose={closeEditor}
          />
        </div>
      </MobileWrapperDialog>
    </>
  );
}
