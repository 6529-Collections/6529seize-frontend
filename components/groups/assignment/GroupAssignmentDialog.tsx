"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FocusTrap } from "focus-trap-react";
import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useKeyPressEvent } from "react-use";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import GroupAssignmentPanel from "./GroupAssignmentPanel";

export default function GroupAssignmentDialog({
  title,
  description,
  suggestedName,
  defaultLabel,
  selectedGroup,
  disabled = false,
  allowGroupClear = true,
  onClose,
  onChange,
  onCreateGroup,
}: {
  readonly title: string;
  readonly description: string;
  readonly suggestedName: string;
  readonly defaultLabel: string;
  readonly selectedGroup: ApiGroupFull | null;
  readonly disabled?: boolean;
  readonly allowGroupClear?: boolean;
  readonly onClose: () => void;
  readonly onChange: (group: ApiGroupFull | null) => void | Promise<void>;
  readonly onCreateGroup: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", (event: KeyboardEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    if (
      activeElement &&
      modalRef.current?.contains(activeElement) &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "SELECT" ||
        activeElement.isContentEditable ||
        activeElement.getAttribute("role") === "combobox")
    ) {
      return;
    }

    onClose();
  });

  return createPortal(
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        fallbackFocus: () => modalRef.current ?? document.body,
      }}
    >
      <div className="tw-relative tw-z-50 tw-cursor-default">
        <div className="tw-fixed tw-inset-0 tw-bg-gray-950/75"></div>
        <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
          <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-px-0 tw-pt-8 tw-text-center sm:tw-items-center sm:tw-p-4">
            <dialog
              ref={modalRef}
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              tabIndex={-1}
              open
              className="tw-relative tw-m-0 tw-flex tw-max-h-[90dvh] tw-w-full tw-transform tw-flex-col tw-overflow-hidden tw-rounded-t-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-0 tw-text-left tw-shadow-2xl tw-transition-all tw-duration-300 sm:tw-max-w-[44rem] sm:tw-rounded-2xl"
            >
              <div className="tw-flex tw-flex-shrink-0 tw-items-start tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-p-5 sm:tw-p-6">
                <div className="tw-min-w-0 tw-flex-1">
                  <p
                    id={titleId}
                    className="tw-mb-1.5 tw-text-lg tw-font-semibold tw-text-iron-50"
                  >
                    {title}
                  </p>
                  <p
                    id={descriptionId}
                    className="tw-mb-0 tw-text-sm tw-leading-5 tw-text-iron-400"
                  >
                    {description}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  type="button"
                  aria-label="Close dialog"
                  className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-p-0 tw-text-iron-400 tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50"
                >
                  <span className="tw-sr-only">Close</span>
                  <FontAwesomeIcon icon={faXmark} className="tw-size-4" />
                </button>
              </div>

              <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-p-5 sm:tw-p-6">
                <GroupAssignmentPanel
                  suggestedName={suggestedName}
                  defaultLabel={defaultLabel}
                  disabled={disabled}
                  selectedGroup={selectedGroup}
                  allowGroupClear={allowGroupClear}
                  collapseOnClickAway={false}
                  layout="dialog"
                  startMode="existing"
                  onChange={onChange}
                  onCreateGroup={onCreateGroup}
                />
              </div>
            </dialog>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
}
