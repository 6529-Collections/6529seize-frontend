"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import useCapacitor from "@/hooks/useCapacitor";
import {
  ChevronRightIcon,
  PencilSquareIcon,
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
    globalThis.requestAnimationFrame(() => triggerRef.current?.focus());
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
        surfaceClassName="tw-bg-iron-950 tw-shadow-[0_-24px_60px_rgba(0,0,0,0.55)] md:tw-shadow-2xl"
        headerClassName={
          isCapacitor ? "tw-pb-4" : "-tw-mt-2 tw-pb-4 md:tw-mt-0"
        }
      >
        <div className="tw-px-4 sm:tw-px-6">
          <ul className="tw-m-0 tw-list-none tw-space-y-0.5 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-white/[0.025] tw-p-1 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_12px_32px_rgba(0,0,0,0.18)]">
            {options.map(({ target, label, Icon }) => (
              <li key={target}>
                <button
                  type="button"
                  onClick={() => selectTarget(target)}
                  className="tw-group/option tw-flex tw-min-h-14 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-all tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-scale-[0.99] active:tw-bg-white/[0.08] desktop-hover:hover:tw-border-white/[0.06] desktop-hover:hover:tw-bg-white/[0.055] desktop-hover:hover:tw-text-white motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
                >
                  <span className="tw-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/15 tw-bg-primary-500/10 tw-text-primary-300 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.18)] tw-transition-colors tw-duration-200 desktop-hover:group-hover/option:tw-border-primary-400/30 desktop-hover:group-hover/option:tw-bg-primary-500/15 desktop-hover:group-hover/option:tw-text-primary-200">
                    <Icon className="tw-size-5" aria-hidden="true" />
                  </span>
                  <span className="tw-min-w-0 tw-flex-1 tw-leading-5">
                    {label}
                  </span>
                  <ChevronRightIcon
                    className="tw-mr-1 tw-size-4 tw-flex-none tw-text-iron-600 tw-transition-all tw-duration-200 desktop-hover:group-hover/option:tw-translate-x-0.5 desktop-hover:group-hover/option:tw-text-iron-300 motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
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
