"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ChevronRightIcon, PencilIcon } from "@heroicons/react/24/outline";
import {
  DocumentTextIcon,
  IdentificationIcon,
  PhotoIcon,
  TagIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import UserPageHeaderAboutEdit from "./about/UserPageHeaderAboutEdit";
import UserPageHeaderEditBanner from "./banner/UserPageHeaderEditBanner";
import UserPageHeaderEditName from "./name/UserPageHeaderEditName";
import UserPageHeaderEditClassification from "./name/classification/UserPageHeaderEditClassification";
import UserPageHeaderEditPfp from "./pfp/UserPageHeaderEditPfp";
import { getUserProfileHeaderMessage } from "./user-page-header.messages";

type EditTarget = "banner" | "pfp" | "name" | "classification" | "about";

const EDIT_TARGET_MAX_WIDTH_CLASS: Record<EditTarget, string> = {
  banner: "md:tw-max-w-2xl",
  pfp: "md:tw-max-w-2xl",
  name: "md:tw-max-w-xl",
  classification: "md:tw-max-w-xl",
  about: "md:tw-max-w-md",
};

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
  const viewRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<EditTarget | null>(null);
  const [isEditorBusy, setIsEditorBusy] = useState(false);

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

  const selectTarget = (target: EditTarget) => {
    setIsEditorBusy(false);
    setActiveTarget(target);
  };

  const openMenu = () => {
    setActiveTarget(null);
    setIsEditorBusy(false);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  const backToMenu = () => {
    setIsEditorBusy(false);
    setActiveTarget(null);
  };

  const finishDialogLeave = () => {
    setActiveTarget(null);
    setIsEditorBusy(false);
    globalThis.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = globalThis.requestAnimationFrame(() => {
      const view = viewRef.current;
      if (!view) {
        return;
      }

      if (view.parentElement) {
        view.parentElement.scrollTop = 0;
      }
    });

    return () => globalThis.cancelAnimationFrame(frame);
  }, [activeTarget, isOpen]);

  const activeOption = options.find(({ target }) => target === activeTarget);
  const dialogTitle =
    activeTarget === "about"
      ? getUserProfileHeaderMessage("user.profileHeader.edit.aboutTitle")
      : (activeOption?.label ??
        getUserProfileHeaderMessage("user.profileHeader.edit.title"));
  const maxWidthClass = activeTarget
    ? EDIT_TARGET_MAX_WIDTH_CLASS[activeTarget]
    : "md:tw-max-w-md";
  const showScrollbar = activeTarget === "banner" || activeTarget === "pfp";

  return (
    <>
      <Button
        ref={triggerRef}
        variant="tertiary"
        size={null}
        onClick={openMenu}
        aria-label={getUserProfileHeaderMessage("user.profileHeader.edit.open")}
        title={getUserProfileHeaderMessage("user.profileHeader.edit.open")}
        className="tw-group tw-size-11 !tw-rounded-full !tw-border-transparent !tw-bg-transparent !tw-p-1 !tw-shadow-none focus-visible:!tw-outline-none active:!tw-bg-transparent desktop-hover:hover:!tw-border-transparent desktop-hover:hover:!tw-bg-transparent sm:tw-size-10 sm:!tw-p-0.5"
      >
        <span className="tw-box-border tw-inline-flex tw-size-9 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-black/75 tw-text-iron-100 tw-shadow-[0_8px_24px_rgba(0,0,0,0.32)] tw-transition-[background-color,border-color,color,transform] tw-duration-200 tw-ease-out group-focus-visible:tw-ring-2 group-focus-visible:tw-ring-primary-400 group-focus-visible:tw-ring-offset-2 group-focus-visible:tw-ring-offset-black group-active:tw-scale-95 group-active:tw-bg-black desktop-hover:group-hover:tw-border-white/25 desktop-hover:group-hover:tw-bg-black/90 desktop-hover:group-hover:tw-text-white motion-reduce:tw-transform-none motion-reduce:tw-transition-none">
          <PencilIcon className="tw-size-[1.125rem]" aria-hidden="true" />
        </span>
      </Button>

      <MobileWrapperDialog
        title={dialogTitle}
        isOpen={isOpen}
        onClose={closeDialog}
        onBack={activeTarget ? backToMenu : undefined}
        onAfterLeave={finishDialogLeave}
        tabletModal
        showHeaderCloseButton
        showHeaderDivider
        enableDragToClose
        showScrollbar={showScrollbar}
        maxWidthClass={maxWidthClass}
        focusTitleOnOpen
        surfaceClassName="tw-bg-iron-950 md:tw-shadow-2xl"
        headerActions={
          activeTarget === "banner" ? (
            <p className="tw-m-0 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400">
              {getUserProfileHeaderMessage(
                "user.profileHeader.edit.bannerDescription"
              )}
            </p>
          ) : undefined
        }
        dismissible={!isEditorBusy}
      >
        <div ref={viewRef}>
          {activeTarget === null && (
            <div className="tw-px-4 sm:tw-px-6">
              <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
                {options.map(({ target, label, Icon }) => (
                  <li key={target}>
                    <button
                      type="button"
                      onClick={() => selectTarget(target)}
                      className="tw-group/option tw-flex tw-min-h-12 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2.5 tw-py-1.5 tw-text-left tw-text-base tw-font-medium tw-text-iron-100 tw-transition-[background-color,color,transform] tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-scale-[0.99] active:tw-bg-white/[0.07] desktop-hover:hover:tw-bg-white/[0.045] desktop-hover:hover:tw-text-white motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
                    >
                      <span className="tw-flex tw-size-9 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-white/[0.035] tw-text-iron-400 tw-transition-colors tw-duration-200 group-focus-visible/option:tw-border-primary-400/20 group-focus-visible/option:tw-bg-primary-500/10 group-focus-visible/option:tw-text-primary-300 group-active/option:tw-border-primary-400/20 group-active/option:tw-bg-primary-500/10 group-active/option:tw-text-primary-300 desktop-hover:group-hover/option:tw-border-primary-400/20 desktop-hover:group-hover/option:tw-bg-primary-500/10 desktop-hover:group-hover/option:tw-text-primary-300 motion-reduce:tw-transition-none">
                        <Icon className="tw-size-5" aria-hidden="true" />
                      </span>
                      <span className="tw-min-w-0 tw-flex-1 tw-leading-5">
                        {label}
                      </span>
                      <ChevronRightIcon
                        className="tw-mr-1 tw-size-4 tw-flex-none tw-text-iron-700 tw-transition-[color,transform] tw-duration-200 group-focus-visible/option:tw-text-iron-300 group-active/option:tw-text-iron-300 desktop-hover:group-hover/option:tw-translate-x-0.5 desktop-hover:group-hover/option:tw-text-iron-300 motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {activeTarget === "banner" && (
            <UserPageHeaderEditBanner
              profile={profile}
              defaultBanner1={defaultBanner1}
              defaultBanner2={defaultBanner2}
              embedded
              onBusyChange={setIsEditorBusy}
              onClose={closeDialog}
            />
          )}
          {activeTarget === "pfp" && (
            <UserPageHeaderEditPfp
              profile={profile}
              embedded
              onClose={closeDialog}
            />
          )}
          {activeTarget === "name" && (
            <UserPageHeaderEditName
              profile={profile}
              embedded
              onClose={closeDialog}
            />
          )}
          {activeTarget === "classification" && (
            <UserPageHeaderEditClassification
              profile={profile}
              embedded
              onClose={closeDialog}
            />
          )}
          {activeTarget === "about" && (
            <div className="tw-px-4 sm:tw-px-6">
              <UserPageHeaderAboutEdit
                profile={profile}
                statement={statement}
                onClose={closeDialog}
              />
            </div>
          )}
        </div>
      </MobileWrapperDialog>
    </>
  );
}
