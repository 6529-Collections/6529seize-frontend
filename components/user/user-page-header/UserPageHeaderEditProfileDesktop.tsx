"use client";

import MobileWrapperConfirmationDialog from "@/components/mobile-wrapper-dialog/MobileWrapperConfirmationDialog";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import { useRef, useState } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import UserPageHeaderProfileEditor from "./UserPageHeaderProfileEditor";
import { useProfileEditor, type ProfileEditorProps } from "./useProfileEditor";
import { getUserProfileHeaderMessage as message } from "./user-page-header.messages";
import {
  USER_PAGE_HEADER_INTERACTIVE_SURFACE_CLASS,
  USER_PAGE_HEADER_SURFACE_CLASS,
  USER_PAGE_HEADER_TOUCH_TARGET_CLASS,
  PROFILE_EDITOR_TOUCH_TARGETS_CLASS,
} from "./user-page-header-surface";

export default function UserPageHeaderEditProfileDesktop(
  props: ProfileEditorProps
) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        ref={triggerRef}
        variant="tertiary"
        size="sm"
        onClick={() => {
          setIsOpen(true);
        }}
        aria-label={message("user.profileHeader.edit.open")}
        title={message("user.profileHeader.edit.open")}
        className={`${USER_PAGE_HEADER_SURFACE_CLASS} ${USER_PAGE_HEADER_INTERACTIVE_SURFACE_CLASS} ${USER_PAGE_HEADER_TOUCH_TARGET_CLASS}`}
      >
        <PencilIcon className="tw-size-4" aria-hidden="true" />
        <span>{message("user.profileHeader.edit.label")}</span>
      </Button>
      {isOpen && (
        <ProfileEditorDialog
          {...props}
          onClose={() => {
            setIsOpen(false);
            globalThis.requestAnimationFrame(() => triggerRef.current?.focus());
          }}
        />
      )}
    </>
  );
}

function ProfileEditorDialog({
  onClose,
  ...props
}: ProfileEditorProps & {
  readonly onClose: () => void;
}) {
  const editor = useProfileEditor(props);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const close = () => {
    if (editor.saving) return;
    if (editor.dirty) setConfirmDiscard(true);
    else onClose();
  };
  return (
    <>
      <MobileWrapperDialog
        title={message("user.profileHeader.edit.title")}
        isOpen
        onClose={close}
        tabletModal
        tall
        fitVisualViewport
        noPadding
        headerClassName="tw-pt-3"
        showHeaderCloseButton
        showScrollbar
        showDragHandle={false}
        focusTitleOnOpen
        maxWidthClass="md:tw-max-w-xl"
        surfaceClassName={`tw-bg-iron-950 md:tw-shadow-2xl ${PROFILE_EDITOR_TOUCH_TARGETS_CLASS}`}
        dismissible={!editor.saving}
        preserveFocusOnEscape
      >
        <UserPageHeaderProfileEditor
          editor={editor}
          onCancel={close}
          onSaved={onClose}
        />
      </MobileWrapperDialog>
      <MobileWrapperConfirmationDialog
        isOpen={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
        title={message("user.profileHeader.edit.discardTitle")}
        message={message("user.profileHeader.edit.discardMessage")}
        confirmText={message("user.profileHeader.edit.discard")}
        cancelText={message("user.profileHeader.edit.keepEditing")}
        confirmVariant="destructive"
        zIndexClassName="tw-z-[1020]"
        surfaceClassName={`tw-bg-iron-950 ${PROFILE_EDITOR_TOUCH_TARGETS_CLASS}`}
      />
    </>
  );
}
