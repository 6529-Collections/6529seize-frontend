"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  ChevronRightIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import {
  DocumentTextIcon,
  IdentificationIcon,
  PhotoIcon,
  TagIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<EditTarget | null>(null);
  const [activeTarget, setActiveTarget] = useState<EditTarget | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [returnToMenu, setReturnToMenu] = useState(false);

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
    setIsEditorOpen(true);
    setPendingTarget(null);
  };

  const closeEditor = () => {
    setReturnToMenu(false);
    setIsEditorOpen(false);
  };

  const backToMenu = () => {
    setReturnToMenu(true);
    setIsEditorOpen(false);
  };

  const finishEditorLeave = () => {
    setActiveTarget(null);
    if (returnToMenu) {
      setReturnToMenu(false);
      setIsMenuOpen(true);
      return;
    }
    globalThis.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <>
      <Button
        ref={triggerRef}
        variant="tertiary"
        size={null}
        onClick={() => setIsMenuOpen(true)}
        aria-label={getUserProfileHeaderMessage(
          "user.profileHeader.edit.open"
        )}
        title={getUserProfileHeaderMessage("user.profileHeader.edit.open")}
        className="tw-group tw-size-11 !tw-rounded-full !tw-border-transparent !tw-bg-transparent !tw-p-1 !tw-shadow-none focus-visible:!tw-outline-none desktop-hover:hover:!tw-border-transparent desktop-hover:hover:!tw-bg-transparent active:!tw-bg-transparent sm:tw-size-10 sm:!tw-p-0.5"
      >
        <span className="tw-box-border tw-inline-flex tw-size-9 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-black/75 tw-text-iron-100 tw-shadow-[0_8px_24px_rgba(0,0,0,0.32)] tw-transition-[background-color,border-color,color,transform] tw-duration-200 tw-ease-out group-focus-visible:tw-ring-2 group-focus-visible:tw-ring-primary-400 group-focus-visible:tw-ring-offset-2 group-focus-visible:tw-ring-offset-black desktop-hover:group-hover:tw-border-white/25 desktop-hover:group-hover:tw-bg-black/90 desktop-hover:group-hover:tw-text-white group-active:tw-scale-95 group-active:tw-bg-black motion-reduce:tw-transform-none motion-reduce:tw-transition-none">
          <PencilIcon className="tw-size-[1.125rem]" aria-hidden="true" />
        </span>
      </Button>

      <MobileWrapperDialog
        title={getUserProfileHeaderMessage("user.profileHeader.edit.title")}
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onAfterLeave={openPendingEditor}
        tabletModal
        showHeaderCloseButton
        maxWidthClass="md:tw-max-w-md"
        surfaceClassName="tw-bg-iron-950 md:tw-shadow-2xl"
        headerClassName="-tw-mt-2 tw-pb-4 md:tw-mt-0"
      >
        <div className="tw-px-4 sm:tw-px-6">
          <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1 tw-p-0">
            {options.map(({ target, label, Icon }) => (
              <li key={target}>
                <button
                  type="button"
                  onClick={() => selectTarget(target)}
                  className="tw-group/option tw-flex tw-min-h-14 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2.5 tw-py-2 tw-text-left tw-text-sm tw-font-medium tw-text-iron-100 tw-transition-[background-color,color,transform] tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-scale-[0.99] active:tw-bg-white/[0.07] desktop-hover:hover:tw-bg-white/[0.045] desktop-hover:hover:tw-text-white motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
                >
                  <span className="tw-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-white/[0.035] tw-text-iron-400 tw-transition-colors tw-duration-200 group-active/option:tw-border-primary-400/20 group-active/option:tw-bg-primary-500/10 group-active/option:tw-text-primary-300 group-focus-visible/option:tw-border-primary-400/20 group-focus-visible/option:tw-bg-primary-500/10 group-focus-visible/option:tw-text-primary-300 desktop-hover:group-hover/option:tw-border-primary-400/20 desktop-hover:group-hover/option:tw-bg-primary-500/10 desktop-hover:group-hover/option:tw-text-primary-300 motion-reduce:tw-transition-none">
                    <Icon className="tw-size-5" aria-hidden="true" />
                  </span>
                  <span className="tw-min-w-0 tw-flex-1 tw-leading-5">
                    {label}
                  </span>
                  <ChevronRightIcon
                    className="tw-mr-1 tw-size-4 tw-flex-none tw-text-iron-700 tw-transition-[color,transform] tw-duration-200 group-active/option:tw-text-iron-300 group-focus-visible/option:tw-text-iron-300 desktop-hover:group-hover/option:tw-translate-x-0.5 desktop-hover:group-hover/option:tw-text-iron-300 motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </MobileWrapperDialog>

      {activeTarget === "banner" && (
        <UserPageHeaderEditBanner
          profile={profile}
          defaultBanner1={defaultBanner1}
          defaultBanner2={defaultBanner2}
          isOpen={isEditorOpen}
          onAfterLeave={finishEditorLeave}
          onBack={backToMenu}
          onClose={closeEditor}
        />
      )}
      {activeTarget === "pfp" && (
        <UserPageHeaderEditPfp
          profile={profile}
          isOpen={isEditorOpen}
          onAfterLeave={finishEditorLeave}
          onBack={backToMenu}
          onClose={closeEditor}
        />
      )}
      {activeTarget === "name" && (
        <UserPageHeaderEditName
          profile={profile}
          isOpen={isEditorOpen}
          onAfterLeave={finishEditorLeave}
          onBack={backToMenu}
          onClose={closeEditor}
        />
      )}
      {activeTarget === "classification" && (
        <UserPageHeaderEditClassification
          profile={profile}
          isOpen={isEditorOpen}
          onAfterLeave={finishEditorLeave}
          onBack={backToMenu}
          onClose={closeEditor}
        />
      )}
      <MobileWrapperDialog
        title={getUserProfileHeaderMessage(
          "user.profileHeader.edit.aboutTitle"
        )}
        isOpen={activeTarget === "about" && isEditorOpen}
        onClose={closeEditor}
        onBack={backToMenu}
        onAfterLeave={finishEditorLeave}
        tabletModal
        showHeaderCloseButton
        headerClassName="-tw-mt-2 tw-pb-4 md:tw-mt-0"
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
